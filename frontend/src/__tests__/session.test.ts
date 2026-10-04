import { timeAgo } from '@/lib/api/social';
import { tokenSecondsLeft } from '@/lib/session';

// session.ts imports server actions (next/headers); they are not exercised here.
jest.mock('@/lib/actions', () => ({ setTokenCookie: jest.fn(), clearTokenCookie: jest.fn() }));

const jwt = (payload: object) => `h.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.s`;

describe('tokenSecondsLeft', () => {
  it('reads exp from the JWT payload', () => {
    const exp = Math.floor(Date.now() / 1000) + 600;
    expect(tokenSecondsLeft(jwt({ exp }))).toBeGreaterThan(590);
  });

  it('treats expired, missing or malformed tokens as expired', () => {
    expect(tokenSecondsLeft(jwt({ exp: Math.floor(Date.now() / 1000) - 5 }))).toBeLessThanOrEqual(0);
    expect(tokenSecondsLeft(null)).toBe(0);
    expect(tokenSecondsLeft('not-a-jwt')).toBe(0);
    expect(tokenSecondsLeft(jwt({ sub: 'no-exp' }))).toBe(0);
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
