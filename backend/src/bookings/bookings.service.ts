import { Injectable } from '@nestjs/common';
import { Booking, BookingStatus, Prisma } from '../../generated/prisma/client';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { Permission, can } from '../auth/permissions';
import { AppException } from '../common/errors';
import { Room } from '../core-hub/reference-data.types';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { ReviewBookingDto } from './dto/review-booking.dto';

/**
 * A booking as the API returns it: the stored row plus the Core Hub room for
 * its `roomCode`, or `null` when Core Hub cannot say (the page shows the code).
 */
export type BookingWithRoom = Booking & { room: Room | null };

/** Bookings that still hold the room and so block an overlapping request. */
const HOLDING: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.APPROVED];

/** Longest single booking. */
const MAX_DURATION_MS = 8 * 60 * 60 * 1000;

/**
 * Every method takes the caller's Core Hub access token: rooms are read from
 * Core Hub with the caller's own permissions (see RoomsService).
 */
@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rooms: RoomsService,
  ) {}

  /** Staff see every booking; everyone else only their own. */
  async findAll(
    user: CoreHubIdentity,
    query: QueryBookingsDto,
    token: string,
  ): Promise<{ items: BookingWithRoom[]; total: number }> {
    const where: Prisma.BookingWhereInput = {
      status: query.status,
      roomCode: query.roomCode,
      ...(can(user.subsystemRole, Permission.BOOKING_READ_ANY) ? {} : { coreUserId: user.id }),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.booking.count({ where }),
    ]);

    const rooms = await this.rooms.describe(
      bookings.map((booking) => booking.roomCode),
      token,
    );
    const items = bookings.map((booking) => ({
      ...booking,
      room: rooms.get(booking.roomCode) ?? null,
    }));

    return { items, total };
  }

  async findOne(user: CoreHubIdentity, id: string, token: string): Promise<BookingWithRoom> {
    return this.withRoom(await this.load(user, id), token);
  }

  async create(
    user: CoreHubIdentity,
    dto: CreateBookingDto,
    token: string,
  ): Promise<BookingWithRoom> {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw AppException.badRequest('endsAt must be after startsAt');
    }
    if (endsAt.getTime() - startsAt.getTime() > MAX_DURATION_MS) {
      throw AppException.badRequest('A booking cannot be longer than 8 hours');
    }
    if (startsAt.getTime() < Date.now()) {
      throw AppException.badRequest('A booking cannot start in the past');
    }

    // The code must be a room Core Hub knows and still has open. If Core Hub
    // cannot be asked (and nothing is cached) this fails with 503 rather than
    // accept a room nobody checked.
    const room = await this.rooms.find(dto.roomCode, token);
    if (!room) {
      throw AppException.badRequest('Room does not exist');
    }
    if (!room.isActive) {
      throw AppException.conflict('Room is closed for booking');
    }

    await this.assertFree(room.code, startsAt, endsAt);

    const booking = await this.prisma.booking.create({
      data: {
        roomCode: room.code,
        coreUserId: user.id,
        email: user.email,
        title: dto.title,
        purpose: dto.purpose,
        startsAt,
        endsAt,
        status: BookingStatus.PENDING,
      },
    });
    return { ...booking, room };
  }

  approve(user: CoreHubIdentity, id: string, dto: ReviewBookingDto, token: string) {
    return this.review(user, id, BookingStatus.APPROVED, dto, token);
  }

  reject(user: CoreHubIdentity, id: string, dto: ReviewBookingDto, token: string) {
    return this.review(user, id, BookingStatus.REJECTED, dto, token);
  }

  /** The owner cancels their own booking; staff may cancel anyone's. */
  async cancel(user: CoreHubIdentity, id: string, token: string): Promise<BookingWithRoom> {
    const booking = await this.load(user, id);

    const isOwner = booking.coreUserId === user.id;
    if (!isOwner && !can(user.subsystemRole, Permission.BOOKING_CANCEL_ANY)) {
      throw AppException.forbidden('Only the requester or staff can cancel this booking');
    }
    if (!HOLDING.includes(booking.status)) {
      throw AppException.conflict(`A ${booking.status} booking cannot be cancelled`);
    }

    const cancelled = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });
    return this.withRoom(cancelled, token);
  }

  private async review(
    user: CoreHubIdentity,
    id: string,
    status: BookingStatus,
    dto: ReviewBookingDto,
    token: string,
  ): Promise<BookingWithRoom> {
    const booking = await this.load(user, id);
    if (booking.status !== BookingStatus.PENDING) {
      throw AppException.conflict(
        `Only a PENDING booking can be reviewed (it is ${booking.status})`,
      );
    }

    const reviewed = await this.prisma.booking.update({
      where: { id },
      data: {
        status,
        reviewedByCoreUserId: user.id,
        reviewNote: dto.note,
        reviewedAt: new Date(),
      },
    });
    return this.withRoom(reviewed, token);
  }

  /** The stored booking, if the caller may see it. */
  private async load(user: CoreHubIdentity, id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    // Another person's booking answers 404, not 403, so ids cannot be probed.
    if (!booking || !this.canSee(user, booking)) {
      throw AppException.notFound('Booking not found');
    }
    return booking;
  }

  private async withRoom(booking: Booking, token: string): Promise<BookingWithRoom> {
    const rooms = await this.rooms.describe([booking.roomCode], token);
    return { ...booking, room: rooms.get(booking.roomCode) ?? null };
  }

  private canSee(user: CoreHubIdentity, booking: Booking): boolean {
    return (
      can(user.subsystemRole, Permission.BOOKING_READ_ANY) || booking.coreUserId === user.id
    );
  }

  /** Two bookings overlap when each starts before the other ends. */
  private async assertFree(roomCode: string, startsAt: Date, endsAt: Date): Promise<void> {
    const clash = await this.prisma.booking.findFirst({
      where: {
        roomCode,
        status: { in: HOLDING },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    if (clash) {
      throw AppException.conflict('The room is already booked for part of that time', {
        bookingId: clash.id,
        startsAt: clash.startsAt,
        endsAt: clash.endsAt,
      });
    }
  }
}
