import { CoreHubIdentity, SubsystemRole } from '../auth/core-hub-identity';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentStudentService } from './current-student.service';

const identity = (email: string, subsystemRole = SubsystemRole.STUDENT): CoreHubIdentity => ({
  id: 'user-x',
  email,
  coreRole: subsystemRole.toLowerCase(),
  subsystemRole,
});

describe('CurrentStudentService', () => {
  const findUnique = jest.fn();
  const service = new CurrentStudentService({ student: { findUnique } } as unknown as PrismaService);

  afterEach(() => findUnique.mockReset());

  it('derives the REG student code from an MJU student mailbox', () => {
    expect(service.studentCodeFor(identity('mju6704101374@mju.ac.th'))).toBe('6704101374');
    expect(service.studentCodeFor(identity('  MJU6704101374@MJU.AC.TH '))).toBe('6704101374');
  });

  it('maps the dev mock account to its seeded student', () => {
    expect(service.studentCodeFor(identity('student@core.local'))).toBe('6704101363');
  });

  it('links nothing for other mailboxes', () => {
    expect(service.studentCodeFor(identity('someone@gmail.com'))).toBeNull();
    expect(service.studentCodeFor(identity('mju6704101374@evil.example'))).toBeNull();
  });

  it('require() fails with 404 when no profile is linked', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.require(identity('mju6704101374@mju.ac.th'))).rejects.toMatchObject({ status: 404 });
  });

  it('lets a student act only on their own profile', async () => {
    findUnique.mockResolvedValue({ id: 'student-row-1' });
    const me = identity('mju6704101374@mju.ac.th');
    await expect(service.assertSelfOrAdmin(me, 'student-row-1')).resolves.toBeUndefined();
    await expect(service.assertSelfOrAdmin(me, 'student-row-2')).rejects.toMatchObject({ status: 403 });
  });

  it('lets an admin act on any profile without a linked student', async () => {
    await expect(
      service.assertSelfOrAdmin(identity('admin@core.local', SubsystemRole.ADMIN), 'student-row-2'),
    ).resolves.toBeUndefined();
    expect(findUnique).not.toHaveBeenCalled();
  });
});
