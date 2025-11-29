import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from "react-native";
import { haversineDistanceKm } from "./utils/distance";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "./api/client";
import { useRouteSelection } from "./RouteSelectionContext";
import { useRouteSuggestions } from "./modules/planner/useRouteSuggestions";
import { useMapData } from "./modules/map/useMapData";
import { usePlanningState } from "./modules/planner/usePlanningState";

type Incident = { id: number; latitude: number; longitude: number; severity: string; title: string; description?: string };
type Route = { id: number; start_lat: number; start_lng: number; end_lat: number; end_lng: number; name: string };
type SOS = { id: number; latitude: number; longitude: number; status: string; message?: string };
type SupportPoint = { id: number; latitude: number; longitude: number; type?: string; name?: string; description?: string };

type Props = { onLogout: () => void };

export default function MapScreen({ onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const { route: routeToFocus, clear: clearRouteSelection } = useRouteSelection();
  const [bottomTab, setBottomTab] = useState<"alertas" | "rotas" | "sos">("rotas");
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const {
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
  } = usePlanningState();
  const [routeSearch, setRouteSearch] = useState("");
  const [searchTarget, setSearchTarget] = useState<"route" | "origin" | "destination">("route");
  const [showManageList, setShowManageList] = useState(true);
  const mapRef = useRef<MapView | null>(null);
  const searchInputRef = useRef<TextInput | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const initialRegion = {
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };
  const queryClient = useQueryClient();
  const { incidentsList, supportPoints, sosList, routes, refreshData } = useMapData();
  const { routeSuggestions, showSearchSuggestions, setShowSearchSuggestions, clearSuggestions } = useRouteSuggestions({
    routeSearch,
    searchTarget,
    coords,
    routes,
    initialRegion,
  });

  const resetPlanning = () => {
    hasSetFallback.current = false;
    setPlanningMode(false);
    setPlanningRouteId(null);
    setSelectedRouteId(null);
    setRouteSearch("");
    clearSuggestions();
    setOrigin(null);
    setDestination(null);
    setWaypoints([]);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setHasLocation(true);
        await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 8000, distanceInterval: 20 },
          (update) => setCoords({ lat: update.coords.latitude, lng: update.coords.longitude })
        );
      } else {
        Alert.alert("Localizacao", "Permissao negada. Ative o GPS para recentralizar.");
      }
    })();
  }, []);


  const incidentScore = (r: Route) => {
    const latMin = Math.min(r.start_lat, r.end_lat) - 0.02;
    const latMax = Math.max(r.start_lat, r.end_lat) + 0.02;
    const lngMin = Math.min(r.start_lng, r.end_lng) - 0.02;
    const lngMax = Math.max(r.start_lng, r.end_lng) + 0.02;
    return incidentsList.filter(
      (i) => i.latitude >= latMin && i.latitude <= latMax && i.longitude >= lngMin && i.longitude <= lngMax
    ).length;
  };

  const displayRoutes =
    rankedRoutes.length > 0 && planningMode
      ? rankedRoutes
      : planningPrefs.avoidIncidents || planningPrefs.preferLowTraffic || planningPrefs.preferLowElevation
      ? [...routes].sort((a, b) => incidentScore(a) - incidentScore(b))
      : routes;

  const animateTo = (lat: number, lng: number, delta = 0.05) => {
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta }, 400);
  };

  const handleQuickIncident = async () => {
    if (!coords) {
      Alert.alert("Localizacao", "Nao foi possivel obter sua posicao");
      return;
    }
    try {
      await api.createIncident({
        title: "Incidente rapido",
        description: "Relato enviado pelo app",
        latitude: coords.lat,
        longitude: coords.lng,
        severity: "warning",
      });
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
      Alert.alert("Ok", "Incidente reportado");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha ao criar incidente");
    }
  };

  const handleQuickSOS = async () => {
    if (!coords) {
      Alert.alert("Localizacao", "Nao foi possivel obter sua posicao");
      return;
    }
    try {
      await api.createSOS({ latitude: coords.lat, longitude: coords.lng, message: "SOS enviado pelo app", status: "open" });
      await queryClient.invalidateQueries({ queryKey: ["sos"] });
      Alert.alert("Ok", "SOS enviado");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha ao enviar SOS");
    }
  };

  useEffect(() => {
    if (routeToFocus) {
      setSelectedRouteId(routeToFocus.id);
      setPlanningRouteId(routeToFocus.id);
      setPlanningMode(true);
      animateTo(routeToFocus.start_lat, routeToFocus.start_lng, 0.08);
    }
  }, [routeToFocus]);

  useEffect(() => {
    if (!planningMode || planningRouteId || hasSetFallback.current) return;
    const baseList = rankedRoutes.length ? rankedRoutes : routes;
    const fallback = selectedRouteId || baseList[0]?.id || routes[0]?.id;
    if (fallback) {
      hasSetFallback.current = true;
      setPlanningRouteId(fallback);
    }
  }, [planningMode, planningRouteId, selectedRouteId, rankedRoutes, routes]);

  useEffect(() => {
    const loadRanked = async () => {
      if (!planningMode) {
        setRankedRoutes([]);
        return;
      }
      try {
        const data = await api.routesRank({
          avoidIncidents: planningPrefs.avoidIncidents,
          lowTraffic: planningPrefs.preferLowTraffic,
          lowElevation: planningPrefs.preferLowElevation,
        });
        setRankedRoutes(data);
      } catch {
        setRankedRoutes([]);
      }
    };
    loadRanked();
  }, [planningMode, planningPrefs]);

  const handleMapPress = (e: any) => {
    if (!planningMode) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (!origin) {
      setOrigin({ latitude, longitude });
      return;
    }
    if (!destination) {
      setDestination({ latitude, longitude });
      return;
    }
    setWaypoints((prev) => [...prev, { latitude, longitude, name: `Ponto ${prev.length + 1}` }]);
  };

  const resolveRouteId = () => {
    const candidates = [
      planningRouteId,
      selectedRouteId,
      routeSuggestions.find((r) => r.id > 0)?.id,
      displayRoutes.find((r) => r.id > 0)?.id,
      routes.find((r) => r.id > 0)?.id,
    ].filter(Boolean) as number[];
    return candidates[0];
  };

  const saveWaypoints = async () => {
    if (!origin || !destination) {
      Alert.alert("Planejamento", "Defina origem e destino antes de salvar.");
      return;
    }
    const routeId = resolveRouteId();
    if (!routeId) {
      Alert.alert("Planejamento", "Nenhuma rota disponivel. Selecione na busca ou aguarde o carregamento.");
      return;
    }
    const payloadPoints = [
      origin ? { ...origin, name: "Origem" } : null,
      ...waypoints,
      destination ? { ...destination, name: "Destino" } : null,
    ].filter(Boolean) as { latitude: number; longitude: number; name?: string }[];

    if (!payloadPoints.length) {
      Alert.alert("Planejamento", "Defina origem/destino e pontos.");
      return;
    }
    try {
      await api.setWaypoints(routeId, payloadPoints);
      Alert.alert("Ok", "Planejamento salvo");
      setPlanningMode(false);
      setRouteSearch("");
      clearSuggestions();
      setOrigin(null);
      setDestination(null);
      setWaypoints([]);
      setPlanningRouteId(routeId);
      hasSetFallback.current = false;
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha ao salvar pontos");
    }
  };

  const startNavigation = () => {
    if (!origin || !destination) {
      Alert.alert("Navegacao", "Defina origem e destino.");
      return;
    }
    const routeId = resolveRouteId();
    if (!routeId) {
      Alert.alert("Navegacao", "Escolha ou salve uma rota primeiro.");
      return;
    }
    animateTo(origin.latitude, origin.longitude, 0.06);
    Alert.alert("Navegacao", `Iniciando rota #${routeId} (mock).`);
  };

  const planningPath =
    planningMode && origin
      ? [
          origin,
          ...waypoints.map((w) => ({ latitude: w.latitude, longitude: w.longitude })),
          ...(destination ? [destination] : []),
        ]
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

  const mapPadding = {
    top: insets.top + (planningMode ? 130 : 60),
    bottom: insets.bottom + (planningMode ? 180 : 120),
    left: 16,
    right: 16,
  };

  const focusSearchTarget = (target: "route" | "origin" | "destination") => {
    setSearchTarget(target);
    setShowSearchSuggestions(true);
    searchInputRef.current?.focus();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={hasLocation}
        showsMyLocationButton={false}
        showsBuildings
        pitchEnabled
        rotateEnabled
        zoomControlEnabled={false}
        scrollEnabled
        mapPadding={mapPadding}
        onPress={handleMapPress}
      >
        {planningPath.length >= 2 && (
          <Polyline
            coordinates={planningPath}
            strokeColor="#22c55e"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {routes.map((r) => (
          <View key={`route-${r.id}`}>
            <Marker
              coordinate={{ latitude: r.start_lat, longitude: r.start_lng }}
              title={`Rota: ${r.name}`}
              description="Inicio"
              pinColor={selectedRouteId === r.id ? "dodgerblue" : "blue"}
            />
            <Marker
              coordinate={{ latitude: r.end_lat, longitude: r.end_lng }}
              title={`Chegada: ${r.name}`}
              description="Destino"
              pinColor={selectedRouteId === r.id ? "dodgerblue" : "navy"}
            />
            <Polyline
              coordinates={[
                { latitude: r.start_lat, longitude: r.start_lng },
                { latitude: r.end_lat, longitude: r.end_lng },
              ]}
              strokeColor={selectedRouteId === r.id ? "#1d4ed8" : "#2563eb"}
              strokeWidth={selectedRouteId === r.id ? 6 : 3}
              lineDashPattern={selectedRouteId === r.id ? undefined : [8, 6]}
            />
          </View>
        ))}

        {incidentsList.map((inc) => (
          <Marker
            key={`inc-${inc.id}`}
            coordinate={{ latitude: inc.latitude, longitude: inc.longitude }}
            title={inc.title}
            description={inc.description || "Incidente"}
            pinColor="#f97316"
          />
        ))}

        {sosList.map((s) => (
          <Marker
            key={`sos-${s.id}`}
            coordinate={{ latitude: s.latitude, longitude: s.longitude }}
            title={`SOS #${s.id}`}
            description={s.status || "open"}
            pinColor="#ef4444"
          />
        ))}

        {supportPoints.map((sp) => (
          <Marker
            key={`sup-${sp.id}`}
            coordinate={{ latitude: sp.latitude, longitude: sp.longitude }}
            title={sp.name || sp.type || "Ponto de apoio"}
            description={sp.description || sp.type || "Apoio"}
            pinColor="#10b981"
          />
        ))}

        {planningMode &&
          waypoints.map((wp, idx) => (
            <Marker
              key={`wp-${idx}`}
              coordinate={{ latitude: wp.latitude, longitude: wp.longitude }}
              title={wp.name || `Ponto ${idx + 1}`}
              pinColor="orange"
            />
          ))}

        {origin && (
          <Marker coordinate={origin} title="Origem" pinColor="#22c55e" />
        )}
        {destination && (
          <Marker coordinate={destination} title="Destino" pinColor="#ef4444" />
        )}
        {hasLocation && coords ? <Marker key="me" coordinate={{ latitude: coords.lat, longitude: coords.lng }} title="Voce" pinColor="blue" /> : null}
      </MapView>

      <View style={[styles.appbar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Text style={styles.appbarTitle}>BikeSegura - Mapa</Text>
        <View style={styles.appbarActions}>
          <TouchableOpacity style={styles.iconButton} onPress={refreshData}>
            <Ionicons name="refresh" size={18} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              if (coords) animateTo(coords.lat, coords.lng, 0.03);
            }}
          >
            <Ionicons name="locate-outline" size={18} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: "#ef4444" }]} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {planningMode && (
        <View style={[styles.searchTop, { top: insets.top + 52 }]}>
          <View style={styles.searchBox}>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Buscar rota para planejar..."
              placeholderTextColor="#94a3b8"
              value={routeSearch}
              onFocus={() => {
                setSearchTarget("route");
                setShowSearchSuggestions(true);
              }}
              onChangeText={setRouteSearch}
            />
            <View style={styles.targetRow}>
              {[
                { key: "route", label: "Rotas" },
                { key: "origin", label: "Origem" },
                { key: "destination", label: "Destino" },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.targetChip, searchTarget === opt.key && styles.targetChipActive]}
                  onPress={() => focusSearchTarget(opt.key as "route" | "origin" | "destination")}
                >
                  <Text style={styles.targetChipText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {showSearchSuggestions && routeSuggestions.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.suggestions}
                contentContainerStyle={{ gap: 8 }}
              >
                {routeSuggestions.map((r) => {
                  const dist =
                    coords && r.start_lat && r.start_lng
                      ? haversineDistanceKm(coords.lat, coords.lng, r.start_lat, r.start_lng)
                      : null;
                  return (
                    <TouchableOpacity
                      key={`suggest-${r.id}`}
                      style={[
                        styles.suggestionChip,
                        planningRouteId === r.id && styles.suggestionChipActive,
                      ]}
                      onPress={() => {
                        setPlanningRouteId(r.id);
                        setSelectedRouteId(r.id);
                        setPlanningMode(true);
                        setRouteSearch(r.name);
                        setShowSearchSuggestions(false);
                        if (searchTarget === "origin" || searchTarget === "route") {
                          setOrigin({ latitude: r.start_lat, longitude: r.start_lng });
                        }
                        if (searchTarget === "destination" || searchTarget === "route") {
                          setDestination({ latitude: r.end_lat, longitude: r.end_lng });
                        }
                        animateTo(r.start_lat, r.start_lng, 0.1);
                      }}
                    >
                      <Text
                        style={[
                          styles.suggestionText,
                          planningRouteId === r.id && { color: "#0f172a" },
                        ]}
                        numberOfLines={1}
                      >
                        {r.name || `Rota #${r.id}`}
                      </Text>
                      {dist !== null && (
                        <Text style={styles.suggestionSub}>~{dist.toFixed(1)} km de voce</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      )}
      {planningMode && (
        <View style={[styles.planBar, { top: insets.top + 56 }]}>
          <Text style={styles.planText}>
            Planejando rota {planningRouteId ? `#${planningRouteId}` : ""} | Pontos: {waypoints.length}
            {planningDistanceKm() ? ` | ~${planningDistanceKm()!.toFixed(1)} km` : " | defina origem/destino"}
          </Text>
          <View style={styles.planActions}>
            <TouchableOpacity style={styles.planButton} onPress={() => setWaypoints([])}>
              <Text style={styles.planButtonText}>Limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.planButton}
              disabled={!origin && !destination && !waypoints.length}
              onPress={() => setShowWaypointModal(true)}
            >
              <Text style={styles.planButtonText}>Reordenar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.planButton, { backgroundColor: "#22c55e" }]} onPress={saveWaypoints}>
              <Text style={[styles.planButtonText, { color: "#0b1220" }]}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.planButton, { backgroundColor: "#10b981" }]}
              disabled={!planningMetrics.distanceKm}
              onPress={() => setShowRoutePreview(true)}
            >
              <Text style={[styles.planButtonText, { color: "#0b1220" }]}>Iniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.planButton, { backgroundColor: "#ef4444" }]} onPress={resetPlanning}>
              <Text style={[styles.planButtonText, { color: "#fff" }]}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        {planningMode && (
          <View style={styles.planBox}>
            <Text style={styles.planBoxTitle}>Planejamento</Text>
            {planningDistanceKm() && (
              <Text style={styles.planBoxItem}>
                Distancia estimada: ~{planningDistanceKm()!.toFixed(1)} km
              </Text>
            )}

            <View style={styles.planInfoRow}>
              <TouchableOpacity style={styles.planChip} onPress={() => setShowManageList((p) => !p)}>
                <Ionicons name={showManageList ? "chevron-down" : "chevron-forward"} size={14} color="#fff" />
                <Text style={styles.planChipText}>{showManageList ? "Esconder pontos" : "Gerenciar pontos"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.planChip, { backgroundColor: "#22c55e" }]} onPress={saveWaypoints}>
                <Text style={[styles.planChipText, { color: "#0b1220" }]}>Salvar rota</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.planChip, { backgroundColor: "#10b981" }]} onPress={startNavigation}>
                <Text style={[styles.planChipText, { color: "#0b1220" }]}>Iniciar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.planChip, { backgroundColor: "#ef4444" }]} onPress={resetPlanning}>
                <Text style={styles.planChipText}>Sair</Text>
              </TouchableOpacity>
            </View>

            {showSearchSuggestions && routeSuggestions.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.suggestions}
                contentContainerStyle={{ gap: 8 }}
              >
                {routeSuggestions.map((r) => {
                  const dist =
                    coords && r.start_lat && r.start_lng
                      ? haversineDistanceKm(coords.lat, coords.lng, r.start_lat, r.start_lng)
                      : null;
                  return (
                    <TouchableOpacity
                      key={`suggest-${r.id}`}
                      style={[
                        styles.suggestionChip,
                        planningRouteId === r.id && styles.suggestionChipActive,
                      ]}
                      onPress={() => {
                        setPlanningRouteId(r.id);
                        setSelectedRouteId(r.id);
                        setPlanningMode(true);
                        setRouteSearch(r.name);
                        setShowSearchSuggestions(false);
                        if (searchTarget === "origin" || searchTarget === "route") {
                          setOrigin({ latitude: r.start_lat, longitude: r.start_lng });
                        }
                        if (searchTarget === "destination" || searchTarget === "route") {
                          setDestination({ latitude: r.end_lat, longitude: r.end_lng });
                        }
                        animateTo(r.start_lat, r.start_lng, 0.1);
                      }}
                    >
                      <Text
                        style={[
                          styles.suggestionText,
                          planningRouteId === r.id && { color: "#0f172a" },
                        ]}
                        numberOfLines={1}
                      >
                        {r.name || `Rota #${r.id}`}
                      </Text>
                      {dist !== null && (
                        <Text style={styles.suggestionSub}>~{dist.toFixed(1)} km de voce</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.prefRow}>
              <TouchableOpacity
                style={[styles.prefChip, planningPrefs.avoidIncidents && styles.prefChipActive]}
                onPress={() => setPlanningPrefs((p) => ({ ...p, avoidIncidents: !p.avoidIncidents }))}
              >
                <Ionicons name="alert-circle-outline" size={14} color={planningPrefs.avoidIncidents ? "#0f172a" : "#475569"} />
                <Text style={[styles.prefText, planningPrefs.avoidIncidents && styles.prefTextActive]}>
                  Evitar incidentes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.prefChip, planningPrefs.preferLowTraffic && styles.prefChipActive]}
                onPress={() => setPlanningPrefs((p) => ({ ...p, preferLowTraffic: !p.preferLowTraffic }))}
              >
                <Ionicons name="car-outline" size={14} color={planningPrefs.preferLowTraffic ? "#0f172a" : "#475569"} />
                <Text style={[styles.prefText, planningPrefs.preferLowTraffic && styles.prefTextActive]}>
                  Menos transito
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.prefChip, planningPrefs.preferLowElevation && styles.prefChipActive]}
                onPress={() => setPlanningPrefs((p) => ({ ...p, preferLowElevation: !p.preferLowElevation }))}
              >
                <Ionicons name="trending-down-outline" size={14} color={planningPrefs.preferLowElevation ? "#0f172a" : "#475569"} />
                <Text style={[styles.prefText, planningPrefs.preferLowElevation && styles.prefTextActive]}>
                  Menos elevacao
                </Text>
              </TouchableOpacity>
            </View>
            {showManageList && (
              <View style={{ marginTop: 8, gap: 6 }}>
                <View style={styles.waypointRowInline}>
                  <View>
                    <Text style={[styles.planBoxItem, { color: "#e2e8f0" }]}>Origem</Text>
                    <Text style={styles.planBoxItem}>
                      {origin ? `${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)}` : "Toque no mapa ou busque"}
                    </Text>
                  </View>
                  <View style={styles.inlineActions}>
                    <TouchableOpacity onPress={() => focusSearchTarget("origin")}>
                      <Ionicons name="search" size={18} color="#e2e8f0" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (coords) setOrigin({ latitude: coords.lat, longitude: coords.lng });
                      }}
                    >
                      <Ionicons name="locate-outline" size={18} color="#22c55e" />
                    </TouchableOpacity>
                    {origin && (
                      <>
                        <TouchableOpacity onPress={() => animateTo(origin.latitude, origin.longitude, 0.04)}>
                          <Ionicons name="navigate-outline" size={18} color="#22c55e" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setOrigin(null)}>
                          <Ionicons name="close" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.waypointRowInline}>
                  <View>
                    <Text style={[styles.planBoxItem, { color: "#e2e8f0" }]}>Destino</Text>
                    <Text style={styles.planBoxItem}>
                      {destination
                        ? `${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}`
                        : "Toque no mapa ou busque"}
                    </Text>
                  </View>
                  <View style={styles.inlineActions}>
                    <TouchableOpacity onPress={() => focusSearchTarget("destination")}>
                      <Ionicons name="search" size={18} color="#e2e8f0" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (coords) setDestination({ latitude: coords.lat, longitude: coords.lng });
                      }}
                    >
                      <Ionicons name="locate-outline" size={18} color="#22c55e" />
                    </TouchableOpacity>
                    {destination && (
                      <>
                        <TouchableOpacity onPress={() => animateTo(destination.latitude, destination.longitude, 0.04)}>
                          <Ionicons name="navigate-outline" size={18} color="#22c55e" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setDestination(null)}>
                          <Ionicons name="close" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                {waypoints.length ? (
                  waypoints.map((wp, idx) => (
                    <View key={`wp-inline-${idx}`} style={styles.waypointRowInline}>
                      <View>
                        <Text style={[styles.planBoxItem, { color: "#e2e8f0" }]}>{wp.name || `Ponto ${idx + 1}`}</Text>
                        <Text style={styles.planBoxItem}>
                          {wp.latitude.toFixed(4)}, {wp.longitude.toFixed(4)}
                        </Text>
                      </View>
                      <View style={styles.inlineActions}>
                        <TouchableOpacity onPress={() => animateTo(wp.latitude, wp.longitude, 0.04)}>
                          <Ionicons name="navigate-outline" size={18} color="#22c55e" />
                        </TouchableOpacity>
                        {idx > 0 && (
                          <TouchableOpacity
                            onPress={() => {
                              const next = [...waypoints];
                              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                              setWaypoints(next);
                            }}
                          >
                            <Ionicons name="arrow-up" size={18} color="#e2e8f0" />
                          </TouchableOpacity>
                        )}
                        {idx < waypoints.length - 1 && (
                          <TouchableOpacity
                            onPress={() => {
                              const next = [...waypoints];
                              [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                              setWaypoints(next);
                            }}
                          >
                            <Ionicons name="arrow-down" size={18} color="#e2e8f0" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => setWaypoints((prev) => prev.filter((_, i) => i !== idx))}>
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.planBoxItem}>Adicione pontos tocando no mapa.</Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      

      <View style={[styles.fabCluster, { bottom: insets.bottom + 68 }]}>
        {showActionMenu && (
          <View style={styles.actionMenuList}>
            <TouchableOpacity
              style={[styles.quickButton, { backgroundColor: "#2563eb" }]}
              onPress={() => {
                setPlanningMode(true);
                setBottomTab("rotas");
                setShowActionMenu(false);
              }}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={[styles.quickText, { color: "#fff" }]}>Adicionar rota</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickButton, { backgroundColor: "#f97316" }]} onPress={handleQuickIncident}>
              <Ionicons name="alert-circle" size={18} color="#fff" />
              <Text style={[styles.quickText, { color: "#fff" }]}>Incidente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickButton, { backgroundColor: "#8b5cf6" }]} onPress={handleQuickSOS}>
              <Ionicons name="warning" size={18} color="#fff" />
              <Text style={[styles.quickText, { color: "#fff" }]}>SOS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickButton, { backgroundColor: "#0f172a" }]} onPress={() => setShowNotifications(true)}>
              <Ionicons name="notifications-outline" size={18} color="#fff" />
              <Text style={[styles.quickText, { color: "#fff" }]}>Notificacoes</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: showActionMenu ? "#0ea5e9" : "#0f172a" }]}
          onPress={() => setShowActionMenu((prev) => !prev)}
          accessibilityLabel="Abrir menu de acoes"
        >
          <Ionicons name={showActionMenu ? "close" : "add"} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal visible={showNotifications} transparent animationType="slide" onRequestClose={() => setShowNotifications(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alertas & SOS</Text>
              <TouchableOpacity style={styles.iconButton} onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 10 }}>
              <Text style={styles.sectionTitle}>Incidentes</Text>
              {incidentsList.length ? (
                incidentsList.slice(0, 15).map((inc) => (
                  <TouchableOpacity
                    key={`m-inc-${inc.id}`}
                    style={styles.modalCard}
                    onPress={() => {
                      animateTo(inc.latitude, inc.longitude, 0.04);
                      setShowNotifications(false);
                    }}
                  >
                    <Text style={styles.modalCardTitle}>{inc.title}</Text>
                    <Text style={styles.modalCardText}>{inc.description || "Sem descricao"}</Text>
                    <Text style={styles.modalCardTag}>{inc.severity || "info"}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.muted}>Sem incidentes.</Text>
              )}

              <Text style={styles.sectionTitle}>SOS</Text>
              {sosList.length ? (
                sosList.slice(0, 15).map((s) => (
                  <TouchableOpacity
                    key={`m-sos-${s.id}`}
                    style={styles.modalCard}
                    onPress={() => {
                      animateTo(s.latitude, s.longitude, 0.04);
                      setShowNotifications(false);
                    }}
                  >
                    <Text style={styles.modalCardTitle}>SOS #{s.id}</Text>
                    <Text style={styles.modalCardText}>{s.status || "open"}</Text>
                    <Text style={styles.modalCardText}>
                      {s.latitude.toFixed(3)}, {s.longitude.toFixed(3)}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.muted}>Nenhum SOS ativo.</Text>
              )}

              <Text style={styles.sectionTitle}>Pontos de apoio</Text>
              {supportPoints.length ? (
                supportPoints.slice(0, 15).map((sp) => (
                  <TouchableOpacity
                    key={`m-sup-${sp.id}`}
                    style={styles.modalCard}
                    onPress={() => {
                      animateTo(sp.latitude, sp.longitude, 0.04);
                      setShowNotifications(false);
                    }}
                  >
                    <Text style={styles.modalCardTitle}>{sp.name || sp.type || "Ponto de apoio"}</Text>
                    <Text style={styles.modalCardText}>{sp.description || "Suporte"}</Text>
                    <Text style={styles.modalCardTag}>{sp.type || "apoio"}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.muted}>Nenhum ponto listado.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showWaypointModal} transparent animationType="slide" onRequestClose={() => setShowWaypointModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Waypoints</Text>
              <TouchableOpacity style={styles.iconButton} onPress={() => setShowWaypointModal(false)}>
                <Ionicons name="close" size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>
            {waypoints.length === 0 && <Text style={styles.muted}>Nenhum ponto ainda.</Text>}
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 8 }}>
              {waypoints.map((wp, idx) => (
                <View key={`wp-edit-${idx}`} style={styles.waypointRow}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={styles.waypointInput}
                      value={wp.name || ""}
                      placeholder={`Ponto ${idx + 1}`}
                      placeholderTextColor="#94a3b8"
                      onChangeText={(text) => {
                        const next = [...waypoints];
                        next[idx] = { ...next[idx], name: text };
                        setWaypoints(next);
                      }}
                    />
                    <Text style={styles.modalCardText}>
                      {wp.latitude.toFixed(4)}, {wp.longitude.toFixed(4)}
                    </Text>
                  </View>
                  <View style={styles.waypointActions}>
                    <TouchableOpacity
                      onPress={() => {
                        if (idx === 0) return;
                        const next = [...waypoints];
                        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                        setWaypoints(next);
                      }}
                    >
                      <Ionicons name="arrow-up" size={18} color="#0f172a" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (idx === waypoints.length - 1) return;
                        const next = [...waypoints];
                        [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                        setWaypoints(next);
                      }}
                    >
                      <Ionicons name="arrow-down" size={18} color="#0f172a" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const next = waypoints.filter((_, i) => i !== idx);
                        setWaypoints(next);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRoutePreview}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoutePreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resumo da rota</Text>
              <TouchableOpacity style={styles.iconButton} onPress={() => setShowRoutePreview(false)}>
                <Ionicons name="close" size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {planningMetrics.distanceKm ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.modalCardText}>
                  Distancia: ~{planningMetrics.distanceKm.toFixed(1)} km
                </Text>
                <Text style={styles.modalCardText}>Pontos: {planningMetrics.points}</Text>
                <Text style={styles.modalCardText}>
                  Elevacao: {planningMetrics.estimatedElevationGain !== null ? `${planningMetrics.estimatedElevationGain} m` : "dados indisponiveis"}
                </Text>
                <Text style={styles.modalCardText}>Origem definida: {origin ? "sim" : "nao"}</Text>
                <Text style={styles.modalCardText}>Destino definido: {destination ? "sim" : "nao"}</Text>
              </View>
            ) : (
              <Text style={styles.muted}>Defina origem e destino para ver o resumo.</Text>
            )}

            <View style={[styles.planInfoRow, { marginTop: 12 }]}>
              <TouchableOpacity
                style={[styles.planChip, { backgroundColor: "#10b981", flex: 1 }]}
                disabled={!planningMetrics.distanceKm}
                onPress={() => {
                  setShowRoutePreview(false);
                  startNavigation();
                }}
              >
                <Text style={[styles.planChipText, { color: "#0b1220", textAlign: "center" }]}>Iniciar navegacao</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.planChip, { backgroundColor: "#ef4444", flex: 1 }]}
                onPress={() => setShowRoutePreview(false)}
              >
                <Text style={[styles.planChipText, { textAlign: "center" }]}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  appbar: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: "rgba(15,23,42,0.94)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  appbarTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  appbarActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(226,232,240,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: "transparent",
  },
  bottomTabs: {
    marginHorizontal: 4,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
  },
  tabButtonActive: { backgroundColor: "#e2e8f0", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabText: { color: "#475569", fontWeight: "700", fontSize: 12.5 },
  tabTextActive: { color: "#0f172a" },
  cardsRow: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(15,23,42,0.88)",
    borderRadius: 16,
  },
  card: {
    width: 190,
    marginRight: 8,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.35)",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardActive: { borderColor: "#2563eb", borderWidth: 2 },
  cardTitle: { fontWeight: "700", color: "#e2e8f0" },
  cardSubtitle: { color: "#cbd5e1", fontSize: 12 },
  muted: { color: "#cbd5e1", paddingVertical: 8 },
  routeActions: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  routeActionText: { color: "#2563eb", fontWeight: "700", fontSize: 12 },
  quickButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  quickText: { color: "#0f172a", fontWeight: "700", fontSize: 12 },
  fabCluster: {
    position: "absolute",
    right: 20,
    alignItems: "flex-end",
    gap: 10,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  actionMenuList: {
    gap: 8,
    alignItems: "flex-start",
    marginBottom: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  sectionTitle: { fontWeight: "700", color: "#0f172a", marginTop: 6 },
  modalCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 4,
  },
  modalCardTitle: { fontWeight: "700", color: "#0f172a" },
  modalCardText: { color: "#475569", fontSize: 12 },
  modalCardTag: { color: "#dc2626", fontWeight: "700", fontSize: 12 },
  planBar: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "rgba(15,23,42,0.95)",
    padding: 10,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  planText: { color: "#e2e8f0", fontWeight: "700" },
  planActions: { flexDirection: "row", gap: 8 },
  planButton: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  planButtonText: { color: "#0f172a", fontWeight: "700" },
  planBox: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.2)",
    gap: 4,
  },
  planBoxTitle: { color: "#e2e8f0", fontWeight: "700" },
  planBoxItem: { color: "#cbd5e1", fontSize: 12 },
  planInfoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  planChip: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  planChipText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  searchTop: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 20,
  },
  searchBox: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.5)",
    gap: 8,
  },
  searchInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#0f172a",
  },
  targetRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  targetChip: { backgroundColor: "#e2e8f0", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  targetChipActive: { backgroundColor: "#bfdbfe" },
  targetChipText: { color: "#0f172a", fontWeight: "700", fontSize: 12 },
  suggestions: { maxHeight: 44 },
  suggestionChip: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 100,
  },
  suggestionChipActive: { backgroundColor: "#93c5fd" },
  suggestionText: { color: "#0f172a", fontWeight: "700", fontSize: 12 },
  suggestionSub: { color: "#475569", fontSize: 11, marginTop: 2 },
  prefRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  prefChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  prefChipActive: { backgroundColor: "#bfdbfe" },
  prefText: { color: "#475569", fontWeight: "700", fontSize: 12 },
  prefTextActive: { color: "#0f172a" },
  waypointRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  waypointActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  waypointInput: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#0f172a",
    marginBottom: 4,
  },
  waypointRowInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(15,23,42,0.4)",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.2)",
    marginTop: 6,
  },
  inlineActions: { flexDirection: "row", alignItems: "center", gap: 10 },
});








