/**
 * Central SSO - subsystem side (e2e), auth-contract 1.1 §5.
 *
 *   GET  /auth/login?next=     → state cookie + 302 to Core Hub web /sso/authorize
 *   GET  /auth/callback?...    → checks state against the cookie, verifies the
 *                                token, sets the HttpOnly session cookie, 302 to next
 *   POST /auth/logout          → clears our cookies, 303 to Core Hub web /logout
 *
 * Runs against a fake Core Hub that serves only a JWKS document and an
 * in-memory database double - no PostgreSQL required.
 */
import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ssoCookieNames } from '../src/auth/sso-session';
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

const SUBSYSTEM = 'csmju-student-activity-matcher';
const NAMES = ssoCookieNames(SUBSYSTEM);
const CORE_HUB_WEB = 'http://core-hub-web.test';
const STUDENT_CORE_ID = 'user-002';
const STAFF_CORE_ID = 'user-003';

describe('Central SSO (e2e, auth-contract 1.1)', () => {
  let app: INestApplication;
  let coreHub: FakeCoreHub;
  let key: TestSigningKey;
  let studentToken: string;
  let staffToken: string;

  const cookiesOf = (response: request.Response): string[] => {
    const raw = response.headers['set-cookie'];
    return Array.isArray(raw) ? raw : raw ? [raw as unknown as string] : [];
  };
  const cookieNamed = (response: request.Response, name: string) =>
    cookiesOf(response).find((entry) => entry.startsWith(`${name}=`)) ?? '';
  /** A session cookie that is actually set (not a deletion). */
  const sessionSet = (response: request.Response) => {
    const cookie = cookieNamed(response, NAMES.session);
    return cookie !== '' && !/Max-Age=0(;|$)/.test(cookie);
  };
  const pair = (setCookie: string) => setCookie.split(';')[0];

  /** Steps 1-2 as the browser: start a sign-in and keep its state + cookie. */
  const beginLogin = async (next?: string) => {
    const response = await request(app.getHttpServer())
      .get('/auth/login')
      .query(next === undefined ? {} : { next })
      .expect(302);
    const location = new URL(response.headers.location);
    return { response, location, state: location.searchParams.get('state') ?? '', cookie: pair(cookieNamed(response, NAMES.state)) };
  };

  const callback = (query: Record<string, string>, cookie?: string) => {
    const req = request(app.getHttpServer()).get('/auth/callback').query(query);
    return cookie ? req.set('Cookie', cookie) : req;
  };

  /** A full successful sign-in; returns the session cookie pair. */
  const signIn = async (token: string, next?: string) => {
    const login = await beginLogin(next);
    const response = await callback({ access_token: token, token_type: 'Bearer', expires_in: '900', state: login.state }, login.cookie).expect(302);
    return { response, session: pair(cookieNamed(response, NAMES.session)) };
  };

  beforeAll(async () => {
    key = await createSigningKey('core-hub-2026');
    coreHub = new FakeCoreHub();
    await coreHub.start([key]);

    process.env.CORE_HUB_URL = coreHub.url;
    process.env.CORE_HUB_JWKS_URL = coreHub.jwksUrl;
    process.env.CORE_HUB_WEB_URL = CORE_HUB_WEB;
    process.env.SUBSYSTEM_ID = SUBSYSTEM;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(new InMemoryPrisma())
      .compile();

    app = moduleRef.createNestApplication();
    // identical to src/main.ts
    app.setGlobalPrefix('api', {
      exclude: [
        { path: 'auth/login', method: RequestMethod.GET },
        { path: 'auth/callback', method: RequestMethod.GET },
        { path: 'auth/logout', method: RequestMethod.POST },
      ],
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    studentToken = await signCoreHubToken(key, { sub: STUDENT_CORE_ID, email: 'student@core.local', role: 'student' });
    staffToken = await signCoreHubToken(key, { sub: STAFF_CORE_ID, email: 'staff@core.local', role: 'staff' });
  });

  afterAll(async () => {
    await app?.close();
    await coreHub?.stop();
  });

  describe('GET /auth/login', () => {
    it('mints a state cookie and sends the browser to Core Hub web /sso/authorize', async () => {
      const { response, location, state } = await beginLogin('/activities?x=1');

      expect(`${location.origin}${location.pathname}`).toBe(`${CORE_HUB_WEB}/sso/authorize`);
      expect(location.searchParams.get('subsystem')).toBe(SUBSYSTEM);
      expect(location.searchParams.has('callback_url')).toBe(false);
      expect(Buffer.from(state, 'base64url').length).toBeGreaterThanOrEqual(32);
      expect(response.headers['cache-control']).toBe('no-store');

      const cookie = cookieNamed(response, NAMES.state);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Path=/auth/callback');
      expect(Number(/Max-Age=(\d+)/.exec(cookie)?.[1])).toBeLessThanOrEqual(600);
    });

    it('issues a different state every time', async () => {
      const [a, b] = await Promise.all([beginLogin(), beginLogin()]);
      expect(a.state).not.toBe(b.state);
    });
  });

  describe('GET /auth/callback - success', () => {
    it('sets an HttpOnly session cookie and lands on the stored next path', async () => {
      const { response } = await signIn(studentToken, '/activities?x=1');

      expect(response.headers.location).toBe('/activities?x=1');
      expect(response.headers['referrer-policy']).toBe('no-referrer');
      const session = cookieNamed(response, NAMES.session);
      expect(session).toContain('HttpOnly');
      expect(session).toContain('SameSite=Lax');
      expect(session).toContain('Path=/');
      expect(Number(/Max-Age=(\d+)/.exec(session)?.[1])).toBeGreaterThan(0);
      // the state is burnt
      expect(cookieNamed(response, NAMES.state)).toMatch(/Max-Age=0/);
    });

    it('the session cookie alone reaches /api/v1/me, with the session expiry', async () => {
      const { session } = await signIn(studentToken);
      const me = await request(app.getHttpServer()).get('/api/v1/me').set('Cookie', session).expect(200);

      expect(me.body.data).toMatchObject({ id: STUDENT_CORE_ID, coreRole: 'student', subsystemRole: 'STUDENT' });
      expect(Date.parse(me.body.data.session.expiresAt)).toBeGreaterThan(Date.now());
    });

    it('prefers the Authorization header over the cookie', async () => {
      const { session } = await signIn(studentToken);
      const me = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Cookie', session)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);
      expect(me.body.data.subsystemRole).toBe('ADMIN');
    });

    it.each(['//evil.example.com', '/\\evil.example.com', 'https://evil.example.com', '/auth/logout', 'activities'])(
      'an unsafe next (%s) lands on the default page',
      async (next) => {
        const { response } = await signIn(studentToken, next);
        expect(response.headers.location).toBe('/');
      },
    );
  });

  describe('GET /auth/callback - no session is created', () => {
    it('without a token → 400', async () => {
      const response = await callback({}).expect(400);
      expect(sessionSet(response)).toBe(false);
    });

    it('without state (a Core Hub sidebar click) → drop the token, set no cookie, 302 /auth/login', async () => {
      const response = await callback({ access_token: studentToken }).expect(302);
      expect(response.headers.location).toBe('/auth/login');
      expect(cookiesOf(response)).toEqual([]);
    });

    it('a state without its cookie → 401, no redirect', async () => {
      const login = await beginLogin();
      const response = await callback({ access_token: studentToken, state: login.state }).expect(401);
      expect(response.headers.location).toBeUndefined();
      expect(sessionSet(response)).toBe(false);
    });

    it("one sign-in's state with another sign-in's cookie → 401", async () => {
      const first = await beginLogin();
      const second = await beginLogin();
      const response = await callback({ access_token: studentToken, state: first.state }, second.cookie).expect(401);
      expect(sessionSet(response)).toBe(false);
    });

    it.each([
      ['tampered role', () => tamperPayload(studentToken, { role: 'admin' })],
      ['HS256', () => signHs256Token()],
      ['alg=none', () => createAlgNoneToken()],
      ['expired', () => signCoreHubToken(key, { role: 'student', expiresInSec: -60, issuedAtOffsetSec: -600 })],
      ['wrong issuer', () => signCoreHubToken(key, { issuer: 'evil-hub' })],
    ])('a %s token → 401, no session', async (_label, make) => {
      const login = await beginLogin();
      const response = await callback({ access_token: await make(), state: login.state }, login.cookie).expect(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(sessionSet(response)).toBe(false);
    });

    it('a Core Hub role this subsystem does not map → 403, no session', async () => {
      const login = await beginLogin();
      const token = await signCoreHubToken(key, { role: 'finance-officer' });
      const response = await callback({ access_token: token, state: login.state }, login.cookie).expect(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(sessionSet(response)).toBe(false);
    });

    it('a state works only once', async () => {
      const login = await beginLogin();
      const first = await callback({ access_token: studentToken, state: login.state }, login.cookie).expect(302);
      // the browser now holds the burnt state cookie
      const burnt = pair(cookieNamed(first, NAMES.state));
      await callback({ access_token: studentToken, state: login.state }, burnt).expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('clears the session cookie and sends the browser to Core Hub web /logout (303)', async () => {
      const { session } = await signIn(studentToken);
      const response = await request(app.getHttpServer()).post('/auth/logout').set('Cookie', session).expect(303);

      expect(response.headers.location).toBe(`${CORE_HUB_WEB}/logout`);
      expect(cookieNamed(response, NAMES.session)).toMatch(/Max-Age=0(;|$)/);
    });
  });

  describe('route placement', () => {
    it('serves the SSO routes outside /api', async () => {
      await request(app.getHttpServer()).get('/api/auth/login').expect(404);
      await request(app.getHttpServer()).get('/api/auth/callback').query({ access_token: staffToken }).expect(404);
    });

    it('rejects a forged session cookie (401)', async () => {
      await request(app.getHttpServer()).get('/api/v1/me').set('Cookie', `${NAMES.session}=not-a-jwt`).expect(401);
    });
  });
});
