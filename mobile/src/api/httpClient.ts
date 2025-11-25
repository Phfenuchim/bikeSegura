import Constants from "expo-constants";

const API_URL =
  Constants.expoConfig?.extra?.API_URL ||
  (Constants.manifest2?.extra as any)?.API_URL ||
  "http://localhost:8000";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

type HttpMethod = "GET" | "POST" | "PATCH";

async function request<T = any>(
  path: string,
  method: HttpMethod,
  body?: Record<string, unknown>
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const resp = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await resp.text();
  const data = text ? (JSON.parse(text) as T) : null;
  if (!resp.ok) {
    throw new Error((data as any)?.error || resp.statusText);
  }
  return data as T;
}

export const httpClient = {
  get: <T = any>(path: string) => request<T>(path, "GET"),
  post: <T = any>(path: string, body?: Record<string, unknown>) => request<T>(path, "POST", body),
  patch: <T = any>(path: string, body?: Record<string, unknown>) => request<T>(path, "PATCH", body),
};
