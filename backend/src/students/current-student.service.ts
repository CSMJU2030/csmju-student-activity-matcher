import { Injectable } from '@nestjs/common';
import { MOCK_STUDENT_IDS } from '../auth/mock-auth.controller';
import { CoreHubIdentity, SubsystemRole } from '../auth/core-hub-identity';
import { AppException } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';

/** University student mailbox, e.g. mju6704101374@mju.ac.th -> 6704101374 */
const MJU_STUDENT_EMAIL = /^mju(\d{6,})@mju\.ac\.th$/i;

/**
 * Links a verified Core Hub identity to this subsystem's Student profile.
 *
 * The Core Hub JWT carries no student code, so the link is derived from the
 * verified `email` claim - never from a header, query or request body. This
 * is what lets every write act "as the logged-in student" instead of trusting
 * a `studentId` sent by the browser (the legacy MIS app did the latter).
 */
@Injectable()
export class CurrentStudentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Student.studentId (REG student code) this identity acts as, if any. */
  studentCodeFor(user: CoreHubIdentity): string | null {
    const email = user.email?.trim().toLowerCase() ?? '';
    if (process.env.NODE_ENV !== 'production' && MOCK_STUDENT_IDS[email]) {
      return MOCK_STUDENT_IDS[email];
    }
    return MJU_STUDENT_EMAIL.exec(email)?.[1] ?? null;
  }

  async find(user: CoreHubIdentity) {
    const code = this.studentCodeFor(user);
    if (!code) return null;
    return this.prisma.student.findUnique({ where: { studentId: code } });
  }

  /** The caller's own Student profile; 404 when none is linked. */
  async require(user: CoreHubIdentity) {
    const student = await this.find(user);
    if (!student) {
      throw AppException.notFound(
        'No student profile is linked to this Core Hub account - sync it from REG first',
      );
    }
    return student;
  }

  isAdmin(user: CoreHubIdentity): boolean {
    return user.subsystemRole === SubsystemRole.ADMIN;
  }

  /** `:own` scope check - students may only change their own profile. */
  async assertSelfOrAdmin(
    user: CoreHubIdentity,
    studentRowId: string,
    message = 'You can only change your own profile',
  ): Promise<void> {
    if (this.isAdmin(user)) return;
    const me = await this.require(user);
    if (me.id !== studentRowId) {
      throw AppException.forbidden(message);
    }
  }

  /** Who did it, for notification texts: the admin, or the student themselves. */
  async actor(user: CoreHubIdentity): Promise<{ studentId: string | null; label: string }> {
    if (this.isAdmin(user)) return { studentId: null, label: 'ผู้ดูแลระบบ' };
    const me = await this.require(user);
    return { studentId: me.id, label: me.name };
  }
}
