const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = Omit<RequestInit, 'method' | 'body'> & {
  method?: HttpMethod;
  body?: BodyInit | null;
};

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const resp = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await resp.text();
  const data = text ? (JSON.parse(text) as T) : null;

  if (!resp.ok) {
    const errorMessage = (data as any)?.error || resp.statusText;
    throw new Error(errorMessage);
  }

  return data as T;
}

export const httpClient = {
  get: <T = any>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
};
