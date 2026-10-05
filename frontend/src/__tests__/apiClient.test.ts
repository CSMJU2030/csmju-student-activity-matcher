import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiSend, fetchJsonWithAuth, startReSso, toQuery } from '@/lib/api/apiClient';

const respond = (status: number, body: unknown) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response);

describe('apiClient (browser)', () => {
  const fetchMock = vi.fn();
  const assign = vi.fn();

  beforeAll(() => {
    // jsdom's location cannot navigate; capture the re-SSO navigation instead.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, pathname: '/groups', search: '?q=x', assign },
    });
  });

  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockReset();
    assign.mockReset();
    sessionStorage.clear();
  });

  it('calls the same-origin proxy with the cookie session and unwraps the envelope', async () => {
    fetchMock.mockReturnValue(respond(200, { success: true, data: [{ id: 1 }] }));
    await expect(fetchJsonWithAuth('/students')).resolves.toEqual([{ id: 1 }]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/students');
    expect(init.credentials).toBe('same-origin');
    // the token is an HttpOnly cookie: page JS never adds it
    expect((init.headers as Headers).has('Authorization')).toBe(false);
  });

  it('a 401 sends the page through /auth/login, back to where it was (silent re-SSO)', async () => {
    fetchMock.mockReturnValue(respond(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'expired' } }));
    await apiSend('POST', '/groups', { name: 'x' });
    expect(assign).toHaveBeenCalledWith('/auth/login?next=%2Fgroups%3Fq%3Dx');
  });

  it('does not loop: a second 401 within 30 s does not redirect again', () => {
    expect(startReSso()).toBe(true);
    expect(startReSso()).toBe(false);
    expect(assign).toHaveBeenCalledTimes(1);
  });

  it('reauth: false leaves a 401 alone (signed-out is a normal state on the login page)', async () => {
    fetchMock.mockReturnValue(respond(401, { success: false, error: { code: 'UNAUTHORIZED' } }));
    await expect(fetchJsonWithAuth('/me', { reauth: false })).rejects.toThrow('401');
    expect(assign).not.toHaveBeenCalled();
  });

  it('apiSend returns data on success and sends JSON', async () => {
    fetchMock.mockReturnValue(respond(201, { success: true, data: { groupId: 'g1' } }));
    const res = await apiSend('POST', '/groups', { name: 'x' });

    expect(res).toEqual({ success: true, data: { groupId: 'g1' } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ name: 'x' }));
  });

  it('apiSend turns the backend error envelope into a readable message', async () => {
    fetchMock.mockReturnValue(respond(409, { success: false, error: { code: 'CONFLICT', message: 'Activity is full' } }));
    await expect(apiSend('POST', '/activities/a/join')).resolves.toEqual({ success: false, error: 'Activity is full', status: 409 });
  });

  it('apiSend shows the per-field validation details', async () => {
    fetchMock.mockReturnValue(respond(400, {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: ['title must be longer', 'date must be yyyy-mm-dd'] },
    }));
    const res = await apiSend('POST', '/activities', {});
    expect(res).toMatchObject({ success: false, error: 'title must be longer, date must be yyyy-mm-dd' });
  });

  it('apiSend reports network failures instead of throwing', async () => {
    fetchMock.mockRejectedValue(new Error('Failed to fetch'));
    await expect(apiSend('GET', '/x')).resolves.toEqual({ success: false, error: 'Failed to fetch', status: 0 });
  });

  it('toQuery skips empty values and joins arrays', () => {
    expect(toQuery({ search: 'val', year: 3, interestIds: ['a', 'b'], lookingForId: '', x: undefined, empty: [] })).toBe(
      '?search=val&year=3&interestIds=a%2Cb',
    );
    expect(toQuery({})).toBe('');
  });
});
