import { httpClient } from "./httpClient";

export type LoginResponse = { access_token: string; refresh_token?: string };
export type UserProfile = {
  id: number;
  email: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
};

export type FeedPost = {
  id: number;
  content: string;
  created_at: string;
  user_id?: number;
};

export type IncidentPayload = {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  severity?: string;
};

export type SOSPayload = {
  latitude: number;
  longitude: number;
  message?: string;
  status?: string;
};

export type RouteData = {
  id: number;
  name: string;
  description?: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  distance_km?: number;
};

export const api = {
  login: (email: string, password: string) =>
    httpClient.post<LoginResponse>("/api/v1/auth/login", { email, password }),
  me: () => httpClient.get<UserProfile>("/api/v1/auth/me"),
  updateProfile: (payload: Partial<UserProfile>) =>
    httpClient.patch<UserProfile>("/api/v1/auth/me", payload),
  incidents: () => httpClient.get("/api/v1/incidents"),
  createIncident: (payload: IncidentPayload) =>
    httpClient.post("/api/v1/incidents", payload),
  routes: () => httpClient.get<RouteData[]>("/api/v1/routes"),
  sos: () => httpClient.get("/api/v1/sos"),
  createSOS: (payload: SOSPayload) => httpClient.post("/api/v1/sos", payload),
  mapSummary: () => httpClient.get("/bff/v1/map/summary"),
  home: () => httpClient.get("/bff/v1/home"),
  feedList: () => httpClient.get<FeedPost[]>("/api/v1/feed"),
  feedCreate: (content: string) => httpClient.post<FeedPost>("/api/v1/feed", { content }),
};
