import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AppException } from '../common/errors';
import { Actor } from '../groups/groups.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

const ACTIVITY_INCLUDE = { participants: true, interests: true } satisfies Prisma.ActivityInclude;
type ActivityWithRelations = Prisma.ActivityGetPayload<{ include: typeof ACTIVITY_INCLUDE }>;

/** yyyy-mm-dd for today in the server's timezone. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private mapActivity(a: ActivityWithRelations) {
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      date: a.date,
      time: a.time,
      location: a.location,
      capacity: a.capacity,
      coverImage: a.coverImage,
      creatorId: a.creatorId,
      createdAt: a.createdAt.toISOString(),
      participants: a.participants.map((p) => ({ studentId: p.studentId })),
      interests: a.interests.map((i) => ({ interestId: i.interestId })),
    };
  }

  async findAll(query: Partial<QueryActivitiesDto> = {}) {
    const q = query.search?.trim();
    const where: Prisma.ActivityWhereInput = {
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(query.upcoming && { date: { gte: today() } }),
    };
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: ACTIVITY_INCLUDE,
        orderBy: query.upcoming ? [{ date: 'asc' }, { time: 'asc' }] : { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activity.count({ where }),
    ]);
    return { items: activities.map((a) => this.mapActivity(a)), total, page, limit };
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id }, include: ACTIVITY_INCLUDE });
    if (!activity) throw AppException.notFound('Activity not found');
    return this.mapActivity(activity);
  }

  async create(creatorStudentId: string, data: CreateActivityDto) {
    if (data.date < today()) throw AppException.badRequest('Activity date cannot be in the past');

    const interestIds = [...new Set(data.interestIds)];
    const found = await this.prisma.interest.count({ where: { id: { in: interestIds }, isActive: true } });
    if (found !== interestIds.length) throw AppException.badRequest('One or more interests do not exist');

    const activity = await this.prisma.activity.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        date: data.date,
        time: data.time,
        location: data.location.trim(),
        capacity: data.capacity,
        coverImage: data.coverImage?.trim() || null,
        creatorId: creatorStudentId,
        participants: { create: { studentId: creatorStudentId } },
        interests: { create: interestIds.map((interestId) => ({ interestId })) },
      },
      include: ACTIVITY_INCLUDE,
    });
    return this.mapActivity(activity);
  }

  /**
   * Capacity check and insert run in one SERIALIZABLE transaction, so two
   * students cannot both take the last seat (MIS checked, then inserted).
   */
  async joinActivity(studentId: string, activityId: string) {
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const activity = await tx.activity.findUnique({
            where: { id: activityId },
            include: { participants: { select: { studentId: true } } },
          });
          if (!activity) throw AppException.notFound('Activity not found');
          if (activity.participants.some((p) => p.studentId === studentId)) {
            throw AppException.conflict('Already joined this activity');
          }
          if (activity.participants.length >= activity.capacity) {
            throw AppException.conflict('Activity is full');
          }
          if (activity.date < today()) throw AppException.badRequest('This activity has already ended');

          await tx.activityParticipant.create({ data: { studentId, activityId } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw AppException.conflict('Someone else just joined - please try again');
      }
      throw error;
    }
    return { success: true };
  }

  /** The activity's creator (for ownership checks). */
  async creatorOf(id: string): Promise<string> {
    const activity = await this.prisma.activity.findUnique({ where: { id }, select: { creatorId: true } });
    if (!activity) throw AppException.notFound('Activity not found');
    return activity.creatorId;
  }

  /**
   * Creator or admin. Participants are told when the date, time or place changes,
   * so what students see always matches what the admin set.
   */
  async update(id: string, data: UpdateActivityDto, actor: Actor) {
    const current = await this.prisma.activity.findUnique({ where: { id }, include: { participants: true } });
    if (!current) throw AppException.notFound('Activity not found');

    if (data.date !== undefined && data.date !== current.date && data.date < today()) {
      throw AppException.badRequest('Activity date cannot be in the past');
    }
    if (data.capacity !== undefined && data.capacity < current.participants.length) {
      throw AppException.badRequest(`Capacity cannot be below the ${current.participants.length} people who already joined`);
    }
    let interestIds: string[] | undefined;
    if (data.interestIds) {
      interestIds = [...new Set(data.interestIds)];
      const found = await this.prisma.interest.count({ where: { id: { in: interestIds }, isActive: true } });
      if (found !== interestIds.length) throw AppException.badRequest('One or more interests do not exist');
    }

    await this.prisma.$transaction([
      ...(interestIds ? [this.prisma.activityInterest.deleteMany({ where: { activityId: id } })] : []),
      this.prisma.activity.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title.trim() }),
          ...(data.description !== undefined && { description: data.description.trim() }),
          ...(data.date !== undefined && { date: data.date }),
          ...(data.time !== undefined && { time: data.time }),
          ...(data.location !== undefined && { location: data.location.trim() }),
          ...(data.capacity !== undefined && { capacity: data.capacity }),
          ...(data.coverImage !== undefined && { coverImage: data.coverImage.trim() || null }),
          ...(interestIds && { interests: { create: interestIds.map((interestId) => ({ interestId })) } }),
        },
      }),
    ]);

    const changes = [
      data.date !== undefined && data.date !== current.date && `วันที่ ${data.date}`,
      data.time !== undefined && data.time !== current.time && `เวลา ${data.time}`,
      data.location !== undefined && data.location.trim() !== current.location && `สถานที่ ${data.location.trim()}`,
    ].filter(Boolean);
    if (changes.length > 0) {
      await this.notifications.notifyMany(current.participants.map((p) => p.studentId), {
        title: '📅 กิจกรรมมีการเปลี่ยนแปลง',
        body: `"${data.title?.trim() || current.title}" เปลี่ยนเป็น ${changes.join(', ')} (โดย${actor.label})`,
        link: `/activities/${id}`,
        actorId: actor.studentId,
      });
    }
    return this.findOne(id);
  }

  /** Creator or admin. Participants are told it was cancelled. */
  async remove(id: string, actor: Actor) {
    const activity = await this.prisma.activity.findUnique({ where: { id }, include: { participants: true } });
    if (!activity) throw AppException.notFound('Activity not found');
    await this.prisma.activity.delete({ where: { id } });
    await this.notifications.notifyMany(activity.participants.map((p) => p.studentId), {
      title: '❌ กิจกรรมถูกยกเลิก',
      body: `"${activity.title}" (${activity.date}) ถูกยกเลิกโดย${actor.label}`,
      link: '/activities',
      actorId: actor.studentId,
    });
    return { success: true };
  }

  /** Creator or admin removes a participant; they are told. */
  async removeParticipant(activityId: string, studentId: string, actor: Actor) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId }, select: { title: true, creatorId: true } });
    if (!activity) throw AppException.notFound('Activity not found');
    if (activity.creatorId === studentId) throw AppException.badRequest('The creator cannot be removed from their own activity');
    const { count } = await this.prisma.activityParticipant.deleteMany({ where: { activityId, studentId } });
    if (count === 0) throw AppException.notFound('This student has not joined the activity');
    await this.notifications.notifyMany([studentId], {
      title: '🎯 ถูกนำออกจากกิจกรรม',
      body: `คุณถูกนำออกจากกิจกรรม "${activity.title}" โดย${actor.label}`,
      link: '/activities',
      actorId: actor.studentId,
    });
    return { success: true };
  }

  async leaveActivity(studentId: string, activityId: string) {
    if ((await this.creatorOf(activityId)) === studentId) {
      throw AppException.badRequest('The creator cannot leave their own activity - delete it instead');
    }
    const { count } = await this.prisma.activityParticipant.deleteMany({ where: { studentId, activityId } });
    if (count === 0) throw AppException.badRequest('You have not joined this activity');
    return { success: true };
  }
}
