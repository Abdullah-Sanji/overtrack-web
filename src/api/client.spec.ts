import { describe, it, expect, vi, beforeEach } from 'vitest';
import { request, setTokenProvider } from './client';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('client', () => {
  let token = 'old';
  const refresh = vi.fn(async () => {
    token = 'new';
    return 'new';
  });
  const clear = vi.fn();
  beforeEach(() => {
    token = 'old';
    refresh.mockClear();
    clear.mockClear();
    setTokenProvider({ get: () => token, refresh, clear });
  });

  it('sends bearer and unwraps JSON', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(200, { data: { ok: true } }));
    const r = await request<{ data: { ok: boolean } }>('GET', '/me');
    expect(r.data.ok).toBe(true);
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({
      authorization: 'Bearer old',
    });
    fetchMock.mockRestore();
  });

  it('refreshes once on 401 and retries; concurrent requests share one refresh', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_u, init) => {
      const auth = (init?.headers as Record<string, string>).authorization;
      return auth === 'Bearer new'
        ? json(200, { data: 1 })
        : json(401, { statusCode: 401, code: 'TOKEN_EXPIRED', message: 'x' });
    });
    const [a, b] = await Promise.all([
      request<{ data: number }>('GET', '/a'),
      request<{ data: number }>('GET', '/b'),
    ]);
    expect(a.data).toBe(1);
    expect(b.data).toBe(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    fetchMock.mockRestore();
  });

  it('clears the session when refresh fails and throws ApiError', async () => {
    refresh.mockRejectedValueOnce(new Error('nope'));
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(json(401, { statusCode: 401, code: 'TOKEN_EXPIRED', message: 'x' }));
    await expect(request('GET', '/a')).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
    expect(clear).toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it('throws ApiError with code and details on 400', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      json(400, {
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'v',
        details: [{ path: 'x', message: 'bad' }],
      }),
    );
    await expect(request('POST', '/a', { body: {} })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      details: [{ path: 'x', message: 'bad' }],
    });
    fetchMock.mockRestore();
  });
});

describe('client base url', () => {
  it('resolves a relative base against the page origin', async () => {
    const { setApiUrl, API_URL } = await import('./client');
    const original = API_URL;
    setApiUrl('/api/v1');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(200, { data: 1 }));
    await request('GET', '/me', { query: { a: 1 } });
    expect(fetchMock.mock.calls[0][0]).toBe(`${window.location.origin}/api/v1/me?a=1`);
    fetchMock.mockRestore();
    setApiUrl(original);
  });

  it('clears the session when a retried request is still 401', async () => {
    const clear = vi.fn();
    setTokenProvider({ get: () => 'a', refresh: async () => 'b', clear });
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => json(401, { statusCode: 401, code: 'UNAUTHORIZED', message: 'x' }));
    await expect(request('GET', '/a')).rejects.toMatchObject({ status: 401 });
    expect(clear).toHaveBeenCalled();
    fetchMock.mockRestore();
  });
});
