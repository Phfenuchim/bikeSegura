import { useMemo, useRef, useState } from "react";
import { haversineDistanceKm } from "../../utils/distance";
import { api } from "../../api/client";
import { Alert } from "react-native";

export type Waypoint = { latitude: number; longitude: number; name?: string };

export function usePlanningState() {
  const hasSetFallback = useRef(false);
  const [planningMode, setPlanningMode] = useState(false);
  const [planningRouteId, setPlanningRouteId] = useState<number | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [planningPrefs, setPlanningPrefs] = useState({
    avoidIncidents: false,
    preferLowTraffic: false,
    preferLowElevation: false,
  });
  const [rankedRoutes, setRankedRoutes] = useState<any[]>([]);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showWaypointModal, setShowWaypointModal] = useState(false);
  const [showRoutePreview, setShowRoutePreview] = useState(false);

  const planningPath =
    planningMode && origin
      ? [origin, ...waypoints.map((w) => ({ latitude: w.latitude, longitude: w.longitude })), ...(destination ? [destination] : [])]
      : [];

  const planningDistanceKm = () => {
    if (!origin || !destination) return null;
    const pts = [origin, ...waypoints.map((w) => ({ latitude: w.latitude, longitude: w.longitude })), destination];
    if (pts.length < 2) return null;
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      total += haversineDistanceKm(pts[i].latitude, pts[i].longitude, pts[i + 1].latitude, pts[i + 1].longitude);
    }
    return total;
  };

  const planningMetrics = useMemo(() => {
    const distance = planningDistanceKm();
    return {
      distanceKm: distance,
      points: planningPath.length,
      estimatedElevationGain: null as number | null,
    };
  }, [planningPath]);

  const saveWaypoints = async (routeId: number) => {
    if (!origin || !destination) {
      Alert.alert("Planejamento", "Defina origem e destino antes de salvar.");
      return false;
    }
    const payloadPoints = [
      origin ? { ...origin, name: "Origem" } : null,
      ...waypoints,
      destination ? { ...destination, name: "Destino" } : null,
    ].filter(Boolean) as Waypoint[];

    if (!payloadPoints.length) {
      Alert.alert("Planejamento", "Defina origem/destino e pontos.");
      return false;
    }
    try {
      await api.setWaypoints(routeId, payloadPoints);
      Alert.alert("Ok", "Planejamento salvo");
      hasSetFallback.current = false;
      setPlanningMode(false);
      setPlanningRouteId(routeId);
      setWaypoints([]);
      setOrigin(null);
      setDestination(null);
      return true;
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha ao salvar pontos");
      return false;
    }
  };

  return {
    planningMode,
    setPlanningMode,
    planningRouteId,
    setPlanningRouteId,
    planningPrefs,
    setPlanningPrefs,
    rankedRoutes,
    setRankedRoutes,
    waypoints,
    setWaypoints,
    origin,
    setOrigin,
    destination,
    setDestination,
    showWaypointModal,
    setShowWaypointModal,
    planningPath,
    planningMetrics,
    saveWaypoints,
    showRoutePreview,
    setShowRoutePreview,
    hasSetFallback,
  };
}
