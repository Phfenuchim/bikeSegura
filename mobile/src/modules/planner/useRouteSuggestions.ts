import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";

export type SuggestionRoute = {
  id: number;
  name: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
};

type Props = {
  routeSearch: string;
  searchTarget: "route" | "origin" | "destination";
  coords: { lat: number; lng: number } | null;
  routes: SuggestionRoute[];
  initialRegion: { latitude: number; longitude: number };
};

export function useRouteSuggestions({ routeSearch, searchTarget, coords, routes, initialRegion }: Props) {
  const [routeSuggestions, setRouteSuggestions] = useState<SuggestionRoute[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const clearSuggestions = useCallback(() => {
    setRouteSuggestions([]);
    setShowSearchSuggestions(false);
  }, []);

  const sortByDistance = useCallback(
    (list: SuggestionRoute[]) => {
      if (!coords) return list;
      return [...list].sort((a, b) => {
        const da = haversineDistance(coords.lat, coords.lng, a.start_lat, a.start_lng);
        const db = haversineDistance(coords.lat, coords.lng, b.start_lat, b.start_lng);
        return da - db;
      });
    },
    [coords]
  );

  const applySuggestions = useCallback((list: SuggestionRoute[], autoShow = true) => {
    setRouteSuggestions((prev) => {
      if (prev.length === list.length && prev.every((p, i) => p.id === list[i].id)) return prev;
      return list;
    });
    if (autoShow) setShowSearchSuggestions(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const q = routeSearch.trim();

    if (q.length < 3) {
      if (searchTarget === "route") {
        const base = sortByDistance(routes).slice(0, 6);
        applySuggestions(base);
      } else {
        applySuggestions([], false);
      }
      return () => controller.abort();
    }

    const timer = setTimeout(async () => {
      if (searchTarget === "origin" || searchTarget === "destination") {
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
            { signal: controller.signal, headers: { "User-Agent": "bikeSegura-app/1.0" } }
          );
          if (resp.ok) {
            const data = await resp.json();
            const mapped: SuggestionRoute[] = (data || []).map((item: any, idx: number) => ({
              id: -idx - 1,
              name: item.display_name || q,
              start_lat: parseFloat(item.lat),
              start_lng: parseFloat(item.lon),
              end_lat: parseFloat(item.lat),
              end_lng: parseFloat(item.lon),
            }));
            applySuggestions(sortByDistance(mapped));
            return;
          }
        } catch {
          /* ignore */
        }
        const lat = coords?.lat ?? initialRegion.latitude;
        const lng = coords?.lng ?? initialRegion.longitude;
        applySuggestions(sortByDistance([{ id: -1, name: q, start_lat: lat, start_lng: lng, end_lat: lat, end_lng: lng }]));
        return;
      }

      try {
        const data = await api.routesSearch(q);
        if (data.length) {
          applySuggestions(sortByDistance(data));
          return;
        }
      } catch {
        /* ignore */
      }
      const local = routes.filter((r) => r.name?.toLowerCase().includes(q.toLowerCase()));
      applySuggestions(sortByDistance(local));
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [routeSearch, searchTarget, coords, routes, initialRegion.latitude, initialRegion.longitude, sortByDistance, applySuggestions]);

  return useMemo(
    () => ({
      routeSuggestions,
      showSearchSuggestions,
      setShowSearchSuggestions,
      clearSuggestions,
    }),
    [routeSuggestions, showSearchSuggestions, clearSuggestions]
  );
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
