import { Body, Controller, HttpException, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { Public } from './decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { buildSessionCookie, ssoCookieNames } from './sso-session';

/** Dev-only: mock Core Hub account -> the subsystem profile (Student.studentId) it acts as. */
export const MOCK_STUDENT_IDS: Record<string, string> = {
  'student@core.local': '6704101363', // ภาณุพงษ์ เวียงห้า (same code as the REG record)
};

/** The Core Hub dev seed accounts (csmju-core-hub backend/prisma/seed.ts) - never real credentials. */
const MOCK_ACCOUNTS: Record<string, string> = {
  'admin@core.local': 'password1',
  'student@core.local': 'password2',
  'staff@core.local': 'password3',
  'alumni@core.local': 'password4',
};

/**
 * Development shortcut: signs in as one of the Core Hub seed accounts and sets
 * the same HttpOnly session cookie the SSO callback would. The token is a real
 * Core Hub token and never reaches page JavaScript. Disabled in production -
 * there the only way in is `GET /auth/login` (auth-contract §5, §9).
 */
@Controller('auth')
export class MockAuthController {
  private readonly logger = new Logger(MockAuthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('mock-login')
  async mockLogin(@Body() body: { email?: string }, @Res({ passthrough: true }) response: Response) {
    if (this.config.get<string>('nodeEnv') === 'production') {
      throw new HttpException('Mock login is disabled in production', HttpStatus.FORBIDDEN);
    }

    const email = String(body?.email ?? '').toLowerCase().trim();
    const password = MOCK_ACCOUNTS[email];
    if (!password) {
      throw new HttpException('Invalid mock email provided', HttpStatus.BAD_REQUEST);
    }

    const coreHubUrl = this.config.get<string>('coreHub.url', 'http://localhost:3000').replace(/\/+$/, '');
    let data: { access_token?: string; expires_in?: number };
    try {
      const res = await fetch(`${coreHubUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message ?? json.message ?? `HTTP ${res.status}`);
      data = json.data ?? json;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(`Failed to reach Core Hub for mock login: ${message}`, HttpStatus.BAD_GATEWAY);
    }
    if (!data.access_token) {
      throw new HttpException('Core Hub returned no access token', HttpStatus.BAD_GATEWAY);
    }

    const names = ssoCookieNames(this.config.get<string>('subsystemId', 'csmju-student-activity-matcher'));
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Set-Cookie', buildSessionCookie(names, data.access_token, data.expires_in ?? 900, false));

    const code = MOCK_STUDENT_IDS[email];
    const student = code ? await this.prisma.student.findUnique({ where: { studentId: code } }) : null;
    if (code && !student) {
      throw new HttpException(`Student profile ${code} not found - run "npm run prisma:seed:test-student"`, HttpStatus.CONFLICT);
    }
    this.logger.log(`mock login ${email}${student ? ` -> student ${student.studentId}` : ''}`);
    return { email, studentId: student?.studentId ?? null };
  }
}
