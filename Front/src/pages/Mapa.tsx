import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/api/httpClient";
import { Button } from "@/components/ui/button";
import { AlertCircle, Crosshair, RefreshCw, Route, Siren, MapPin, TriangleAlert } from "lucide-react";

delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

type Incident = { id: number; title: string; latitude: number; longitude: number; severity?: string; description?: string };
type RouteLine = { id: number; name?: string; start_lat: number; start_lng: number; end_lat: number; end_lng: number };
type SOS = { id: number; latitude: number; longitude: number; status?: string; message?: string };

const severityColor = (sev?: string) => {
  if (!sev) return "blue";
  const s = sev.toLowerCase();
  if (s.includes("danger") || s.includes("alta")) return "red";
  if (s.includes("warn") || s.includes("média") || s.includes("media")) return "orange";
  return "green";
};

export default function MapaPage() {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [center, setCenter] = useState<[number, number]>([-23.5505, -46.6333]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading: loadingIncidents } = useQuery<Incident[]>({
    queryKey: ["incidents-web"],
    queryFn: () => httpClient.get("/api/v1/incidents"),
    refetchInterval: 30000,
  });

  const { data: routes = [], isLoading: loadingRoutes } = useQuery<RouteLine[]>({
    queryKey: ["routes-web"],
    queryFn: () => httpClient.get("/api/v1/routes"),
    refetchInterval: 60000,
  });

  const { data: sos = [], isLoading: loadingSos } = useQuery<SOS[]>({
    queryKey: ["sos-web"],
    queryFn: () => httpClient.get("/api/v1/sos"),
    refetchInterval: 15000,
  });

  const createIncident = useMutation({
    mutationFn: (coords: { lat: number; lng: number }) =>
      httpClient.post("/api/v1/incidents", {
        title: "Incidente rápido",
        description: "Reportado pelo mapa web",
        latitude: coords.lat,
        longitude: coords.lng,
        severity: "warning",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents-web"] });
      alert("Incidente enviado");
    },
    onError: () => alert("Falha ao enviar incidente"),
  });

  useEffect(() => {
    setLoadingLocation(true);
    if (!navigator.geolocation) {
      setLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
        setCenter(coords);
        setLoadingLocation(false);
      },
      () => setLoadingLocation(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const routePolylines = useMemo(
    () =>
      routes
        .filter(
          (r) =>
            Number.isFinite(r.start_lat) &&
            Number.isFinite(r.start_lng) &&
            Number.isFinite(r.end_lat) &&
            Number.isFinite(r.end_lng)
        )
        .map((r) => ({
          id: r.id,
          name: r.name,
          coords: [
            [r.start_lat, r.start_lng] as [number, number],
            [r.end_lat, r.end_lng] as [number, number],
          ],
        })),
    [routes]
  );

  const handleCenterOnUser = () => {
    if (userPos) setCenter(userPos);
  };

  const handleQuickIncident = () => {
    if (!userPos) {
      alert("Ative sua localização para reportar rápido.");
      return;
    }
    createIncident.mutate({ lat: userPos[0], lng: userPos[1] });
  };

  return (
    <div className="relative h-[calc(100vh-64px)] bg-slate-50">
      <div className="absolute z-[500] top-4 left-4 right-4 sm:right-auto flex flex-col sm:flex-row gap-3">
        <div className="bg-white/95 backdrop-blur border border-slate-200 shadow-md rounded-xl p-3 flex-1 min-w-[260px]">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-semibold text-slate-800">Mapa ao vivo</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-100">
              Incidentes: {incidents.length}
            </span>
            <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
              Rotas: {routes.length}
            </span>
            <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
              SOS: {sos.length}
            </span>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Button size="sm" variant="secondary" onClick={handleCenterOnUser} disabled={!userPos || loadingLocation}>
              <Crosshair className="w-4 h-4 mr-1" />
              {loadingLocation ? "Buscando..." : "Minha posição"}
            </Button>
            <Button size="sm" variant="default" onClick={() => queryClient.invalidateQueries({ queryKey: ["incidents-web"] })}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Atualizar
            </Button>
            <Button size="sm" variant="destructive" onClick={handleQuickIncident}>
              <AlertCircle className="w-4 h-4 mr-1" />
              Reportar
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1 text-red-700">
              <TriangleAlert className="w-3 h-3" /> perigo
            </div>
            <div className="flex items-center gap-1 text-orange-600">
              <TriangleAlert className="w-3 h-3" /> aviso
            </div>
            <div className="flex items-center gap-1 text-green-700">
              <TriangleAlert className="w-3 h-3" /> info
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur border border-slate-200 shadow-md rounded-xl p-3 flex items-center gap-3 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-blue-600" />
            <span>Rotas traçadas no backend</span>
          </div>
          <div className="flex items-center gap-2">
            <Siren className="w-4 h-4 text-purple-600" />
            <span>SOS ativos</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={14}
        className="h-full w-full z-0"
        zoomControl={true}
        scrollWheelZoom
        attributionControl
        key={`${center[0]}-${center[1]}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {incidents.map((inc) => (
          <Marker key={`inc-${inc.id}`} position={[inc.latitude, inc.longitude]} icon={new L.Icon.Default()}>
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-slate-900">{inc.title}</p>
                <p className="text-xs text-slate-600">{inc.description}</p>
                <span
                  className="inline-flex px-2 py-1 rounded text-white text-[11px]"
                  style={{ backgroundColor: severityColor(inc.severity) }}
                >
                  {inc.severity || "info"}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {routePolylines.map((r) => (
          <Polyline key={`route-${r.id}`} positions={r.coords} pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.7 }}>
            <Popup>
              <div className="text-sm text-slate-800">{r.name || "Rota"}</div>
            </Popup>
          </Polyline>
        ))}

        {sos.map((s) => (
          <Marker key={`sos-${s.id}`} position={[s.latitude, s.longitude]} icon={new L.Icon.Default({ iconUrl: "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-violet.png" })}>
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-slate-900">SOS #{s.id}</p>
                <p className="text-xs text-slate-600">{s.message || "Alerta de emergência"}</p>
                <span className="inline-flex px-2 py-1 rounded text-white text-[11px] bg-purple-600">{s.status || "open"}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {userPos && (
          <Marker position={userPos} icon={new L.DivIcon({ html: '<div style="width:18px;height:18px;border-radius:9999px;background:#10b981;border:2px solid white;box-shadow:0 0 0 6px rgba(16,185,129,0.35)"></div>', className: "" })}>
            <Popup>
              <div className="text-sm text-slate-800">Você está aqui</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {(loadingIncidents || loadingRoutes || loadingSos) && (
        <div className="absolute bottom-4 right-4 bg-white/90 border border-slate-200 shadow-md rounded-full px-4 py-2 text-xs text-slate-600 flex items-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Atualizando dados do mapa...
        </div>
      )}
    </div>
  );
}
