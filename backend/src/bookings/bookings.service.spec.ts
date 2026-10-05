import { HttpStatus } from '@nestjs/common';
import { BookingStatus } from '../../generated/prisma/client';
import { CoreHubIdentity, SubsystemRole } from '../auth/core-hub-identity';
import { AppException, ErrorCode } from '../common/errors';
import { Room } from '../core-hub/reference-data.types';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { BookingsService } from './bookings.service';

const student: CoreHubIdentity = {
  id: 'user-002',
  email: 'student@core.local',
  coreRole: 'student',
  subsystemRole: SubsystemRole.STUDENT,
};
const otherStudent: CoreHubIdentity = { ...student, id: 'user-099', email: 'other@core.local' };
const staff: CoreHubIdentity = {
  id: 'user-003',
  email: 'staff@core.local',
  coreRole: 'staff',
  subsystemRole: SubsystemRole.ADMIN, // Core Hub staff maps to ADMIN here
};

/** The caller's Core Hub token, passed on to Core Hub for room lookups. */
const TOKEN = 'caller-token';

/** A room as Core Hub's GET /api/v1/rooms returns it. */
const room: Room = {
  code: 'LECT-6',
  nameTh: 'ห้องบรรยาย 6',
  building: 'อาคารทดสอบ',
  buildingCode: 'TEST',
  floor: 2,
  capacity: 60,
  roomType: 'LECTURE',
  facultyCode: 'SCI',
  photoUrl: null,
  isActive: true,
  updatedAt: '2026-09-26T00:00:00.000Z',
};

/** An ISO time `hours` from now. */
const inHours = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

describe('BookingsService', () => {
  let prisma: {
    booking: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let rooms: { find: jest.Mock; describe: jest.Mock };
  let service: BookingsService;

  beforeEach(() => {
    prisma = {
      booking: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(({ data }) => Promise.resolve({ id: 'b-1', ...data })),
        update: jest.fn(({ data }) => Promise.resolve({ id: 'b-1', roomCode: room.code, ...data })),
      },
    };
    rooms = {
      find: jest.fn().mockResolvedValue(room),
      describe: jest.fn((codes: string[]) =>
        Promise.resolve(new Map(codes.map((code) => [code, code === room.code ? room : null]))),
      ),
    };
    service = new BookingsService(
      prisma as unknown as PrismaService,
      rooms as unknown as RoomsService,
    );
  });

  const valid = () => ({
    roomCode: room.code,
    title: 'ประชุมกลุ่ม',
    startsAt: inHours(24),
    endsAt: inHours(26),
  });

  describe('create', () => {
    it('books a free room as PENDING under the caller from the token', async () => {
      const booking = await service.create(student, valid(), TOKEN);

      expect(booking.status).toBe(BookingStatus.PENDING);
      expect(booking.coreUserId).toBe('user-002');
      expect(booking.email).toBe('student@core.local');
      expect(booking.roomCode).toBe('LECT-6');
      expect(booking.room).toEqual(room);
    });

    it("checks the room with Core Hub using the caller's token", async () => {
      await service.create(student, valid(), TOKEN);

      expect(rooms.find).toHaveBeenCalledWith('LECT-6', TOKEN);
    });

    it('checks for overlaps with PENDING and APPROVED bookings of that room', async () => {
      const dto = valid();
      await service.create(student, dto, TOKEN);

      expect(prisma.booking.findFirst).toHaveBeenCalledWith({
        where: {
          roomCode: 'LECT-6',
          status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
          startsAt: { lt: new Date(dto.endsAt) },
          endsAt: { gt: new Date(dto.startsAt) },
        },
      });
    });

    it('rejects an overlapping booking with 409', async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: 'b-0', startsAt: new Date(), endsAt: new Date() });

      await expect(service.create(student, valid(), TOKEN)).rejects.toMatchObject({ status: 409 });
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it.each([
      ['ends before it starts', { startsAt: inHours(26), endsAt: inHours(24) }],
      ['lasts longer than 8 hours', { startsAt: inHours(24), endsAt: inHours(33) }],
      ['starts in the past', { startsAt: inHours(-2), endsAt: inHours(-1) }],
    ])('rejects a booking that %s with 400', async (_case, times) => {
      await expect(service.create(student, { ...valid(), ...times }, TOKEN)).rejects.toMatchObject({
        status: 400,
      });
    });

    it('rejects a room Core Hub does not know with 400 and a closed room with 409', async () => {
      rooms.find.mockResolvedValueOnce(null);
      await expect(service.create(student, valid(), TOKEN)).rejects.toMatchObject({ status: 400 });

      rooms.find.mockResolvedValueOnce({ ...room, isActive: false });
      await expect(service.create(student, valid(), TOKEN)).rejects.toMatchObject({ status: 409 });
    });

    it('does not book when Core Hub cannot be asked about the room', async () => {
      rooms.find.mockRejectedValueOnce(
        new AppException(ErrorCode.INTERNAL_ERROR, 'unavailable', HttpStatus.SERVICE_UNAVAILABLE),
      );

      await expect(service.create(student, valid(), TOKEN)).rejects.toMatchObject({ status: 503 });
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('adds the Core Hub room to each booking, or null for a code Core Hub does not know', async () => {
      prisma.booking.findMany.mockResolvedValue([
        { id: 'b-1', roomCode: 'LECT-6', coreUserId: 'user-002' },
        { id: 'b-2', roomCode: 'OLD-1', coreUserId: 'user-002' },
      ]);
      prisma.booking.count.mockResolvedValue(2);

      const { items, total } = await service.findAll(student, {} as never, TOKEN);

      expect(total).toBe(2);
      expect(items.map((booking) => booking.room)).toEqual([room, null]);
      expect(rooms.describe).toHaveBeenCalledWith(['LECT-6', 'OLD-1'], TOKEN);
    });

    it("limits a student to their own bookings", async () => {
      await service.findAll(student, {} as never, TOKEN);

      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ coreUserId: 'user-002' }) }),
      );
    });
  });

  describe('visibility and cancel', () => {
    const pending = { id: 'b-1', roomCode: 'LECT-6', coreUserId: 'user-002', status: BookingStatus.PENDING };

    it("hides another person's booking from a student with 404", async () => {
      prisma.booking.findUnique.mockResolvedValue(pending);

      await expect(service.findOne(otherStudent, 'b-1', TOKEN)).rejects.toMatchObject({
        status: 404,
      });
      await expect(service.findOne(staff, 'b-1', TOKEN)).resolves.toMatchObject({
        id: 'b-1',
        room,
      });
    });

    it('lets the owner cancel their own booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(pending);

      await expect(service.cancel(student, 'b-1', TOKEN)).resolves.toMatchObject({
        status: BookingStatus.CANCELLED,
      });
    });

    it('refuses to cancel a booking that is already finished with', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...pending, status: BookingStatus.REJECTED });

      await expect(service.cancel(student, 'b-1', TOKEN)).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('review', () => {
    it('records who approved it and when', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'b-1',
        roomCode: 'LECT-6',
        coreUserId: 'user-002',
        status: BookingStatus.PENDING,
      });

      const booking = await service.approve(staff, 'b-1', { note: 'ok' }, TOKEN);

      expect(booking.status).toBe(BookingStatus.APPROVED);
      expect(booking.reviewedByCoreUserId).toBe('user-003');
      expect(booking.reviewNote).toBe('ok');
      expect(booking.reviewedAt).toBeInstanceOf(Date);
    });

    it('only reviews a PENDING booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'b-1',
        roomCode: 'LECT-6',
        coreUserId: 'user-002',
        status: BookingStatus.APPROVED,
      });

      await expect(service.reject(staff, 'b-1', {}, TOKEN)).rejects.toMatchObject({ status: 409 });
    });
  });
});
