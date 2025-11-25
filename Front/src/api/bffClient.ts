import { httpClient } from './httpClient';

export type MapSummary = {
  highlights: Array<{ title: string; severity: string; lat: number; lng: number }>;
  counts: { total: number; danger: number; warning: number; info?: number };
};

export type IncidentPayload = {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  severity?: string;
};

export const bff = {
  getMapSummary: () => httpClient.get<MapSummary>('/bff/v1/map/summary'),
  getHome: () => httpClient.get('/bff/v1/home'),
};

export const coreApi = {
  listIncidents: () => httpClient.get('/api/v1/incidents'),
  createIncident: (payload: IncidentPayload) => httpClient.post('/api/v1/incidents', payload),
};
