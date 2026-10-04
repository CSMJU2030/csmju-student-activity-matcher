import { apiSend, fetchJsonWithAuth, toQuery } from '@/lib/api/apiClient';

const respond = (status: number, body: unknown) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response);

describe('apiClient', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockReset();
    localStorage.setItem('csmju2030-access-token', 'tok-123');
  });

  it('sends the stored token and unwraps the { success, data } envelope', async () => {
    fetchMock.mockReturnValue(respond(200, { success: true, data: [{ id: 1 }] }));
    await expect(fetchJsonWithAuth('/students')).resolves.toEqual([{ id: 1 }]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/students$/);
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer tok-123');
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

  it('apiSend joins validation message arrays', async () => {
    fetchMock.mockReturnValue(respond(400, { success: false, error: { message: ['name too short', 'date must be yyyy-mm-dd'] } }));
    const res = await apiSend('POST', '/activities', {});
    expect(res).toMatchObject({ success: false, error: 'name too short, date must be yyyy-mm-dd' });
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
