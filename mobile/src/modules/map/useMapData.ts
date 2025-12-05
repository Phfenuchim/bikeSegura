import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";

export type Incident = { id: number; latitude: number; longitude: number; severity: string; title: string; description?: string; type?: string };
export type SOS = { id: number; latitude: number; longitude: number; status: string; message?: string; type?: string };
export type SupportPoint = { id: number; latitude: number; longitude: number; type?: string; name?: string; description?: string };
export type Route = { id: number; start_lat: number; start_lng: number; end_lat: number; end_lng: number; name: string };

export function useMapData() {
  const queryClient = useQueryClient();
  const { data: incidents = [] } = useQuery<Incident[]>({ queryKey: ["incidents"], queryFn: () => api.incidents() });
  const { data: routes = [] } = useQuery<Route[]>({ queryKey: ["routes"], queryFn: () => api.routes() });
  const { data: sosAlerts = [] } = useQuery<SOS[]>({ queryKey: ["sos"], queryFn: () => api.sos() });
  const { data: mapSummary } = useQuery<{ incidents?: Incident[]; sos?: SOS[]; support_points?: SupportPoint[] }>({
    queryKey: ["map-summary"],
    queryFn: () => api.mapSummary(),
    staleTime: 30000,
    retry: 1,
  });

  const supportPoints: SupportPoint[] = useMemo(() => mapSummary?.support_points || [], [mapSummary]);
  const incidentsList: Incident[] = mapSummary?.incidents || incidents || [];
  const sosList: SOS[] = mapSummary?.sos || sosAlerts || [];

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["incidents"] });
    queryClient.invalidateQueries({ queryKey: ["routes"] });
    queryClient.invalidateQueries({ queryKey: ["sos"] });
    queryClient.invalidateQueries({ queryKey: ["map-summary"] });
  };

  return { incidentsList, supportPoints, sosList, routes, refreshData };
}
