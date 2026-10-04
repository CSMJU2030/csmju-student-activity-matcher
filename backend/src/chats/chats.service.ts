import { Injectable } from '@nestjs/common';
import { Conversation } from '../../generated/prisma/client';
import { AppException } from '../common/errors';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const STUDENT_CARD = { select: { id: true, studentId: true, name: true, program: true, year: true } } as const;
const PAGE_SIZE = 100;

@Injectable()
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** A conversation is stored once per pair, smaller id first. */
  private pair(x: string, y: string) {
    return x < y ? { studentAId: x, studentBId: y } : { studentAId: y, studentBId: x };
  }

  private async participantOf(meId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    // 404 (not 403) so ids of other people's chats are not confirmed to exist.
    if (!conversation || (conversation.studentAId !== meId && conversation.studentBId !== meId)) {
      throw AppException.notFound('Conversation not found');
    }
    return conversation;
  }

  private myLastRead(c: Conversation, meId: string) {
    return c.studentAId === meId ? c.lastReadAtA : c.lastReadAtB;
  }

  /** My conversations, newest activity first, with the other person, last message and unread count. */
  async list(meId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ studentAId: meId }, { studentBId: meId }] },
      include: {
        studentA: STUDENT_CARD,
        studentB: STUDENT_CARD,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return Promise.all(
      conversations.map(async (c) => {
        const lastRead = this.myLastRead(c, meId);
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: meId },
            ...(lastRead && { createdAt: { gt: lastRead } }),
          },
        });
        return {
          id: c.id,
          other: c.studentAId === meId ? c.studentB : c.studentA,
          lastMessage: c.messages[0] ?? null,
          lastMessageAt: c.lastMessageAt,
          unreadCount,
        };
      }),
    );
  }

  /** Get or start the conversation with another student. */
  async open(meId: string, otherId: string) {
    if (meId === otherId) throw AppException.badRequest('You cannot chat with yourself');
    const other = await this.prisma.student.findUnique({ where: { id: otherId }, ...STUDENT_CARD });
    if (!other) throw AppException.notFound('Student not found');

    const key = this.pair(meId, otherId);
    const conversation = await this.prisma.conversation.upsert({
      where: { studentAId_studentBId: key },
      create: key,
      update: {},
    });
    return { id: conversation.id, other };
  }

  /** Messages (oldest first). Reading also marks the conversation as read for me. */
  async messages(meId: string, conversationId: string, after?: string) {
    const conversation = await this.participantOf(meId, conversationId);
    const otherId = conversation.studentAId === meId ? conversation.studentBId : conversation.studentAId;

    const messages = after
      ? await this.prisma.message.findMany({
          where: { conversationId, createdAt: { gt: new Date(after) } },
          orderBy: { createdAt: 'asc' },
          take: PAGE_SIZE,
        })
      : (await this.prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          take: PAGE_SIZE,
        })).reverse();

    const now = new Date();
    await Promise.all([
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: conversation.studentAId === meId ? { lastReadAtA: now } : { lastReadAtB: now },
      }),
      this.notifications.clearMessageNotification(meId, conversationId),
    ]);

    const other = await this.prisma.student.findUnique({ where: { id: otherId }, ...STUDENT_CARD });
    return { id: conversationId, other, messages };
  }

  async send(meId: string, conversationId: string, text: string) {
    const body = text.trim();
    if (!body) throw AppException.badRequest('Message cannot be empty');
    const conversation = await this.participantOf(meId, conversationId);
    const otherId = conversation.studentAId === meId ? conversation.studentBId : conversation.studentAId;

    const now = new Date();
    const [message, sender] = await Promise.all([
      this.prisma.message.create({ data: { conversationId, senderId: meId, body, createdAt: now } }),
      this.prisma.student.findUnique({ where: { id: meId }, select: { name: true } }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: now,
          ...(conversation.studentAId === meId ? { lastReadAtA: now } : { lastReadAtB: now }),
        },
      }),
    ]);
    await this.notifications.notifyMessage(otherId, meId, sender?.name ?? 'เพื่อน', conversationId, body);
    return message;
  }

  /** Total unread messages across all my chats (for the nav badge). */
  async unreadTotal(meId: string) {
    const list = await this.list(meId);
    return { unreadCount: list.reduce((sum, c) => sum + c.unreadCount, 0) };
  }
}
