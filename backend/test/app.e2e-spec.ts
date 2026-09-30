/**
 * End-to-end suite for the Demo Subsystem (spec §36, §38, §39).
 *
 * It boots the real NestJS application - global guards, validation pipe,
 * response interceptor and exception filter included - against:
 *   - a fake Core Hub that serves its JWKS document and the rooms reference
 *     data (GET /api/v1/rooms), and
 *   - an in-memory stand-in for the subsystem database.
 *
 * The subsystem code under test is unchanged: it still downloads JWKS, selects
 * the key by `kid`, verifies RS256 signatures and enforces its own policies.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ReferenceDataService } from '../src/core-hub/reference-data.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { FakeCoreHub } from './helpers/fake-core-hub';
import { InMemoryPrisma } from './helpers/in-memory-prisma';
import {
  TestSigningKey,
  createAlgNoneToken,
  createSigningKey,
  signCoreHubToken,
  signHs256Token,
  tamperPayload,
} from './helpers/token-factory';

const STUDENT_CORE_ID = 'user-001';
const OTHER_STUDENT_CORE_ID = 'user-002';
const STAFF_CORE_ID = 'user-003';
const ADMIN_CORE_ID = 'user-004';

/** Rooms as Core Hub's GET /api/v1/rooms returns them. */
const OPEN_ROOM = {
  code: 'CS-201',
  nameTh: 'Meeting room',
  building: 'Computer Science',
  buildingCode: 'CS',
  floor: 2,
  capacity: 16,
  roomType: 'MEETING',
  facultyCode: 'SCI',
  photoUrl: null,
  isActive: true,
  updatedAt: '2026-09-26T00:00:00.000Z',
};
const CLOSED_ROOM = {
  ...OPEN_ROOM,
  code: 'SCI-999',
  nameTh: 'Closed for renovation',
  building: 'Science',
  roomType: 'LAB',
  isActive: false,
};

describe('Demo Subsystem (e2e)', () => {
  let app: INestApplication;
  let coreHub: FakeCoreHub;
  let db: InMemoryPrisma;
  let key: TestSigningKey;
  let rotatedKey: TestSigningKey;

  let studentToken: string;
  let otherStudentToken: string;
  let alumniToken: string;
  let staffToken: string;
  let adminToken: string;

  const roomCode = OPEN_ROOM.code;
  const closedRoomCode = CLOSED_ROOM.code;

  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    key = await createSigningKey('core-hub-2026');
    rotatedKey = await createSigningKey('core-hub-2027');

    coreHub = new FakeCoreHub();
    await coreHub.start([key]);
    coreHub.setRooms([OPEN_ROOM, CLOSED_ROOM]);

    // The fake Core Hub gets a random port, so these are set here - the
    // configuration factory reads them when the testing module is compiled.
    process.env.CORE_HUB_URL = coreHub.url;
    process.env.CORE_HUB_JWKS_URL = coreHub.jwksUrl;

    db = new InMemoryPrisma();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(db)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    studentToken = await signCoreHubToken(key, {
      sub: STUDENT_CORE_ID,
      email: 'student@core.local',
      role: 'student',
    });
    otherStudentToken = await signCoreHubToken(key, {
      sub: OTHER_STUDENT_CORE_ID,
      email: 'other@core.local',
      role: 'student',
    });
    alumniToken = await signCoreHubToken(key, {
      sub: 'user-005',
      email: 'alumni@core.local',
      role: 'alumni',
    });
    staffToken = await signCoreHubToken(key, {
      sub: STAFF_CORE_ID,
      email: 'staff@core.local',
      role: 'staff',
    });
    adminToken = await signCoreHubToken(key, {
      sub: ADMIN_CORE_ID,
      email: 'admin@core.local',
      role: 'admin',
    });
  });

  beforeEach(() => {
    db.reset();
    // Every test starts with Core Hub up and nothing cached.
    coreHub.referenceDataDown = false;
    app.get(ReferenceDataService).reset();
  });

  afterAll(async () => {
    await app?.close();
    await coreHub?.stop();
  });

  // ---------------------------------------------------------------- health --
  describe('GET /api/health (spec §21)', () => {
    it('is public and reports the service name', async () => {
      const response = await request(app.getHttpServer()).get('/api/health').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { status: 'ok', service: 'csmju-demo-subsystem' },
      });
    });
  });

  // ------------------------------------------------------- authentication --
  describe('Authentication (spec §36, §39)', () => {
    it('rejects a request with no token (401)', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/me').expect(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects a non-Bearer Authorization scheme (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set({ Authorization: 'Basic dXNlcjpwYXNz' })
        .expect(401);
    });

    it('rejects a malformed token (401)', async () => {
      await request(app.getHttpServer()).get('/api/v1/me').set(bearer('not-a-jwt')).expect(401);
    });

    it('rejects an expired token (401)', async () => {
      const expired = await signCoreHubToken(key, {
        role: 'staff',
        expiresInSec: -60,
        issuedAtOffsetSec: -600,
      });
      await request(app.getHttpServer()).get('/api/v1/me').set(bearer(expired)).expect(401);
    });

    it('rejects a token signed by an attacker key (401)', async () => {
      const attackerKey = await createSigningKey('core-hub-2026');
      const forged = await signCoreHubToken(attackerKey, { role: 'admin' });
      await request(app.getHttpServer()).get('/api/v1/me').set(bearer(forged)).expect(401);
    });

    it('rejects a token whose role claim was modified after signing (401)', async () => {
      const escalated = tamperPayload(studentToken, { role: 'admin' });
      await request(app.getHttpServer()).get('/api/v1/me').set(bearer(escalated)).expect(401);
    });

    it('rejects a wrong issuer (401)', async () => {
      const token = await signCoreHubToken(key, { issuer: 'evil-hub' });
      await request(app.getHttpServer()).get('/api/v1/me').set(bearer(token)).expect(401);
    });

    it('rejects a wrong audience (401)', async () => {
      const token = await signCoreHubToken(key, { audience: 'other-platform' });
      await request(app.getHttpServer()).get('/api/v1/me').set(bearer(token)).expect(401);
    });

    it('rejects an HS256 token (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set(bearer(await signHs256Token()))
        .expect(401);
    });

    it('rejects an unsigned alg=none token (401)', async () => {
      await request(app.getHttpServer()).get('/api/v1/me').set(bearer(createAlgNoneToken())).expect(401);
    });

    it('rejects an unknown kid (401)', async () => {
      const unknown = await createSigningKey('core-hub-1999');
      const token = await signCoreHubToken(unknown);
      await request(app.getHttpServer()).get('/api/v1/me').set(bearer(token)).expect(401);
    });

    it('returns 403 for a Core Hub role this subsystem does not map', async () => {
      const token = await signCoreHubToken(key, { role: 'finance-officer' });
      const response = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set(bearer(token))
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('never leaks a token or Authorization header in an error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set(bearer(studentToken.slice(0, -3)))
        .expect(401);

      expect(JSON.stringify(response.body)).not.toContain(studentToken.slice(0, 20));
    });
  });

  // ------------------------------------------------------------------ /me --
  describe('GET /api/v1/me (spec §22)', () => {
    it('returns the verified Core Hub identity plus the mapped subsystem role', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set(bearer(staffToken))
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          id: STAFF_CORE_ID,
          email: 'staff@core.local',
          coreRole: 'staff',
          subsystemRole: 'STAFF',
        },
      });
    });

    it.each([
      ['student', 'STUDENT'],
      ['staff', 'STAFF'],
      ['admin', 'ADMIN'],
      ['alumni', 'ALUMNI'],
    ])('maps core role %s to subsystem role %s', async (coreRole, subsystemRole) => {
      const token = await signCoreHubToken(key, { role: coreRole, sub: 'user-map' });
      const response = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set(bearer(token))
        .expect(200);

      expect(response.body.data.subsystemRole).toBe(subsystemRole);
    });
  });

  // ----------------------------------------------------------------- rooms --
  describe('Room APIs (rooms are Core Hub reference data)', () => {
    it('lists the rooms Core Hub has open to any authenticated role', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rooms')
        .set(bearer(alumniToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([OPEN_ROOM]);
      expect(response.body.meta).toMatchObject({ total: 1, page: 1 });
    });

    it("asks Core Hub with the caller's own token", async () => {
      await request(app.getHttpServer()).get('/api/v1/rooms').set(bearer(alumniToken)).expect(200);

      expect(coreHub.lastRoomsAuthorization).toBe(`Bearer ${alumniToken}`);
    });

    it('searches rooms by code, name or building', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/rooms?q=computer')
        .set(bearer(studentToken))
        .expect(200);

      expect(response.body.data.map((room: { code: string }) => room.code)).toEqual(['CS-201']);
    });

    it('still shows a room Core Hub has closed, so old bookings keep its name', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/rooms/${closedRoomCode}`)
        .set(bearer(studentToken))
        .expect(200);

      expect(response.body.data).toMatchObject({ code: 'SCI-999', isActive: false });
    });

    it('returns 404 for a code Core Hub does not know and 400 for a malformed code', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/rooms/NOPE-1')
        .set(bearer(studentToken))
        .expect(404);
      const malformed = await request(app.getHttpServer())
        .get('/api/v1/rooms/not-a-code')
        .set(bearer(studentToken))
        .expect(400);
      expect(malformed.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('has no API to add or change rooms - they are managed in Core Hub', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/rooms')
        .set(bearer(staffToken))
        .send({ code: 'SCI-500' })
        .expect(404);
      await request(app.getHttpServer())
        .patch(`/api/v1/rooms/${roomCode}`)
        .set(bearer(adminToken))
        .send({ nameTh: 'renamed' })
        .expect(404);
    });

    it('keeps serving cached rooms while Core Hub is down', async () => {
      await request(app.getHttpServer()).get('/api/v1/rooms').set(bearer(studentToken)).expect(200);
      coreHub.referenceDataDown = true;

      const response = await request(app.getHttpServer())
        .get('/api/v1/rooms')
        .set(bearer(studentToken))
        .expect(200);
      expect(response.body.data).toEqual([OPEN_ROOM]);
    });

    it('answers 503 while Core Hub is down and nothing is cached', async () => {
      coreHub.referenceDataDown = true;

      const response = await request(app.getHttpServer())
        .get('/api/v1/rooms')
        .set(bearer(studentToken))
        .expect(503);
      expect(response.body.success).toBe(false);
    });
  });

  // -------------------------------------------------------------- bookings --
  describe('Booking APIs', () => {
    /** A slot `hours` from now, lasting `length` hours. */
    const slot = (hours: number, length = 2) => ({
      startsAt: new Date(Date.now() + hours * 3_600_000).toISOString(),
      endsAt: new Date(Date.now() + (hours + length) * 3_600_000).toISOString(),
    });

    const book = (token: string, body: Record<string, unknown>) =>
      request(app.getHttpServer()).post('/api/v1/bookings').set(bearer(token)).send(body);

    it('lets a STUDENT book a room as PENDING, owned by the token subject', async () => {
      const response = await book(studentToken, { roomCode, title: 'Group work', ...slot(24) }).expect(201);

      expect(response.body.data).toMatchObject({
        status: 'PENDING',
        coreUserId: STUDENT_CORE_ID,
        email: 'student@core.local',
        roomCode: 'CS-201',
        room: { code: 'CS-201', nameTh: 'Meeting room' },
      });
    });

    it('rejects an identity smuggled in the request body (400)', async () => {
      await book(studentToken, {
        roomCode,
        title: 'Group work',
        coreUserId: OTHER_STUDENT_CORE_ID,
        ...slot(24),
      }).expect(400);
    });

    it('rejects an overlapping booking (409) but allows the next free slot', async () => {
      await book(studentToken, { roomCode, title: 'First', ...slot(24, 2) }).expect(201);

      const clash = await book(otherStudentToken, { roomCode, title: 'Clash', ...slot(25, 2) }).expect(409);
      expect(clash.body.error.code).toBe('CONFLICT');

      await book(otherStudentToken, { roomCode, title: 'After', ...slot(26, 1) }).expect(201);
    });

    it('rejects a closed room (409) and a booking in the past (400)', async () => {
      await book(studentToken, { roomCode: closedRoomCode, title: 'Closed', ...slot(24) }).expect(409);
      await book(studentToken, { roomCode, title: 'Past', ...slot(-3) }).expect(400);
    });

    it('rejects a room code Core Hub does not know (400)', async () => {
      await book(studentToken, { roomCode: 'NOPE-1', title: 'Nowhere', ...slot(24) }).expect(400);
    });

    it('does not book while Core Hub cannot say whether the room exists (503)', async () => {
      coreHub.referenceDataDown = true;

      await book(studentToken, { roomCode, title: 'Unchecked', ...slot(24) }).expect(503);
      expect(db.booking.rows).toHaveLength(0);
    });

    it('still lists bookings while Core Hub is down, with the bare room code', async () => {
      await book(studentToken, { roomCode, title: 'Mine', ...slot(24) }).expect(201);
      app.get(ReferenceDataService).reset();
      coreHub.referenceDataDown = true;

      const response = await request(app.getHttpServer())
        .get('/api/v1/bookings')
        .set(bearer(studentToken))
        .expect(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({ title: 'Mine', roomCode: 'CS-201', room: null }),
      ]);
    });

    it('denies an ALUMNI booking a room (403)', async () => {
      await book(alumniToken, { roomCode, title: 'Alumni', ...slot(24) }).expect(403);
    });

    it('shows a STUDENT only their own bookings, and STAFF every booking', async () => {
      await book(studentToken, { roomCode, title: 'Mine', ...slot(24) }).expect(201);
      await book(otherStudentToken, { roomCode, title: 'Theirs', ...slot(30) }).expect(201);

      const mine = await request(app.getHttpServer())
        .get('/api/v1/bookings')
        .set(bearer(studentToken))
        .expect(200);
      expect(mine.body.data.map((b: { title: string }) => b.title)).toEqual(['Mine']);

      const all = await request(app.getHttpServer())
        .get('/api/v1/bookings')
        .set(bearer(staffToken))
        .expect(200);
      expect(all.body.data).toHaveLength(2);
    });

    it("answers 404 when a STUDENT opens another student's booking", async () => {
      const theirs = await book(otherStudentToken, { roomCode, title: 'Theirs', ...slot(24) }).expect(201);

      await request(app.getHttpServer())
        .get(`/api/v1/bookings/${theirs.body.data.id}`)
        .set(bearer(studentToken))
        .expect(404);
    });

    it('lets STAFF approve a pending booking, and only once', async () => {
      const created = await book(studentToken, { roomCode, title: 'Review me', ...slot(24) }).expect(201);
      const id = created.body.data.id;

      await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${id}/approve`)
        .set(bearer(studentToken))
        .send({})
        .expect(403);

      const approved = await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${id}/approve`)
        .set(bearer(staffToken))
        .send({ note: 'enjoy' })
        .expect(200);
      expect(approved.body.data).toMatchObject({
        status: 'APPROVED',
        reviewedByCoreUserId: STAFF_CORE_ID,
        reviewNote: 'enjoy',
      });

      await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${id}/reject`)
        .set(bearer(staffToken))
        .send({})
        .expect(409);
    });

    it('lets the owner cancel, frees the slot, and stops others cancelling', async () => {
      const created = await book(studentToken, { roomCode, title: 'Cancel me', ...slot(24) }).expect(201);
      const id = created.body.data.id;

      await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${id}/cancel`)
        .set(bearer(otherStudentToken))
        .expect(404);

      const cancelled = await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${id}/cancel`)
        .set(bearer(studentToken))
        .expect(200);
      expect(cancelled.body.data.status).toBe('CANCELLED');

      await book(otherStudentToken, { roomCode, title: 'Now free', ...slot(24) }).expect(201);
    });

    it('shows the room schedule to any role without saying who booked', async () => {
      await book(otherStudentToken, { roomCode, title: 'Secret meeting', ...slot(24) }).expect(201);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/rooms/${roomCode}/schedule`)
        .set(bearer(alumniToken))
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(Object.keys(response.body.data[0]).sort()).toEqual(['endsAt', 'startsAt', 'status']);
    });

    it("lets ADMIN cancel anyone's booking", async () => {
      const created = await book(studentToken, { roomCode, title: 'Admin cancels', ...slot(24) }).expect(201);

      const cancelled = await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${created.body.data.id}/cancel`)
        .set(bearer(adminToken))
        .expect(200);
      expect(cancelled.body.data.status).toBe('CANCELLED');
    });
  });

  // ------------------------------------------------------------- rotation --
  describe('Core Hub key rotation (spec §40)', () => {
    it('accepts a token signed with a newly rotated key after refreshing JWKS', async () => {
      coreHub.rotate([key, rotatedKey]);

      const rotatedToken = await signCoreHubToken(rotatedKey, {
        role: 'staff',
        sub: STAFF_CORE_ID,
        email: 'staff@core.local',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set(bearer(rotatedToken))
        .expect(200);

      expect(response.body.data.subsystemRole).toBe('STAFF');
    });
  });

  // -------------------------------------------------------- demo scenario --
  describe('End-to-end demo scenario (spec §38)', () => {
    it('token -> JWKS -> verification -> role mapping -> business API', async () => {
      // Step 1-2: a Core Hub RS256 token exists (issued by the fake Core Hub key).
      const token = await signCoreHubToken(key, {
        sub: STAFF_CORE_ID,
        email: 'staff@core.local',
        role: 'staff',
        sid: 'session-id',
      });

      // Step 3-4: the subsystem verifies it and recognises the user.
      const me = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set(bearer(token))
        .expect(200);

      expect(me.body.data).toEqual({
        id: STAFF_CORE_ID,
        email: 'staff@core.local',
        coreRole: 'staff',
        subsystemRole: 'STAFF',
      });

      // Step 5: business API with the same Core Hub token.
      const rooms = await request(app.getHttpServer())
        .get('/api/v1/rooms')
        .set(bearer(token))
        .expect(200);

      expect(rooms.body.success).toBe(true);
      expect(Array.isArray(rooms.body.data)).toBe(true);

      // Core Hub was asked for its public keys, and for rooms with the caller's token.
      expect(coreHub.requestCount).toBeGreaterThan(0);
      expect(coreHub.lastRoomsAuthorization).toBe(`Bearer ${token}`);
    });
  });
});
