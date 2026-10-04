import { beforeEach, describe, expect, it, vi } from 'vitest';
import { timeAgo } from '@/lib/api/social';
import { NoStudentProfileError, loadSession } from '@/lib/session';

const respond = (status: number, data: unknown) =>
  Promise.resolve({ ok: status === 200, status, json: () => Promise.resolve({ success: status === 200, data }) } as Response);

describe('loadSession', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockReset();
  });

  const me = (subsystemRole: string) => ({
    id: 'user-002', email: 'student@core.local', coreRole: 'student', subsystemRole,
    session: { expiresAt: '2030-01-01T00:00:00.000Z' },
  });

  it('builds the user from /me and /students/me (the cookie is the session)', async () => {
    fetchMock
      .mockReturnValueOnce(respond(200, me('STUDENT')))
      .mockReturnValueOnce(respond(200, { id: 'row-1', name: 'ภาณุพงษ์ เวียงห้า' }));

    await expect(loadSession()).resolves.toMatchObject({
      role: 'student', studentId: 'row-1', name: 'ภาณุพงษ์ เวียงห้า', sessionExpiresAt: '2030-01-01T00:00:00.000Z',
    });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/v1/me', '/api/v1/students/me']);
  });

  it('admins need no student profile', async () => {
    fetchMock.mockReturnValueOnce(respond(200, { ...me('ADMIN'), email: 'admin@core.local' }));
    await expect(loadSession()).resolves.toMatchObject({ role: 'admin', studentId: undefined, name: 'admin@core.local' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('no session cookie → null (not an error)', async () => {
    fetchMock.mockReturnValueOnce(respond(401, null));
    await expect(loadSession()).resolves.toBeNull();
  });

  it('a student account without a REG profile is reported, not silently empty', async () => {
    fetchMock.mockReturnValueOnce(respond(200, me('STUDENT'))).mockReturnValueOnce(respond(404, null));
    await expect(loadSession()).rejects.toBeInstanceOf(NoStudentProfileError);
  });
});

describe('timeAgo', () => {
  const ago = (s: number) => new Date(Date.now() - s * 1000).toISOString();

  it('uses Thai relative time', () => {
    expect(timeAgo(ago(10))).toBe('เมื่อสักครู่');
    expect(timeAgo(ago(5 * 60))).toBe('5 นาทีที่แล้ว');
    expect(timeAgo(ago(3 * 3600))).toBe('3 ชั่วโมงที่แล้ว');
    expect(timeAgo(ago(2 * 86400))).toBe('2 วันที่แล้ว');
  });
});
