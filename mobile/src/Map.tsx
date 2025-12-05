import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "./api/client";
import { useMapData } from "./modules/map/useMapData";
import { useMapFilters } from "./modules/map/useMapFilters";
import { RouteSelectionProvider } from "./RouteSelectionContext";
import { RouteInstructionsModal } from "./components/RouteInstructionsModal";
import { MarkerDetailsSheet } from "./components/MarkerDetailsSheet";
import { useSavedRoutes } from "./modules/routes/useSavedRoutes";
import { useRoutePlanning } from "./modules/planner/useRoutePlanning";
import { useNavigation } from "./modules/navigation/useNavigation";
import { IncidentModal } from "./components/IncidentModal";
import { SOSModal } from "./components/SOSModal";
import { SavedRoutesModal } from "./components/SavedRoutesModal";
import { AddressSearch } from "./components/AddressSearch";
import { useMarkerDetails } from "./modules/markers/useMarkerDetails";
import { ActiveRouteIndicator } from "./components/ActiveRouteIndicator";
import { WaypointManager } from "./components/WaypointManager";
import { RoutePreferencesModal, RoutePreferences } from "./components/RoutePreferencesModal";
import { useRouteManager } from "./modules/routes/useRouteManager";
import { AlternativeRoutesCard } from "./components/AlternativeRoutesCard";
import { RouteStats } from "./components/RouteStats";
import { routingService, AlternativeRoute } from "./services/routing";

type Props = { onLogout: () => void };

const INCIDENT_TYPES = ["buraco", "roubo", "infraestrutura", "transito"];
const SOS_TYPES = ["pneu", "saude", "acidente", "outro"];

export default function MapScreen({ onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  // Hooks - with comprehensive default values to prevent crashes
  const mapData = useMapData();
  const incidentsList = mapData?.incidentsList ?? [];
  const supportPoints = mapData?.supportPoints ?? [];
  const sosList = mapData?.sosList ?? [];
  const routes = mapData?.routes ?? [];
  const refreshData = mapData?.refreshData ?? (() => { });

  const savedRoutesData = useSavedRoutes();
  const savedRoutes = savedRoutesData?.savedRoutes ?? [];
  const toggleSave = savedRoutesData?.toggleSave ?? (async () => { });

  const { showIncidents, showSOS, showSupport, toggleIncidents, toggleSOS, toggleSupport } = useMapFilters();
  const planning = useRoutePlanning();
  const navigation = useNavigation();

  // Ensure arrays are always defined (double protection)
  const safeIncidentsList = Array.isArray(incidentsList) ? incidentsList : [];
  const safeSosList = Array.isArray(sosList) ? sosList : [];
  const safeSupportPoints = Array.isArray(supportPoints) ? supportPoints : [];

  // UI States
  const [showMenu, setShowMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showSavedRoutesModal, setShowSavedRoutesModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [isNavMinimized, setIsNavMinimized] = useState(false);
  const [showWaypointManager, setShowWaypointManager] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [routePreferences, setRoutePreferences] = useState<RoutePreferences>({
    routeType: "cycleway",
    avoidSteepHills: true,
    avoidIncidents: true,
    avoidHighTraffic: false,
    priority: "safest",
  });
  const [alternativeRoutes, setAlternativeRoutes] = useState<AlternativeRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isCalculatingAlternatives, setIsCalculatingAlternatives] = useState(false);

  const initialRegion = useMemo(
    () => ({ latitude: -23.5505, longitude: -46.6333, latitudeDelta: 0.05, longitudeDelta: 0.05 }),
    []
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setHasLocation(true);
        mapRef.current?.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }
    })();
  }, []);

  const recenterMap = () => {
    if (navigation.isNavigating && navigation.userLocation) {
      mapRef.current?.animateToRegion({
        latitude: navigation.userLocation.latitude,
        longitude: navigation.userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    } else if (coords) {
      mapRef.current?.animateToRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  };

  // Follow user during navigation
  useEffect(() => {
    if (navigation.isNavigating && navigation.userLocation && isFollowing) {
      mapRef.current?.animateCamera({
        center: navigation.userLocation,
        zoom: 17,
        heading: navigation.getBearing() || 0,
      }, { duration: 500 });
    }
  }, [navigation.userLocation, navigation.isNavigating, isFollowing]);

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    planning.handleMapPress(latitude, longitude);
  };

  const handleCreateIncident = async (title: string, description: string, type: string) => {
    if (!coords) {
      Alert.alert("Erro", "Localização não disponível");
      return;
    }

    try {
      await api.createIncident({
        title,
        description,
        latitude: coords.lat,
        longitude: coords.lng,
        severity: "warning",
        type,
      });
      Alert.alert("Sucesso", "Incidente reportado!");
      refreshData();
    } catch (err) {
      Alert.alert("Erro", "Falha ao criar incidente");
    }
  };

  const handleCreateSOS = async (message: string, type: string) => {
    if (!coords) {
      Alert.alert("Erro", "Localização não disponível");
      return;
    }

    try {
      await api.createSOS({
        latitude: coords.lat,
        longitude: coords.lng,
        message: message || "SOS via App",
        status: "open",
        type,
      });
      Alert.alert("SOS Enviado", "Ajuda solicitada!");
      refreshData();
    } catch (err) {
      Alert.alert("Erro", "Falha ao enviar SOS");
    }
  };

  const handleLoadRoute = async (routeId: number) => {
    const route = await planning.loadRoute(routeId, routes, savedRoutes as any[]);
    if (route) {
      mapRef.current?.animateToRegion({
        latitude: route.start_lat,
        longitude: route.start_lng,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }
  };

  // Initialize marker details hook
  const markerDetails = useMarkerDetails({
    onAddToRoute: (lat, lng, name) => {
      const newPoint = { latitude: lat, longitude: lng, name };
      planning.addWaypoint(newPoint);
    },
    onNavigate: async (lat, lng) => {
      // Clear any existing route first
      planning.clearAllRouteData();

      // Set current location as origin (if available)
      if (coords) {
        planning.setOrigin({
          latitude: coords.lat,
          longitude: coords.lng,
          name: "Minha Localização"
        });
      }

      // Set marker as destination
      planning.setDestination({
        latitude: lat,
        longitude: lng,
        name: "Destino"
      });

      // Start planning mode
      planning.startPlanning(coords ? { lat: coords.lat, lng: coords.lng } : undefined);

      // Calculate route
      await planning.calculateRoute();

      // Center map on destination
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);

      Alert.alert(
        "Rota Criada",
        "Rota até o ponto criada! Toque 'Iniciar' para navegar.",
        [{ text: "OK" }]
      );
    },
    onAttendSOS: async (sosId) => {
      // TODO: Implement SOS attendance endpoint
      console.log('Attending SOS:', sosId);
    },
  });

  // Initialize route manager
  const routeManager = useRouteManager();

  // Calculate alternative routes when main route is ready
  useEffect(() => {
    async function calculateAlternatives() {
      if (!planning.calculatedRoute || !planning.origin || !planning.destination) {
        setAlternativeRoutes([]);
        return;
      }

      setIsCalculatingAlternatives(true);
      try {
        const coords = [
          planning.origin,
          ...planning.waypoints,
          planning.destination
        ];

        const routes = await routingService.calculateAlternativeRoutes(
          coords,
          routePreferences,
          3
        );

        setAlternativeRoutes(routes);
        setSelectedRouteIndex(0);
      } catch (error) {
        console.error('Error calculating alternatives:', error);
        setAlternativeRoutes([]);
      } finally {
        setIsCalculatingAlternatives(false);
      }
    }

    calculateAlternatives();
  }, [planning.calculatedRoute?.distance, routePreferences]);


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={hasLocation}
        showsMyLocationButton={false}
        onPress={handleMapPress}
        mapPadding={{ top: insets.top + 60, bottom: 20, left: 0, right: 0 }}
      >
        {/* Incidents */}
        {showIncidents &&
          safeIncidentsList.map((inc) => (
            <Marker
              key={`inc-${inc.id}`}
              coordinate={{ latitude: inc.latitude, longitude: inc.longitude }}
              pinColor="orange"
              onPress={() => markerDetails.handleIncidentPress(inc)}
            />
          ))}

        {/* SOS */}
        {showSOS &&
          safeSosList.map((s) => (
            <Marker
              key={`sos-${s.id}`}
              coordinate={{ latitude: s.latitude, longitude: s.longitude }}
              pinColor="red"
              onPress={() => markerDetails.handleSOSPress(s)}
            />
          ))}

        {/* Support Points */}
        {showSupport &&
          safeSupportPoints.map((sp) => (
            <Marker
              key={`sp-${sp.id}`}
              coordinate={{ latitude: sp.latitude, longitude: sp.longitude }}
              pinColor="green"
              onPress={() => markerDetails.handleSupportPointPress(sp)}
            />
          ))}

        {/* Origin/Destination Markers */}
        {planning.origin && <Marker coordinate={planning.origin} title={planning.origin.name} pinColor="green" />}
        {planning.destination && <Marker coordinate={planning.destination} title={planning.destination.name} pinColor="red" />}
        {planning.waypoints.map((wp, idx) => (
          <Marker key={`wp-${idx}`} coordinate={wp} title={wp.name} pinColor="orange" />
        ))}

        {/* Animated User Marker During Navigation */}
        {navigation.isNavigating && navigation.userLocation && (
          <Marker
            coordinate={navigation.userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={navigation.getBearing() || 0}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#3b82f6',
              borderWidth: 4,
              borderColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}>
              <Ionicons name="navigate" size={20} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Route Polyline (Planning) */}
        {planning.allPoints.length >= 2 && <Polyline coordinates={planning.allPoints} strokeColor="#2563eb" strokeWidth={4} />}

        {/* Navigation Polyline (Active) */}
        {navigation.isNavigating && navigation.routeData && navigation.routeData.coordinates && (
          <Polyline
            coordinates={navigation.routeData.coordinates}
            strokeColor="#10b981"
            strokeWidth={5}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={[styles.header, { top: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>BikeSegura</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={recenterMap}>
            <Ionicons name="locate" size={20} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={refreshData}>
            <Ionicons name="refresh" size={20} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowFilterMenu(!showFilterMenu)}>
            <Ionicons name="filter" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Menu */}
      {showFilterMenu && (
        <View style={[styles.filterMenu, { top: insets.top + 60 }]}>
          <TouchableOpacity style={styles.filterItem} onPress={toggleIncidents}>
            <Ionicons name={showIncidents ? "checkmark-circle" : "ellipse-outline"} size={20} color="#f97316" />
            <Text style={styles.filterText}>Incidentes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterItem} onPress={toggleSOS}>
            <Ionicons name={showSOS ? "checkmark-circle" : "ellipse-outline"} size={20} color="#ef4444" />
            <Text style={styles.filterText}>SOS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterItem} onPress={toggleSupport}>
            <Ionicons name={showSupport ? "checkmark-circle" : "ellipse-outline"} size={20} color="#10b981" />
            <Text style={styles.filterText}>Pontos de Apoio</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Planning UI */}
      {planning.isPlanning && (
        <View style={[styles.planningCard, { bottom: insets.bottom + 80 }]}>
          <Text style={styles.planningTitle}>Planejando Rota</Text>
          <Text style={styles.planningStep}>
            {planning.planningStep === "origin" && "📍 Defina a Origem"}
            {planning.planningStep === "destination" && "🎯 Defina o Destino"}
            {planning.planningStep === "waypoint" && "➕ Adicione Paradas (opcional)"}
            {planning.planningStep === "confirm" && "✅ Rota Pronta!"}
          </Text>

          {/* Address Search for Origin */}
          {planning.planningStep === "origin" && !planning.origin && (
            <AddressSearch
              placeholder="Buscar origem..."
              userLocation={coords ? { latitude: coords.lat, longitude: coords.lng } : null}
              onSelect={(result) => {
                planning.setOrigin({ latitude: result.latitude, longitude: result.longitude, name: result.name });
                planning.handleMapPress(result.latitude, result.longitude);
              }}
            />
          )}

          {/* Address Search for Destination */}
          {planning.planningStep === "destination" && !planning.destination && (
            <AddressSearch
              placeholder="Buscar destino..."
              userLocation={coords ? { latitude: coords.lat, longitude: coords.lng } : null}
              onSelect={(result) => {
                planning.setDestination({ latitude: result.latitude, longitude: result.longitude, name: result.name });
                planning.handleMapPress(result.latitude, result.longitude);
              }}
            />
          )}

          {planning.origin && <Text style={styles.planningInfo}>Origem: {planning.origin.name || "Definida"}</Text>}
          {planning.destination && <Text style={styles.planningInfo}>Destino: {planning.destination.name || "Definido"}</Text>}
          {planning.waypoints.length > 0 && <Text style={styles.planningInfo}>Paradas: {planning.waypoints.length}</Text>}

          {/* Route Management Buttons */}
          {planning.isPlanning && (planning.origin || planning.destination) && (
            <View style={styles.routeActions}>
              <TouchableOpacity
                style={styles.routeActionBtn}
                onPress={() => setShowWaypointManager(true)}
              >
                <Ionicons name="list" size={18} color="#2563eb" />
                <Text style={styles.routeActionText}>Gerenciar Paradas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.routeActionBtn}
                onPress={() => setShowPreferencesModal(true)}
              >
                <Ionicons name="settings" size={18} color="#2563eb" />
                <Text style={styles.routeActionText}>Preferências</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Clear/New Route Button */}
          {(planning.calculatedRoute || planning.origin || planning.destination) && (
            <TouchableOpacity
              style={styles.clearRouteBtn}
              onPress={() => {
                planning.clearAllRouteData();
                Alert.alert("Limpo", "Rota limpa. Você pode planejar uma nova rota.");
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={styles.clearRouteBtnText}>Nova Rota (Limpar)</Text>
            </TouchableOpacity>
          )}

          {/* Show calculated route info */}
          {planning.calculatedRoute && (
            <>
              <View style={styles.routeInfo}>
                <Text style={styles.routeInfoTitle}>📍 Rota Calculada</Text>
                <Text style={styles.routeInfoText}>
                  Distância: {planning.calculatedRoute.distance > 1000
                    ? `${(planning.calculatedRoute.distance / 1000).toFixed(1)} km`
                    : `${Math.round(planning.calculatedRoute.distance)} m`}
                </Text>
                <Text style={styles.routeInfoText}>
                  Tempo: {Math.round(planning.calculatedRoute.duration / 60)} min
                </Text>
              </View>

              {/* Route Statistics */}
              <RouteStats
                route={planning.calculatedRoute}
                incidentsNearby={0}
                supportPointsCount={0}
              />

              {/* Alternative Routes - Compact */}
              {alternativeRoutes.length > 0 && (
                <View style={styles.alternativesSection}>
                  <AlternativeRoutesCard
                    routes={alternativeRoutes}
                    selectedIndex={selectedRouteIndex}
                    onSelectRoute={(index) => {
                      setSelectedRouteIndex(index);
                      if (alternativeRoutes[index]) {
                        planning.setCalculatedRoute(alternativeRoutes[index]);
                      }
                    }}
                  />
                </View>
              )}
            </>
          )}

          <View style={styles.planningActions}>
            <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={planning.cancelPlanning}>
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>
            {planning.origin && planning.destination && (
              <>
                {!planning.calculatedRoute && !planning.isCalculating && (
                  <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={planning.calculateRoute}
                  >
                    <Text style={[styles.btnText, { color: "#fff" }]}>Calcular Rota</Text>
                  </TouchableOpacity>
                )}
                {planning.isCalculating && (
                  <View style={[styles.btn, styles.btnPrimary]}>
                    <Text style={[styles.btnText, { color: "#fff" }]}>Calculando...</Text>
                  </View>
                )}
                {planning.calculatedRoute && (
                  <>
                    <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={() => planning.saveRoute(toggleSave)}>
                      <Text style={[styles.btnText, { color: "#fff" }]}>Salvar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnConfirm]}
                      onPress={() => {
                        if (planning.calculatedRoute) {
                          navigation.startNavigation(planning.calculatedRoute);
                          planning.cancelPlanning();
                        }
                      }}
                    >
                      <Text style={[styles.btnText, { color: "#fff" }]}>Iniciar</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      )}

      {/* Navigation HUD - Minimizable */}
      {navigation.isNavigating && (
        <View style={[styles.navigationHUD, { top: insets.top + 70 }, isNavMinimized && styles.navigationHUDMinimized]}>
          {/* Compact View (Minimized) */}
          {isNavMinimized ? (
            <TouchableOpacity
              style={styles.navCompact}
              onPress={() => setIsNavMinimized(false)}
              activeOpacity={0.9}
            >
              <Ionicons name="navigate" size={24} color="#2563eb" />
              <View style={styles.navCompactInfo}>
                <Text style={styles.navCompactInstruction} numberOfLines={1}>
                  {navigation.getNextInstruction()}
                </Text>
                <View style={styles.navCompactMeta}>
                  <View style={styles.compactProgressBar}>
                    <View style={[styles.compactProgressFill, { width: `${navigation.getRouteProgress()}%` }]} />
                  </View>
                  <Text style={styles.navCompactDistance}>{navigation.getRemainingDistance()}</Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
          ) : (
            /* Expanded View */
            <>
              <View style={styles.navExpandedHeader}>
                <TouchableOpacity
                  style={styles.navInstructionsBtn}
                  onPress={() => setShowInstructionsModal(true)}
                >
                  <Ionicons name="list" size={18} color="#2563eb" />
                  <Text style={styles.navInstructionsBtnText}>Instruções</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navMinimizeBtn}
                  onPress={() => setIsNavMinimized(true)}
                >
                  <Ionicons name="chevron-up" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.navHeader}>
                <View style={styles.navIconContainer}>
                  <Ionicons name="navigate" size={32} color="#2563eb" />
                </View>
                <View style={styles.navInfo}>
                  <Text style={styles.navInstruction}>{navigation.getNextInstruction()}</Text>
                  <View style={styles.navMeta}>
                    <Text style={styles.navProgress}>
                      {navigation.getRemainingDistance()} • {navigation.getETA()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                  onPress={() => {
                    setIsFollowing(!isFollowing);
                    if (!isFollowing && navigation.userLocation) {
                      mapRef.current?.animateToRegion({
                        latitude: navigation.userLocation.latitude,
                        longitude: navigation.userLocation.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      }, 500);
                    }
                  }}
                >
                  <Ionicons
                    name={isFollowing ? "locate" : "locate-outline"}
                    size={24}
                    color={isFollowing ? "#fff" : "#2563eb"}
                  />
                </TouchableOpacity>
              </View>

              {/* Route Progress Bar - Real Progress */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${navigation.getRouteProgress()}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(navigation.getRouteProgress())}% do percurso completo
                </Text>
              </View>

              <TouchableOpacity
                style={styles.navStopBtn}
                onPress={() => {
                  Alert.alert(
                    "Parar Navegação",
                    "Deseja realmente parar a navegação?",
                    [
                      { text: "Não", style: "cancel" },
                      { text: "Sim", onPress: () => navigation.stopNavigation() }
                    ]
                  );
                }}
              >
                <Ionicons name="stop-circle" size={24} color="#ef4444" />
                <Text style={styles.navStopText}>Parar Navegação</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* FAB Menu */}
      {!planning.isPlanning && (
        <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
          {showMenu && (
            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuBtn} onPress={() => { setShowIncidentModal(true); setShowMenu(false); }}>
                <Ionicons name="alert-circle" size={20} color="#fff" />
                <Text style={styles.menuText}>Reportar Incidente</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuBtn} onPress={() => { setShowSOSModal(true); setShowMenu(false); }}>
                <Ionicons name="warning" size={20} color="#fff" />
                <Text style={styles.menuText}>SOS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuBtn} onPress={() => { planning.startPlanning(coords || undefined); setShowMenu(false); }}>
                <Ionicons name="map" size={20} color="#fff" />
                <Text style={styles.menuText}>Planejar Rota</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuBtn} onPress={() => { setShowSavedRoutesModal(true); setShowMenu(false); }}>
                <Ionicons name="bookmark" size={20} color="#fff" />
                <Text style={styles.menuText}>Rotas Salvas</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={[styles.fab, { backgroundColor: "#2563eb" }]} onPress={() => setShowMenu(!showMenu)}>
            <Ionicons name={showMenu ? "close" : "add"} size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
      <IncidentModal
        visible={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        onSubmit={handleCreateIncident}
        types={INCIDENT_TYPES}
      />

      <SOSModal
        visible={showSOSModal}
        onClose={() => setShowSOSModal(false)}
        onSubmit={handleCreateSOS}
        types={SOS_TYPES}
      />

      <SavedRoutesModal
        visible={showSavedRoutesModal}
        onClose={() => setShowSavedRoutesModal(false)}
        routes={savedRoutes as any[]}
        onSelect={handleLoadRoute}
      />

      {/* Route Instructions Modal */}
      {navigation.routeData?.steps && (
        <RouteInstructionsModal
          visible={showInstructionsModal}
          onClose={() => setShowInstructionsModal(false)}
          steps={navigation.routeData.steps}
          currentStepIndex={navigation.currentStepIndex}
        />
      )}

      {/* Marker Details Sheet */}
      <MarkerDetailsSheet
        visible={markerDetails.selectedMarker !== null}
        onClose={markerDetails.closeMarkerDetails}
        markerType={markerDetails.selectedMarker?.type || "incident"}
        data={markerDetails.selectedMarker?.data || null}
        onAddToRoute={markerDetails.handleAddToRoute}
        onNavigate={markerDetails.handleNavigate}
        onAttendSOS={markerDetails.handleAttendSOS}
      />

      {/* Waypoint Manager Modal */}
      {showWaypointManager && (
        <Modal visible={showWaypointManager} animationType="slide" transparent onRequestClose={() => setShowWaypointManager(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <WaypointManager
              origin={planning.origin ? { ...planning.origin, name: planning.origin.name || "Origem" } : null}
              destination={planning.destination ? { ...planning.destination, name: planning.destination.name || "Destino" } : null}
              waypoints={planning.waypoints.map(wp => ({ ...wp, name: wp.name || "Parada" }))}
              onRemoveWaypoint={(index) => {
                planning.removeWaypoint(index);
              }}
              onReorderWaypoint={(from, to) => {
                // TODO: Implement reorder in planning hook
                console.log('Reorder', from, to);
              }}
              onReverseRoute={() => {
                // Swap origin and destination
                const temp = planning.origin;
                if (planning.destination && temp) {
                  planning.setOrigin(planning.destination);
                  planning.setDestination(temp);
                }
              }}
              onAddWaypoint={() => {
                setShowWaypointManager(false);
                // User can tap map to add
              }}
              onEditName={(index, type) => {
                // TODO: Implement edit name functionality
                console.log('Edit name', index, type);
              }}
            />
            <TouchableOpacity
              style={{
                backgroundColor: '#fff',
                padding: 16,
                borderRadius: 12,
                marginTop: 12,
                alignItems: 'center',
              }}
              onPress={() => setShowWaypointManager(false)}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#64748b' }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* Route Preferences Modal */}
      <RoutePreferencesModal
        visible={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        preferences={routePreferences}
        onSave={(prefs) => {
          setRoutePreferences(prefs);
          // Recalculate route with new preferences
          planning.calculateRoute();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  header: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: "#f1f5f9" },
  filterMenu: {
    position: "absolute",
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    elevation: 5,
  },
  filterItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterText: { fontWeight: "600", color: "#0f172a" },
  fabContainer: { position: "absolute", right: 16, alignItems: "flex-end" },
  fab: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.3, elevation: 6 },
  menuItems: { marginBottom: 16, gap: 12, alignItems: "flex-end" },
  menuBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#334155", padding: 12, borderRadius: 8, gap: 8, shadowColor: "#000", shadowOpacity: 0.2, elevation: 4 },
  menuText: { color: "#fff", fontWeight: "600" },
  planningCard: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    elevation: 5,
  },
  planningTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  planningStep: { fontSize: 14, color: "#64748b", marginBottom: 8 },
  planningInfo: { fontSize: 12, color: "#475569", marginBottom: 4 },
  routeActions: { flexDirection: "row", gap: 12, marginTop: 12 },
  routeActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  routeActionText: { fontSize: 14, fontWeight: "600" },
  clearRouteBtn: { backgroundColor: "#fee2e2", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  clearRouteBtnText: { fontSize: 14, fontWeight: "600", color: "#dc2626" },
  routeInfo: { backgroundColor: "#eff6ff", padding: 12, borderRadius: 12, marginTop: 8 },
  routeInfoTitle: { fontSize: 14, fontWeight: "700", color: "#1e40af" },
  routeInfoText: { fontSize: 13, color: "#1e40af", marginTop: 4 },
  alternativesSection: { marginTop: -8, marginBottom: 8 },
  planningActions: { flexDirection: "row", gap: 12, marginTop: 12 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  btnCancel: { backgroundColor: "#e2e8f0" },
  btnConfirm: { backgroundColor: "#2563eb" },
  btnPrimary: { backgroundColor: "#2563eb" },
  btnText: { fontWeight: "700", color: "#334155" },
  navigationHUD: {
    position: "absolute",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    elevation: 8,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  navIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  navInfo: {
    flex: 1,
  },
  navInstruction: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  navProgress: {
    fontSize: 13,
    color: "#64748b",
  },
  navStopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  navStopText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
  },
  routeInfo: {
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  routeInfoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 4,
  },
  routeInfoText: {
    fontSize: 12,
    color: "#475569",
  },
  btnPrimary: {
    backgroundColor: "#10b981",
  },
  navMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  navInstructionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  navInstructionsBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },
  followBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  followBtnActive: {
    backgroundColor: "#2563eb",
  },
  progressContainer: {
    marginTop: 12,
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
  },
  // Minimizable HUD styles
  navigationHUDMinimized: {
    padding: 12,
  },
  navCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navCompactInfo: {
    flex: 1,
  },
  navCompactInstruction: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  navCompactMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  compactProgressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 2,
  },
  navCompactDistance: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  navExpandedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  navMinimizeBtn: {
    padding: 4,
  },
  routeActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  routeActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  routeActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },
  clearRouteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginTop: 12,
  },
  clearRouteBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },
});
