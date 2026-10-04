import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AppException } from '../common/errors';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { QueryGroupsDto } from './dto/query-groups.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

const GROUP_INCLUDE = { members: true, interests: true } satisfies Prisma.GroupInclude;
type GroupWithRelations = Prisma.GroupGetPayload<{ include: typeof GROUP_INCLUDE }>;

/** Who performed a change, for the notifications it sends. */
export interface Actor {
  studentId: string | null;
  label: string;
}

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private mapGroup(g: GroupWithRelations) {
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      coverImage: g.coverImage,
      creatorId: g.creatorId,
      createdAt: g.createdAt.toISOString(),
      members: g.members.map((m) => ({ studentId: m.studentId })),
      interests: g.interests.map((i) => ({ interestId: i.interestId })),
    };
  }

  async findAll(query: QueryGroupsDto = {}) {
    const q = query.search?.trim();
    const where: Prisma.GroupWhereInput = {
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(query.memberId && { members: { some: { studentId: query.memberId } } }),
    };
    const groups = await this.prisma.group.findMany({
      where,
      include: GROUP_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return groups.map((g) => this.mapGroup(g));
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({ where: { id }, include: GROUP_INCLUDE });
    if (!group) throw AppException.notFound('Group not found');
    return this.mapGroup(group);
  }

  /** The group's creator (for ownership checks). */
  async creatorOf(id: string): Promise<string> {
    const group = await this.prisma.group.findUnique({ where: { id }, select: { creatorId: true } });
    if (!group) throw AppException.notFound('Group not found');
    return group.creatorId;
  }

  private async assertInterestsExist(ids: string[]) {
    const unique = [...new Set(ids)];
    const found = await this.prisma.interest.count({ where: { id: { in: unique }, isActive: true } });
    if (found !== unique.length) throw AppException.badRequest('One or more interests do not exist');
    return unique;
  }

  async createGroup(creatorStudentId: string, data: CreateGroupDto) {
    const interestIds = await this.assertInterestsExist(data.interestIds);
    const group = await this.prisma.group.create({
      data: {
        name: data.name.trim(),
        description: data.description.trim(),
        coverImage: data.coverImage?.trim() || null,
        creatorId: creatorStudentId,
        members: { create: { studentId: creatorStudentId } },
        interests: { create: interestIds.map((interestId) => ({ interestId })) },
      },
    });
    return { success: true, groupId: group.id };
  }

  /** Creator or admin. Interests, when given, replace the current set. */
  async update(id: string, data: UpdateGroupDto) {
    await this.creatorOf(id);
    const interestIds = data.interestIds ? await this.assertInterestsExist(data.interestIds) : undefined;
    await this.prisma.$transaction([
      ...(interestIds ? [this.prisma.groupInterest.deleteMany({ where: { groupId: id } })] : []),
      this.prisma.group.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.description !== undefined && { description: data.description.trim() }),
          ...(data.coverImage !== undefined && { coverImage: data.coverImage.trim() || null }),
          ...(interestIds && { interests: { create: interestIds.map((interestId) => ({ interestId })) } }),
        },
      }),
    ]);
    return this.findOne(id);
  }

  /** Creator or admin. Members are told the group is gone. */
  async remove(id: string, actor: Actor) {
    const group = await this.prisma.group.findUnique({ where: { id }, include: { members: true } });
    if (!group) throw AppException.notFound('Group not found');
    await this.prisma.group.delete({ where: { id } });
    await this.notifications.notifyMany(group.members.map((m) => m.studentId), {
      title: '🗑️ กลุ่มถูกลบ',
      body: `กลุ่ม "${group.name}" ถูกลบโดย${actor.label}`,
      link: '/groups',
      actorId: actor.studentId,
    });
    return { success: true };
  }

  async joinGroup(studentId: string, groupId: string) {
    const group = await this.prisma.group.count({ where: { id: groupId } });
    if (!group) throw AppException.notFound('Group not found');

    const key = { groupId_studentId: { studentId, groupId } };
    if (await this.prisma.groupMember.findUnique({ where: key })) {
      throw AppException.conflict('Already a member of this group');
    }
    await this.prisma.groupMember.create({ data: { studentId, groupId } });
    return { success: true };
  }

  async leaveGroup(studentId: string, groupId: string) {
    if ((await this.creatorOf(groupId)) === studentId) {
      // Otherwise a group can end up with no members while its creator still "owns" it.
      throw AppException.badRequest('The creator cannot leave their own group - delete the group instead');
    }
    const { count } = await this.prisma.groupMember.deleteMany({ where: { studentId, groupId } });
    if (count === 0) throw AppException.badRequest('You are not a member of this group');
    return { success: true };
  }

  /** Creator or admin removes someone else; the removed student is told. */
  async removeMember(groupId: string, studentId: string, actor: Actor) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId }, select: { name: true, creatorId: true } });
    if (!group) throw AppException.notFound('Group not found');
    if (group.creatorId === studentId) throw AppException.badRequest('The creator cannot be removed from their own group');
    const { count } = await this.prisma.groupMember.deleteMany({ where: { groupId, studentId } });
    if (count === 0) throw AppException.notFound('This student is not a member of the group');
    await this.notifications.notifyMany([studentId], {
      title: '👥 ถูกนำออกจากกลุ่ม',
      body: `คุณถูกนำออกจากกลุ่ม "${group.name}" โดย${actor.label}`,
      link: '/groups',
      actorId: actor.studentId,
    });
    return { success: true };
  }
}
