import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AppException } from '../common/errors';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUpdateStudentDto } from './dto/admin-update-student.dto';
import { DiscoverStudentsQueryDto } from './dto/discover-students.dto';

const STUDENT_INCLUDE = {
  interests: true,
  lookingFors: true,
  groupMembers: true,
  activityParticipants: true,
} satisfies Prisma.StudentInclude;

type StudentWithRelations = Prisma.StudentGetPayload<{ include: typeof STUDENT_INCLUDE }>;

export interface MatchInterest {
  id: string;
  name: string;
  icon: string;
}

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private mapStudent(s: StudentWithRelations) {
    return {
      id: s.id,
      studentId: s.studentId,
      name: s.name,
      faculty: s.faculty,
      program: s.program,
      year: s.year,
      bio: s.bio,
      dataSource: s.dataSource,
      createdAt: s.createdAt.toISOString(),
      interestIds: s.interests.map((i) => i.interestId),
      lookingForIds: s.lookingFors.map((l) => l.lookingForId),
      groupIds: s.groupMembers.map((g) => g.groupId),
      activityIds: s.activityParticipants.map((a) => a.activityId),
    };
  }

  /** Ordered by student code as a number (a plain string sort puts "363" before "6704101301"). */
  async findAll() {
    const students = await this.prisma.student.findMany({ include: STUDENT_INCLUDE });
    return students
      .sort((a, b) => a.studentId.localeCompare(b.studentId, undefined, { numeric: true }))
      .map((s) => this.mapStudent(s));
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id }, include: STUDENT_INCLUDE });
    if (!student) throw AppException.notFound('Student not found');
    return this.mapStudent(student);
  }

  async findByStudentId(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { studentId }, include: STUDENT_INCLUDE });
    if (!student) throw AppException.notFound('Student not found');
    return this.mapStudent(student);
  }

  /**
   * Discover page search. MIS filtered the whole student list in the browser;
   * here every filter runs in PostgreSQL and the result is paginated.
   */
  async discover(query: DiscoverStudentsQueryDto, excludeStudentId?: string) {
    const conditions: Prisma.StudentWhereInput[] = [];

    if (excludeStudentId) conditions.push({ id: { not: excludeStudentId } });

    const q = query.search?.trim();
    if (q) {
      conditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { studentId: { contains: q } },
          { program: { contains: q, mode: 'insensitive' } },
          { interests: { some: { interest: { name: { contains: q, mode: 'insensitive' } } } } },
        ],
      });
    }
    if (query.interestIds?.length) {
      conditions.push({ interests: { some: { interestId: { in: query.interestIds } } } });
    }
    if (query.year) conditions.push({ year: query.year });
    if (query.lookingForId) {
      conditions.push({ lookingFors: { some: { lookingForId: query.lookingForId } } });
    }

    const where: Prisma.StudentWhereInput = conditions.length ? { AND: conditions } : {};
    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: STUDENT_INCLUDE,
        orderBy: { studentId: 'asc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.student.count({ where }),
    ]);

    return { students: students.map((s) => this.mapStudent(s)), total };
  }

  private async assertExists(id: string) {
    const exists = await this.prisma.student.count({ where: { id } });
    if (!exists) throw AppException.notFound('Student not found');
  }

  async updateBio(id: string, bio: string) {
    await this.assertExists(id);
    await this.prisma.student.update({ where: { id }, data: { bio: bio.trim() || null } });
    return { success: true };
  }

  async addInterest(studentId: string, interestId: string) {
    await this.assertExists(studentId);
    const interest = await this.prisma.interest.findUnique({ where: { id: interestId } });
    if (!interest || !interest.isActive) throw AppException.notFound('Interest not found');

    // Idempotent: adding an interest twice is not an error for the UI.
    const key = { studentId_interestId: { studentId, interestId } };
    if (await this.prisma.studentInterest.findUnique({ where: key })) return { success: true, newMatches: 0 };
    await this.prisma.studentInterest.create({ data: { studentId, interestId } });
    const newMatches = await this.notifications.notifyNewMatches(studentId, interestId);
    return { success: true, newMatches };
  }

  async removeInterest(studentId: string, interestId: string) {
    await this.prisma.studentInterest.deleteMany({ where: { studentId, interestId } });
    return { success: true };
  }

  async toggleLookingFor(studentId: string, lookingForId: string) {
    await this.assertExists(studentId);
    const option = await this.prisma.lookingForOption.count({ where: { id: lookingForId } });
    if (!option) throw AppException.notFound('Looking-for option not found');

    const key = { studentId_lookingForId: { studentId, lookingForId } };
    const existing = await this.prisma.studentLookingFor.findUnique({ where: key });
    if (existing) await this.prisma.studentLookingFor.delete({ where: key });
    else await this.prisma.studentLookingFor.create({ data: { studentId, lookingForId } });
    return { success: true, selected: !existing };
  }

  async createCustomInterest(studentId: string, name: string, categoryId: string) {
    await this.assertExists(studentId);
    const normalized = name.trim().replace(/\s+/g, ' ');
    if (normalized.length < 2) throw AppException.badRequest('Interest name too short');
    if (normalized.length > 50) throw AppException.badRequest('Interest name too long');
    if (/^[^a-zA-Z0-9฀-๿]+$/.test(normalized)) {
      throw AppException.badRequest('Interest name must contain letters or numbers');
    }

    const category = await this.prisma.interestCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw AppException.notFound('Category not found');

    // nameLower is unique, so "react" and "React" resolve to the same interest.
    const nameLower = normalized.toLowerCase();
    const interest =
      (await this.prisma.interest.findUnique({ where: { nameLower } })) ??
      (await this.prisma.interest.create({
        // A new game added under "Games" gets the games icon, not a generic star.
        data: { name: normalized, nameLower, icon: category.icon || '⭐', categoryId, isCustom: true },
      }));
    if (!interest.isActive) throw AppException.badRequest('This interest has been disabled by an admin');

    const { newMatches } = await this.addInterest(studentId, interest.id);
    return { success: true, interestId: interest.id, newMatches };
  }

  /**
   * Admin edit of the REG-sourced fields and bio. Changing name / faculty /
   * program / year marks the record as ADMIN so the next REG sync keeps them.
   */
  async adminUpdate(id: string, data: AdminUpdateStudentDto) {
    const current = await this.prisma.student.findUnique({ where: { id } });
    if (!current) throw AppException.notFound('Student not found');

    const next = {
      ...(data.name !== undefined && { name: data.name.trim().replace(/\s+/g, ' ') }),
      ...(data.faculty !== undefined && { faculty: data.faculty.trim() }),
      ...(data.program !== undefined && { program: data.program.trim() }),
      ...(data.year !== undefined && { year: data.year }),
    };
    // Only a real change to a REG-sourced field protects the record from the next sync
    // (the form always sends every field, and a bio edit alone should not count).
    const regChanged = (Object.keys(next) as (keyof typeof next)[]).some((k) => next[k] !== current[k]);
    await this.prisma.student.update({
      where: { id },
      data: {
        ...next,
        ...(data.bio !== undefined && { bio: data.bio.trim() || null }),
        ...(regChanged && { dataSource: 'ADMIN' }),
      },
    });
    return this.findOne(id);
  }

  /**
   * Explainable matching (same formula as MIS): Jaccard similarity of the two
   * students' active interests = |common| / |union| * 100.
   */
  async getMatches(studentId: string, limit = 20) {
    const mine = await this.prisma.studentInterest.findMany({
      where: { studentId, interest: { isActive: true } },
      select: { interestId: true },
    });
    if (mine.length === 0) return [];

    const myInterestIds = new Set(mine.map((si) => si.interestId));
    const candidates = await this.prisma.student.findMany({
      where: { id: { not: studentId }, interests: { some: { interestId: { in: [...myInterestIds] } } } },
      include: {
        interests: {
          where: { interest: { isActive: true } },
          include: { interest: { select: { id: true, name: true, icon: true } } },
        },
      },
    });

    return candidates
      .map((candidate) => {
        const theirIds = new Set(candidate.interests.map((si) => si.interestId));
        const commonInterests: MatchInterest[] = candidate.interests
          .filter((si) => myInterestIds.has(si.interestId))
          .map((si) => si.interest);
        const unionSize = new Set([...myInterestIds, ...theirIds]).size;
        return {
          studentId: candidate.id,
          studentName: candidate.name,
          studentFaculty: candidate.faculty,
          studentProgram: candidate.program,
          studentYear: candidate.year,
          studentBio: candidate.bio,
          commonInterests,
          matchPercentage: unionSize > 0 ? Math.round((commonInterests.length / unionSize) * 100) : 0,
          totalUniqueInterests: unionSize,
        };
      })
      .filter((m) => m.commonInterests.length > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage || b.commonInterests.length - a.commonInterests.length)
      .slice(0, limit);
  }

  /** Common interests + match % between two students (student profile view). */
  async getCommonInterests(studentAId: string, studentBId: string) {
    const [a, b] = await Promise.all(
      [studentAId, studentBId].map((id) =>
        this.prisma.studentInterest.findMany({
          where: { studentId: id, interest: { isActive: true } },
          include: { interest: { select: { id: true, name: true, icon: true } } },
        }),
      ),
    );
    const bIds = new Set(b.map((si) => si.interestId));
    const commonInterests: MatchInterest[] = a.filter((si) => bIds.has(si.interestId)).map((si) => si.interest);
    const unionSize = new Set([...a.map((si) => si.interestId), ...bIds]).size;
    return {
      commonInterests,
      matchPercentage: unionSize > 0 ? Math.round((commonInterests.length / unionSize) * 100) : 0,
    };
  }

  async getDashboardData(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        interests: { where: { interest: { isActive: true } }, include: { interest: true } },
        groupMembers: true,
        activityParticipants: true,
      },
    });
    if (!student) throw AppException.notFound('Student not found');

    const myInterestIds = student.interests.map((i) => i.interestId);
    const today = new Date().toISOString().split('T')[0];

    const [topMatches, upcomingActivities, recommendedGroups] = await Promise.all([
      this.getMatches(studentId, 4),
      this.prisma.activity.findMany({
        where: { date: { gte: today } },
        include: { participants: true, interests: { include: { interest: true } } },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
        take: 4,
      }),
      // Groups I'm not in that share an interest with me - filtered in SQL, not in memory.
      myInterestIds.length === 0
        ? Promise.resolve([])
        : this.prisma.group.findMany({
            where: {
              members: { none: { studentId } },
              interests: { some: { interestId: { in: myInterestIds } } },
            },
            include: { members: true, interests: { include: { interest: true } } },
            orderBy: { members: { _count: 'desc' } },
            take: 3,
          }),
    ]);

    return {
      studentInterests: student.interests.map((i) => i.interest),
      groupsCount: student.groupMembers.length,
      activitiesCount: student.activityParticipants.length,
      topMatches,
      upcomingActivities,
      recommendedGroups,
    };
  }
}
