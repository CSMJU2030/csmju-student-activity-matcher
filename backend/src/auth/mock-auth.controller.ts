import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

/** Dev-only: mock Core Hub account -> the subsystem profile (Student.studentId) it acts as. */
export const MOCK_STUDENT_IDS: Record<string, string> = {
  'student@core.local': '6704101363', // ภาณุพงษ์ เวียงห้า (same code as the REG record)
};

@Controller('auth')
export class MockAuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post('mock-login')
  async mockLogin(@Body() body: { email: string }) {
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException('Mock login is disabled in production', HttpStatus.FORBIDDEN);
    }

    const email = body.email.toLowerCase().trim();
    let password = '';

    console.log(`\n[MockAuth] Received login request for email: ${email}`);

    if (email === 'admin@core.local') {
      password = 'password1';
    } else if (email === 'student@core.local') {
      password = 'password2';
    } else if (email === 'staff@core.local') {
      password = 'password3';
    } else if (email === 'alumni@core.local') {
      password = 'password4';
    } else {
      console.log(`[MockAuth] Rejecting unmapped .local email: ${email}`);
      throw new HttpException('Invalid mock email provided', HttpStatus.BAD_REQUEST);
    }

    try {
      console.log(`[MockAuth] Proxining credentials to Core Hub backend at http://localhost:3000/api/v1/auth/login`);
      const response = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok || data.success === false) {
        console.error(`[MockAuth] Core Hub login failed:`, data);
        throw new Error(data.message || data.error?.message || 'Login failed on Core Hub');
      }

      console.log(`[MockAuth] Core Hub returned successful JWT. Resolving proxy flow.`);
      
      // The Core Hub ResponseInterceptor wraps data in { success: true, data: { ... } }
      // We must unwrap it so the frontend seamlessly receives the expected { access_token: ... } format natively.
      const tokenData = data.data ? data.data : data;

      // The JWT is issued by Core Hub and carries no subsystem student id, so bind the
      // mock account to its student profile here and return the id alongside the token.
      const studentId = MOCK_STUDENT_IDS[email];
      if (!studentId) return tokenData;

      const student = await this.prisma.student.findUnique({ where: { studentId } });
      if (!student) {
        throw new Error(`Student profile ${studentId} not found - run "npm run prisma:seed:test-student"`);
      }
      console.log(`[MockAuth] Bound ${email} -> student ${student.studentId} (${student.name})`);
      return { ...tokenData, studentId: student.studentId };
    } catch (error) {
      console.error(`[MockAuth] Proxy flow exception:`, error);
      const errMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to reach Core Hub for mock login: ${errMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
