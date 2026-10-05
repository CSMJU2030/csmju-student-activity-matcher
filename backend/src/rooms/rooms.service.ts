import { Injectable } from '@nestjs/common';
import { BookingStatus } from '../../generated/prisma/client';
import { AppException } from '../common/errors';
import { ReferenceDataService } from '../core-hub/reference-data.service';
import { Room } from '../core-hub/reference-data.types';
import { PrismaService } from '../prisma/prisma.service';
import { QueryRoomsDto } from './dto/query-rooms.dto';

/**
 * Rooms are Core Hub reference data (GET /api/v1/rooms). Core Hub owns them -
 * they are added and closed in the Core Hub backoffice - and this subsystem
 * keeps no copy: a booking stores the room `code` only, and everything shown
 * about a room comes through ReferenceDataService, which caches it.
 */
@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceData: ReferenceDataService,
  ) {}

  /** Rooms open in Core Hub. The whole list is cached, so filtering and paging happen here. */
  async findAll(query: QueryRoomsDto, token: string): Promise<{ items: Room[]; total: number }> {
    const needle = query.q?.toLowerCase();
    const rooms = await this.referenceData.list<Room>(
      'rooms',
      token,
      needle
        ? (room) =>
            [room.code, room.nameTh, room.building].some((text) =>
              text?.toLowerCase().includes(needle),
            )
        : undefined,
    );

    const sorted = [...rooms].sort((a, b) => a.code.localeCompare(b.code));
    return { items: sorted.slice(query.skip, query.skip + query.take), total: sorted.length };
  }

  /** One room - also one Core Hub has closed, so old bookings still show its name. */
  async findOne(code: string, token: string): Promise<Room> {
    const room = await this.find(code, token);
    if (!room) {
      throw AppException.notFound('Room not found');
    }
    return room;
  }

  /** Like findOne, but a code Core Hub does not know is `null` instead of a 404. */
  find(code: string, token: string): Promise<Room | null> {
    return this.referenceData.get<Room>('rooms', code, token);
  }

  /**
   * Room details for a page of bookings. A code Core Hub cannot answer for -
   * unknown, or Core Hub down with nothing cached - maps to `null`, and the
   * page shows the bare code instead of failing.
   */
  async describe(codes: string[], token: string): Promise<Map<string, Room | null>> {
    const rooms = new Map<string, Room | null>();
    for (const code of new Set(codes)) {
      rooms.set(code, await this.find(code, token).catch(() => null));
    }
    return rooms;
  }

  /**
   * When the room is taken over the next `days` days — times and status only.
   * Everyone who may see rooms sees this, so it carries no requester identity.
   */
  async schedule(
    code: string,
    token: string,
    days = 14,
  ): Promise<Array<{ startsAt: Date; endsAt: Date; status: BookingStatus }>> {
    await this.findOne(code, token);
    const from = new Date();
    const until = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);

    const bookings = await this.prisma.booking.findMany({
      where: {
        roomCode: code,
        status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
        endsAt: { gt: from },
        startsAt: { lt: until },
      },
      orderBy: { startsAt: 'asc' },
    });

    return bookings.map(({ startsAt, endsAt, status }) => ({ startsAt, endsAt, status }));
  }
}
