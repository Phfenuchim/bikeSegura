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
  type?: string;
};

export type SOSPayload = {
  latitude: number;
  longitude: number;
  message?: string;
  status?: string;
  type?: string;
};

export type SupportPointPayload = {
  name?: string;
  type: string;
  description?: string;
  latitude: number;
  longitude: number;
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
  traffic_score?: number;
  elevation_gain?: number;
};

export type RouteCreatePayload = {
  name?: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
};

export const api = {
  login: (email: string, password: string) =>
    httpClient.post<LoginResponse>("/api/v1/auth/login", { email, password }),
  register: (email: string, password: string, full_name: string) =>
    httpClient.post<LoginResponse>("/api/v1/auth/register", { email, password, full_name }),
  me: () => httpClient.get<UserProfile>("/api/v1/auth/me"),
  updateProfile: (payload: Partial<UserProfile>) =>
    httpClient.patch<UserProfile>("/api/v1/auth/me", payload),
  incidents: () => httpClient.get("/api/v1/incidents"),
  createIncident: (payload: IncidentPayload) =>
    httpClient.post("/api/v1/incidents", payload),
  routes: () => httpClient.get<RouteData[]>("/api/v1/routes"),
  routesSearch: (q: string) =>
    httpClient.get<RouteData[]>(`/api/v1/routes/search?q=${encodeURIComponent(q)}`),
  createRoute: (payload: RouteCreatePayload) => httpClient.post<RouteData>("/api/v1/routes", payload),
  routesRank: (prefs: { avoidIncidents?: boolean; lowTraffic?: boolean; lowElevation?: boolean }) => {
    const params = new URLSearchParams();
    if (prefs.avoidIncidents) params.append("avoid_incidents", "1");
    if (prefs.lowTraffic) params.append("low_traffic", "1");
    if (prefs.lowElevation) params.append("low_elevation", "1");
    return httpClient.get<RouteData[]>(`/api/v1/routes/rank?${params.toString()}`);
  },
  saveRoute: (routeId: number, save: boolean) =>
    httpClient.post(`/api/v1/routes/${routeId}/save`, { save }),
  savedRoutes: () => httpClient.get<RouteData[]>("/api/v1/routes/saved"),
  shareRoute: (routeId: number, note?: string) =>
    httpClient.post(`/api/v1/routes/${routeId}/share`, { note }),
  setWaypoints: (routeId: number, waypoints: { latitude: number; longitude: number; name?: string }[]) =>
    httpClient.post(`/api/v1/routes/${routeId}/waypoints`, { waypoints }),
  listWaypoints: (routeId: number) =>
    httpClient.get(`/api/v1/routes/${routeId}/waypoints`),
  sos: () => httpClient.get("/api/v1/sos"),
  createSOS: (payload: SOSPayload) => httpClient.post("/api/v1/sos", payload),
  mapSummary: () => httpClient.get("/bff/v1/map/summary"),
  sharedRoutes: () => httpClient.get("/bff/v1/map/summary"),
  home: () => httpClient.get("/bff/v1/home"),
  feedList: () => httpClient.get<FeedPost[]>("/api/v1/feed"),
  feedCreate: (content: string) => httpClient.post<FeedPost>("/api/v1/feed", { content }),
  supportPoints: () => httpClient.get("/api/v1/support-points"),
  createSupportPoint: (payload: SupportPointPayload) => httpClient.post("/api/v1/support-points", payload),
};
