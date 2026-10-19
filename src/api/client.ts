import { ApiError } from './errors';
import type { ApiErrorBody as Body } from './types';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

interface TokenProvider {
  get: () => string | null;
  refresh: () => Promise<string>;
  clear: () => void;
}

let provider: TokenProvider = {
  get: () => null,
  refresh: async () => {
    throw new Error('no provider');
  },
  clear: () => {},
};

export function setTokenProvider(p: TokenProvider) {
  provider = p;
}

let inflightRefresh: Promise<string> | null = null;
function refreshOnce(): Promise<string> {
  if (!inflightRefresh) {
    inflightRefresh = provider.refresh().finally(() => {
      inflightRefresh = null;
    });
  }
  return inflightRefresh;
}

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  formData?: FormData;
  raw?: boolean;
  skipAuth?: boolean;
}

export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(API_URL + path);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const run = async (token: string | null) => {
    const headers: Record<string, string> = {};
    if (token && !opts.skipAuth) headers.authorization = `Bearer ${token}`;
    if (opts.body !== undefined) headers['content-type'] = 'application/json';
    return fetch(url.toString(), {
      method,
      headers,
      credentials: 'include',
      body: opts.formData ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    });
  };

  let res = await run(provider.get());
  if (res.status === 401 && !opts.skipAuth) {
    const body = await safeJson(res);
    if (body?.code === 'TOKEN_EXPIRED' || body?.code === 'UNAUTHORIZED') {
      try {
        const fresh = await refreshOnce();
        res = await run(fresh);
      } catch {
        provider.clear();
        throw new ApiError(401, body.code, body.message);
      }
    } else {
      throw new ApiError(401, body?.code ?? 'UNAUTHORIZED', body?.message ?? 'Unauthorized');
    }
  }
  if (opts.raw) {
    if (!res.ok) await throwFrom(res);
    return res as unknown as T;
  }
  if (res.status === 204) return undefined as T;
  if (!res.ok) await throwFrom(res);
  return (await res.json()) as T;
}

async function safeJson(res: Response): Promise<Body | null> {
  try {
    return (await res.clone().json()) as Body;
  } catch {
    return null;
  }
}

async function throwFrom(res: Response): Promise<never> {
  const body = await safeJson(res);
  throw new ApiError(res.status, body?.code ?? 'HTTP_ERROR', body?.message ?? res.statusText, body?.details);
}

export const get = <T>(path: string, query?: RequestOptions['query']) => request<T>('GET', path, { query });
export const post = <T>(path: string, body?: unknown) => request<T>('POST', path, { body });
export const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body });
export const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, { body });
export const del = <T>(path: string) => request<T>('DELETE', path);
