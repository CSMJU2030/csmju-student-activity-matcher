import { Controller, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { AppException } from '../common/errors';
import { AuthEventsLogger } from './auth-events.logger';
import { TokenRejectionReason, TokenVerificationError } from './auth.errors';
import { CoreHubTokenVerifier } from './core-hub-token.verifier';
import { Public } from './decorators/public.decorator';
import { SsoCallbackQueryDto } from './dto/sso-callback.dto';
import { mapCoreRoleToSubsystemRole } from './role-mapping';
import {
  SsoCookieNames,
  buildSessionCookie,
  buildStateCookie,
  clearSessionCookie,
  clearStateCookie,
  isSafeNext,
  newState,
  parseStateCookie,
  readCookie,
  sameState,
  ssoCookieNames,
} from './sso-session';

/** Where a sign-in lands when `next` is missing or unsafe. */
const DEFAULT_NEXT = '/';

/**
 * Central SSO endpoints of the subsystem (auth-contract 1.1 §5).
 *
 * Every sign-in starts here at `GET /auth/login`, which mints a one-time state
 * so the callback can tell a sign-in this browser started from a forged one
 * (login CSRF). These routes live outside the `/api` prefix and are public;
 * the frontend proxies `/auth/*` to them so cookies share the page's origin.
 */
@Controller('auth')
export class SsoCallbackController {
  private readonly names: SsoCookieNames;
  private readonly subsystemId: string;
  private readonly coreHubWebUrl: string;
  private readonly secure: boolean;

  constructor(
    private readonly verifier: CoreHubTokenVerifier,
    private readonly authEvents: AuthEventsLogger,
    config: ConfigService,
  ) {
    this.subsystemId = config.get<string>('subsystemId', 'csmju-student-activity-matcher');
    this.names = ssoCookieNames(this.subsystemId);
    this.coreHubWebUrl = config.get<string>('coreHub.webUrl', 'http://localhost:3100').replace(/\/+$/, '');
    this.secure = config.get<string>('nodeEnv') === 'production';
  }

  /** §5.2 — mint a state, remember it with `next`, and send the browser to Core Hub web. */
  @Public()
  @Get('login')
  login(@Query('next') next: unknown, @Res() response: Response): void {
    const state = newState();
    const target = new URL(`${this.coreHubWebUrl}/sso/authorize`);
    target.searchParams.set('subsystem', this.subsystemId);
    target.searchParams.set('state', state);

    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Set-Cookie', buildStateCookie(this.names, state, isSafeNext(next) ? next : DEFAULT_NEXT, this.secure));
    response.redirect(302, target.toString());
  }

  /** §5.1 — the callback rules, in order. Never logs the full URL (it carries the token). */
  @Public()
  @Get('callback')
  async callback(@Query() query: SsoCallbackQueryDto, @Req() request: Request, @Res() response: Response): Promise<void> {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');

    // Started from the Core Hub sidebar: no state. Drop the token, set no cookie
    // (another tab may be waiting for its own state) and start a proper sign-in.
    if (query.state === undefined) {
      response.redirect(302, '/auth/login');
      return;
    }

    // From here on the state cookie is burnt in every answer: it works once.
    response.setHeader('Set-Cookie', clearStateCookie(this.names, this.secure));

    const stored = parseStateCookie(readCookie(request.header('cookie'), this.names.state));
    if (!stored || !sameState(stored.state, query.state)) {
      // No redirect: a browser that does not keep cookies would loop forever.
      throw AppException.unauthorized('This sign-in was not started from this browser - please sign in again');
    }

    let payload;
    try {
      payload = await this.verifier.verify(query.access_token);
    } catch (error) {
      const reason = error instanceof TokenVerificationError ? error.reason : TokenRejectionReason.MALFORMED_TOKEN;
      const kid = error instanceof TokenVerificationError ? error.kid : undefined;
      this.authEvents.jwtRejected({ reason, kid, path: '/auth/callback' });
      throw AppException.unauthorized('The Core Hub SSO token could not be verified');
    }

    const subsystemRole = mapCoreRoleToSubsystemRole(payload.role);
    if (!subsystemRole) {
      this.authEvents.roleMappingFailed({ sub: payload.sub, coreRole: payload.role });
      throw AppException.forbidden('Your Core Hub role has no access to this subsystem');
    }

    const maxAge = typeof payload.exp === 'number' ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000)) : 0;
    response.setHeader('Set-Cookie', [
      clearStateCookie(this.names, this.secure),
      buildSessionCookie(this.names, query.access_token, maxAge, this.secure),
    ]);
    this.authEvents.jwtVerified({ sub: payload.sub, coreRole: payload.role, subsystemRole });

    // `next` came back from a cookie, so it is validated again before use.
    response.redirect(302, isSafeNext(stored.next) ? stored.next : DEFAULT_NEXT);
  }

  /** Sign-out means the whole platform: clear our cookies, then Core Hub's confirmation page. */
  @Public()
  @Post('logout')
  @HttpCode(303)
  logout(@Res() response: Response): void {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Set-Cookie', [
      clearSessionCookie(this.names, this.secure),
      clearStateCookie(this.names, this.secure),
    ]);
    response.redirect(303, `${this.coreHubWebUrl}/logout`);
  }
}
