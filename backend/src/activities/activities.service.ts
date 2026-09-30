import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.activity.findMany({
      include: { participants: true, interests: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: { participants: true, interests: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async create(coreUserId: string, data: CreateActivityDto) {
    return this.prisma.activity.create({
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        capacity: data.capacity,
        coverImage: data.coverImage,
        creatorId: coreUserId, 
        participants: { create: { studentId: coreUserId } },
        interests: { create: data.interestIds.map((id) => ({ interestId: id })) },
      },
    });
  }

  async joinActivity(coreUserId: string, activityId: string) {
    const activity = await this.prisma.activity.findUnique({ 
      where: { id: activityId }, 
      include: { participants: true } 
    });

    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.participants.length >= activity.capacity) throw new BadRequestException('Activity is full');
    
    const existing = activity.participants.find(p => p.studentId === coreUserId);
    if (existing) throw new BadRequestException('Already joined');

    return this.prisma.activityParticipant.create({
      data: { studentId: coreUserId, activityId }
    });
  }

  async leaveActivity(coreUserId: string, activityId: string) {
    await this.prisma.activityParticipant.delete({
      where: { activityId_studentId: { studentId: coreUserId, activityId } }
    }).catch(() => {
      throw new BadRequestException('Not a participant or activity not found');
    });
    return { success: true };
  }
}
