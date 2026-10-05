import { Injectable } from '@nestjs/common';
import { AppException } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';

export const NotificationType = {
  MATCH: 'MATCH',
  MESSAGE: 'MESSAGE',
  /** A group / activity you are in was changed, cancelled, or you were removed. */
  UPDATE: 'UPDATE',
} as const;

/** Most students announced to per interest add - bounds the work of one click. */
const MAX_MATCH_RECIPIENTS = 50;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listFor(studentId: string, limit = 30) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientId: studentId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { actor: { select: { id: true, name: true, studentId: true } } },
      }),
      this.prisma.notification.count({ where: { recipientId: studentId, readAt: null } }),
    ]);
    return { items, unreadCount };
  }

  async unreadCount(studentId: string) {
    return { unreadCount: await this.prisma.notification.count({ where: { recipientId: studentId, readAt: null } }) };
  }

  async markRead(studentId: string, notificationId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { id: notificationId, recipientId: studentId, readAt: null },
      data: { readAt: new Date() },
    });
    if (count === 0) {
      const exists = await this.prisma.notification.count({ where: { id: notificationId, recipientId: studentId } });
      if (!exists) throw AppException.notFound('Notification not found');
    }
    return { success: true };
  }

  async markAllRead(studentId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { recipientId: studentId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true, count };
  }

  /**
   * `actor` just picked `interestId`. Tell every student who shares it AND had
   * no interest in common with the actor before - i.e. a brand-new match.
   * Each pair is announced once (dedupe key), so re-adding interests never spams.
   */
  async notifyNewMatches(actorId: string, interestId: string): Promise<number> {
    const [actor, interest, sharers, actorOther] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: actorId }, select: { name: true } }),
      this.prisma.interest.findUnique({ where: { id: interestId }, select: { name: true, icon: true } }),
      this.prisma.studentInterest.findMany({
        where: { interestId, studentId: { not: actorId } },
        select: { studentId: true },
      }),
      this.prisma.studentInterest.findMany({
        where: { studentId: actorId, interestId: { not: interestId } },
        select: { interestId: true },
      }),
    ]);
    if (!actor || !interest || sharers.length === 0) return 0;

    // Who already had something else in common with the actor? Not a new match.
    const alreadyMatched = new Set(
      actorOther.length === 0
        ? []
        : (await this.prisma.studentInterest.findMany({
            where: {
              studentId: { in: sharers.map((s) => s.studentId) },
              interestId: { in: actorOther.map((i) => i.interestId) },
            },
            select: { studentId: true },
          })).map((s) => s.studentId),
    );

    const recipients = sharers
      .map((s) => s.studentId)
      .filter((id) => !alreadyMatched.has(id))
      .slice(0, MAX_MATCH_RECIPIENTS);
    if (recipients.length === 0) return 0;

    const { count } = await this.prisma.notification.createMany({
      data: recipients.map((recipientId) => ({
        recipientId,
        actorId,
        type: NotificationType.MATCH,
        title: '🎉 เจอคนที่สนใจเหมือนกัน!',
        body: `${actor.name} ก็สนใจ ${interest.icon} ${interest.name} เหมือนคุณ — ลองทักไปคุยกันดูสิ`,
        link: `/students/${actorId}`,
        dedupeKey: `match:${recipientId}:${actorId}`,
      })),
      skipDuplicates: true,
    });
    return count;
  }

  /** Tell several students about a change (the actor is never told about their own action). */
  async notifyMany(
    recipientIds: string[],
    n: { title: string; body: string; link?: string | null; actorId?: string | null },
  ): Promise<number> {
    const recipients = [...new Set(recipientIds)].filter((id) => id !== n.actorId);
    if (recipients.length === 0) return 0;
    const { count } = await this.prisma.notification.createMany({
      data: recipients.map((recipientId) => ({
        recipientId,
        actorId: n.actorId ?? null,
        type: NotificationType.UPDATE,
        title: n.title,
        body: n.body,
        link: n.link ?? null,
      })),
    });
    return count;
  }

  /** One MESSAGE notification per conversation, refreshed on every new message. */
  async notifyMessage(recipientId: string, senderId: string, senderName: string, conversationId: string, text: string) {
    const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
    const data = {
      title: `💬 ข้อความใหม่จาก ${senderName}`,
      body: preview,
      link: `/chats/${conversationId}`,
      readAt: null,
      createdAt: new Date(),
    };
    await this.prisma.notification.upsert({
      where: { dedupeKey: `message:${conversationId}:${recipientId}` },
      create: {
        ...data,
        recipientId,
        actorId: senderId,
        type: NotificationType.MESSAGE,
        dedupeKey: `message:${conversationId}:${recipientId}`,
      },
      update: data,
    });
  }

  /** Opening a conversation clears its message notification. */
  async clearMessageNotification(recipientId: string, conversationId: string) {
    await this.prisma.notification.updateMany({
      where: { dedupeKey: `message:${conversationId}:${recipientId}`, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
