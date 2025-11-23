
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Construction, MapPin, Navigation, Filter, X, Play, AlertCircle, List } from "lucide-react";

import SOSButton from "../components/map/SOSButton";
import IncidentMarkers from "../components/map/IncidentMarkers";
import SOSAlertMarkers from "../components/map/SOSAlertMarkers";
import AddIncidentModal from "../components/map/AddIncidentModal";
import RoutePlanner from "../components/map/RoutePlanner";
import ActiveSOSPanel from "../components/map/ActiveSOSPanel";
import MapFilters from "../components/map/MapFilters";
import PreferredRoutes from "../components/map/PreferredRoutes";
import SupportLocations from "../components/map/SupportLocations";
import AddPreferredRoute from "../components/map/AddPreferredRoute";
import AddSupportLocation from "../components/map/AddSupportLocation";
import MultiRouteNavigation from "../components/map/MultiRouteNavigation"; // Changed from RouteNavigation
import IncidentFeed from "../components/map/IncidentFeed";
import QuickIncidentReport from "../components/map/QuickIncidentReport";
import SupportLocationNavigator from "../components/map/SupportLocationNavigator";
import MapPointSelector from "../components/map/MapPointSelector";
import VoiceNavigation from "../components/map/VoiceNavigation";
import IncidentFeedbackModal from "../components/feedback/IncidentFeedbackModal";
import MiniMap from "../components/map/MiniMap";
import SOSResolutionModal from "../components/map/SOSResolutionModal";
import LiveParticipantTracker from "../components/events/LiveParticipantTracker";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const isValidCoordinate = (coord) => {
  return coord !== null && coord !== undefined && !isNaN(coord) && isFinite(coord);
};

const isValidPosition = (position) => {
  if (!position || !Array.isArray(position) || position.length !== 2) return false;
  return isValidCoordinate(position[0]) && isValidCoordinate(position[1]);
};

const isValidLatLng = (lat, lng) => {
  return isValidCoordinate(lat) && isValidCoordinate(lng);
};

const createNavigationIcon = (avatar) => {
  const avatarEmoji = avatar || '🚴';
  return L.divIcon({
    html: `
      <div style="width: 54px; height: 54px; display: flex; align-items: center; justify-content: center;">
        <svg width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.6"/>
            </filter>
          </defs>
          <g filter="url(#shadow)">
            <circle cx="27" cy="27" r="22" fill="#10b981" opacity="0.2">
              <animate attributeName="r" values="22;26;22" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="27" cy="27" r="18" fill="#10b981"/>
            <circle cx="27" cy="27" r="16" fill="white" opacity="0.9"/>
          </g>
        </svg>
        <div style="position: absolute; font-size: 24px; top: 50%; left: 50%; transform: translate(-50%, -50%);">
          ${avatarEmoji}
        </div>
      </div>
    `,
    className: 'navigation-marker',
    iconSize: [54, 54],
    iconAnchor: [27, 27],
  });
};

const createTempMarkerIcon = (color = "#3b82f6") => {
  return L.divIcon({
    html: `
      <div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="28" fill="${color}" opacity="0.2">
            <animate attributeName="r" from="28" to="35" dur="1s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.2" to="0" dur="1s" repeatCount="indefinite"/>
          </circle>
          <circle cx="30" cy="30" r="20" fill="${color}" opacity="0.4"/>
          <circle cx="30" cy="30" r="12" fill="${color}" opacity="0.7"/>
          <circle cx="30" cy="30" r="6" fill="${color}"/>
        </svg>
      </div>
    `,
    className: 'temp-marker-pulsing',
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  });
};

function NavigationMarker({ position, avatar }) {
  if (!isValidPosition(position)) return null;
  return <Marker position={position} icon={createNavigationIcon(avatar)} />;
}

function TempMarker({ position, mode }) {
  if (!isValidPosition(position)) return null;
  const colors = {
    origin: "#10b981",
    destination: "#3b82f6",
    incident: "#ef4444",
    waypoint: "#8b5cf6"
  };
  return <Marker position={position} icon={createTempMarkerIcon(colors[mode] || colors.destination)} />;
}

function MapCenterController({ center, zoom, enabled }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && enabled && isValidPosition(center)) {
      map.setView(center, zoom || map.getZoom(), { animate: true, duration: 0.5 });
    }
  }, [center, zoom, map, enabled]);
  
  return null;
}

function MapClickHandler({ onMapClick, isActive }) {
  useMapEvents({
    click(e) {
      if (isActive && isValidLatLng(e.latlng.lat, e.latlng.lng)) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MapaPage() {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showRoutePlanner, setShowRoutePlanner] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [navigationRoutes, setNavigationRoutes] = useState([]); // Changed from calculatedRoute, secondaryRoute
  const [showNavigation, setShowNavigation] = useState(false);
  const [mapPointMode, setMapPointMode] = useState(null);
  const [showIncidentFeed, setShowIncidentFeed] = useState(false);
  const [showQuickReport, setShowQuickReport] = useState(false);
  const [selectedSupportLocation, setSelectedSupportLocation] = useState(null);
  const [notifiedIncidents, setNotifiedIncidents] = useState(new Set());
  const [selectedMapCoords, setSelectedMapCoords] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [validatingIncident, setValidatingIncident] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [miniMapExpanded, setMiniMapExpanded] = useState(false);
  const [resolvingSOS, setResolvingSOS] = useState(null);
  const [mapCenterOverride, setMapCenterOverride] = useState(null);
  const mapClickCallbackRef = useRef(null);
  const [filters, setFilters] = useState({
    incidents: true,
    sos: true,
    preferredRoutes: true,
    supportLocations: true,
  });

  useEffect(() => {
    const savedRoutes = sessionStorage.getItem('navigationRoutes'); // Changed key
    if (savedRoutes) {
      try {
        const routesData = JSON.parse(savedRoutes);
        console.log("📦 Rotas carregadas:", routesData);
        setNavigationRoutes(routesData); // Changed state setter
        sessionStorage.removeItem('navigationRoutes'); // Changed key
        setTimeout(() => {
          setShowNavigation(true);
        }, 500);
      } catch (e) {
        console.error("Erro ao carregar rotas:", e);
      }
    }

    const focusSOS = sessionStorage.getItem('focusSOS');
    if (focusSOS) {
      try {
        const sosData = JSON.parse(focusSOS);
        if (isValidLatLng(sosData.lat, sosData.lng)) {
          setTimeout(() => {
            setUserLocation([sosData.lat, sosData.lng]);
          }, 500);
        }
        sessionStorage.removeItem('focusSOS');
      } catch (e) {
        console.error("Error loading focus SOS:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isValidLatLng(position.coords.latitude, position.coords.longitude)) {
            const location = [position.coords.latitude, position.coords.longitude];
            setUserLocation(location);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setUserLocation([-23.5505, -46.6333]);
        }
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (isValidLatLng(position.coords.latitude, position.coords.longitude)) {
            const location = [position.coords.latitude, position.coords.longitude];
            setUserLocation(location);
            
            if (showNavigation && navigationRoutes.length > 0) { // Updated condition
              checkNearbyIncidents(location);
            }
          }
        },
        (error) => {
          console.error("GPS watch error:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setUserLocation([-23.5505, -46.6333]);
    }
  }, [showNavigation, navigationRoutes]);

  const handleCenterMap = (position) => {
    if (isValidPosition(position)) {
      setMapCenterOverride(position);
      setTimeout(() => setMapCenterOverride(null), 100);
    }
  };

  const checkNearbyIncidents = async (location) => {
    if (!isValidPosition(location)) return;

    try {
      const incidents = await base44.entities.Incident.filter({ status: 'ativo' });
      const ALERT_RADIUS_KM = 0.5;
      const user = await base44.auth.me();

      if (!incidents || !Array.isArray(incidents)) return;

      incidents.forEach(async (incident) => {
        if (!incident || !incident.id || !isValidLatLng(incident.latitude, incident.longitude)) return;

        if (notifiedIncidents && typeof notifiedIncidents.has === 'function' && notifiedIncifiedIncidents.has(incident.id)) {
          return;
        }

        const distance = calculateDistance(
          location[0], location[1],
          incident.latitude, incident.longitude
        );

        if (distance <= ALERT_RADIUS_KM) {
          setNotifiedIncidents(prev => {
            const currentSet = prev instanceof Set ? prev : new Set();
            return new Set([...currentSet, incident.id]);
          });

          await base44.entities.Notification.create({
            user_email: user.email,
            type: 'route_incident',
            title: '⚠️ Incidente Próximo!',
            message: `${incident.type} a ${(distance * 1000).toFixed(0)}m de você`,
            priority: incident.severity === 'alta' ? 'critica' : 'alta'
          });
        }
      });
    } catch (error) {
      console.error("Error checking incidents:", error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.filter({ status: 'ativo' }, '-created_date'),
    refetchInterval: 30000,
  });

  const { data: sosAlerts = [] } = useQuery({
    queryKey: ['sos-alerts'],
    queryFn: () => base44.entities.SOSAlert.filter({ status: ['ativo', 'ajuda_a_caminho'] }, '-created_date'),
    refetchInterval: 5000,
  });

  const { data: preferredRoutes = [] } = useQuery({
    queryKey: ['preferred-routes'],
    queryFn: () => base44.entities.PreferredRoute.filter({ is_validated: true }, '-votes'),
  });

  const { data: supportLocations = [] } = useQuery({
    queryKey: ['support-locations'],
    queryFn: () => base44.entities.SupportLocation.filter({ status: 'validado' }),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: activeEvents = [] } = useQuery({
    queryKey: ['active-events'],
    queryFn: () => base44.entities.RouteEvent.filter({ 
      status: ['em_andamento', 'agendado'] 
    }),
    refetchInterval: 10000,
  });

  if (!userLocation || !isValidPosition(userLocation)) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold text-sm sm:text-base">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  const handleRouteCalculated = (routeData) => {
    if (!routeData || !routeData.coordinates) {
      alert("Erro: Dados da rota inválidos");
      return;
    }
    
    console.log("✅ Rota calculada:", routeData);
    
    setNavigationRoutes([routeData]); // Set as the primary route in an array
    setShowRoutePlanner(false);
    setMapPointMode(null);
    mapClickCallbackRef.current = null;
    setSelectedMapCoords(null);
    setDestinationLocation(null);
    
    setTimeout(() => {
      setShowNavigation(true);
    }, 100);
  };

  const handleRouteRecalculated = (newRoute) => { // Removed isSecondary
    console.log("🔄 Rota recalculada:", newRoute);
    
    if (!newRoute || !newRoute.coordinates || newRoute.coordinates.length === 0) {
      console.error("❌ Rota recalculada inválida");
      return;
    }
    
    setNavigationRoutes(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[0] = { ...updated[0], ...newRoute }; // Update the first (primary) route
      } else {
        updated.push(newRoute); // As a fallback, add if somehow no route exists
      }
      return updated;
    });
    
    console.log("✅ Estado da rota atualizado com sucesso");
  };

  const handleCloseNavigation = () => {
    setShowNavigation(false);
    setNavigationRoutes([]); // Clear all routes
    setMapPointMode(null);
    mapClickCallbackRef.current = null;
    setSelectedMapCoords(null);
    setNotifiedIncidents(new Set());
    setVoiceEnabled(false);
    setDestinationLocation(null);
  };

  const handleStartNavigation = () => {
    if (navigationRoutes.length > 0) { // Check if any route exists
      setShowNavigation(true);
      setNotifiedIncidents(new Set());
    }
  };

  const handleRequestMapPoint = (mode, callback) => {
    setMapPointMode(mode);
    setSelectedMapCoords(null);
    mapClickCallbackRef.current = callback;
  };

  const handleActivateIncidentMode = () => {
    setMapPointMode("incident");
    setSelectedMapCoords(null);
    mapClickCallbackRef.current = null;
  };

  const handleFocusIncident = (incident) => {
    setShowIncidentFeed(false);
  };

  const handleNavigateToSupport = async (location) => {
    setDestinationLocation(location);
    setSelectedSupportLocation(null);
    setShowRoutePlanner(true);
  };

  const handleNavigateToSOS = async (sosAlert) => {
    if (!isValidPosition(userLocation) || !isValidLatLng(sosAlert.latitude, sosAlert.longitude)) return;

    try {
      const destination = [sosAlert.latitude, sosAlert.longitude];
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/cycling/${userLocation[1]},${userLocation[0]};${destination[1]},${destination[0]}?` +
        `overview=full&geometries=geojson&steps=true`
      );
      
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const newRoute = data.routes[0];
        const geometry = newRoute.geometry.coordinates;
        const routeCoordinates = geometry.map(coord => [coord[1], coord[0]]).filter(pos => isValidPosition(pos));

        let instructions = [];
        if (newRoute.legs && newRoute.legs[0] && newRoute.legs[0].steps) {
          newRoute.legs.forEach(leg => {
            leg.steps.forEach((step) => {
              if (step.maneuver) {
                const streetName = step.name || 'via desconhecida';
                let text = '';
                
                if (step.maneuver.type === 'depart') {
                  text = `Siga pela ${streetName}`;
                } else if (step.maneuver.type === 'arrive') {
                  text = 'Chegou ao SOS!';
                } else if (step.maneuver.modifier && step.maneuver.modifier.includes('right')) {
                  text = `Vire à direita na ${streetName}`;
                } else if (step.maneuver.modifier && step.maneuver.modifier.includes('left')) {
                  text = `Vire à esquerda na ${streetName}`;
                } else {
                  text = `Continue pela ${streetName}`;
                }
                
                instructions.push({
                  text: text,
                  distance: (step.distance / 1000).toFixed(2),
                  type: step.maneuver.type || 'turn',
                });
              }
            });
          });
        }

        const sosRoute = {
          coordinates: routeCoordinates,
          distance_km: newRoute.distance / 1000,
          duration_minutes: Math.round(newRoute.duration / 60),
          start_address: "Sua localização",
          end_address: `SOS - ${sosAlert.user_name || 'Ciclista'}`,
          instructions: instructions,
          name: `🆘 Ajuda ${sosAlert.user_name || 'Ciclista'}`,
          isSOS: true
        };

        setNavigationRoutes(prevRoutes => [sosRoute, ...prevRoutes]); // Add SOS route as the primary
        setShowNavigation(true);
        setNotifiedIncidents(new Set()); // Reset incidents for new primary route
        alert("✅ Rota SOS criada! Priorizando trajeto de resgate.");
      }
    } catch (error) {
      console.error("Erro ao calcular rota SOS:", error);
      alert("❌ Erro ao criar rota SOS");
    }
  };

  // handleToggleRoute removed as isSecondaryActive is no longer used

  const handleMapClick = (lat, lng) => {
    if (showNavigation || !mapPointMode || !isValidLatLng(lat, lng)) {
      return;
    }

    setSelectedMapCoords({ lat, lng });

    if (mapPointMode === 'incident') {
      setSelectedPosition([lat, lng]);
      setShowIncidentModal(true);
      setMapPointMode(null);
      mapClickCallbackRef.current = null;
      setSelectedMapCoords(null);
      return;
    }
  };

  const handleConfirmPoint = () => {
    if (mapClickCallbackRef.current && selectedMapCoords && isValidLatLng(selectedMapCoords.lat, selectedMapCoords.lng)) {
      mapClickCallbackRef.current(selectedMapCoords.lat, selectedMapCoords.lng);
      setMapPointMode(null);
      mapClickCallbackRef.current = null;
      setSelectedMapCoords(null);
    }
  };

  const handleCancelMapSelection = () => {
    setMapPointMode(null);
    mapClickCallbackRef.current = null;
    setSelectedMapCoords(null);
  };

  const isMapClickActive = !!mapPointMode && !showNavigation;
  const currentRoute = navigationRoutes.length > 0 ? navigationRoutes[0] : null;

  return (
    <div className="relative h-[calc(100vh-64px)]">
      <MapContainer
        center={userLocation}
        zoom={15}
        className="h-full w-full z-0"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenterController 
          center={mapCenterOverride || (showNavigation ? userLocation : null)} 
          zoom={showNavigation ? 17 : 15}
          enabled={showNavigation || !!mapCenterOverride}
        />
        
        <MapClickHandler 
          onMapClick={handleMapClick}
          isActive={isMapClickActive}
        />
        
        {showNavigation && isValidPosition(userLocation) && (
          <NavigationMarker position={userLocation} avatar={currentUser?.avatar} />
        )}

        {!showNavigation && isValidPosition(userLocation) && (
          <Marker position={userLocation}>
            <Popup>
              <div className="text-center font-medium text-sm">
                📍 Você está aqui
              </div>
            </Popup>
          </Marker>
        )}

        {selectedMapCoords && isValidLatLng(selectedMapCoords.lat, selectedMapCoords.lng) && mapPointMode && (
          <TempMarker 
            position={[selectedMapCoords.lat, selectedMapCoords.lng]} 
            mode={mapPointMode}
          />
        )}

        {filters.incidents && <IncidentMarkers incidents={incidents} onValidate={setValidatingIncident} />}
        {filters.sos && (
          <SOSAlertMarkers 
            sosAlerts={sosAlerts} 
            userLocation={userLocation} 
            onResolveSOS={setResolvingSOS}
            onNavigateToSOS={handleNavigateToSOS}
          />
        )}
        {filters.preferredRoutes && <PreferredRoutes routes={preferredRoutes} />}
        {filters.supportLocations && (
          <SupportLocations 
            locations={supportLocations}
            onSelectLocation={setSelectedSupportLocation}
          />
        )}

        {/* Live participant tracking for active events */}
        {activeEvents.map(event => (
          <LiveParticipantTracker
            key={event.id}
            eventId={event.id}
            allUsers={allUsers}
          />
        ))}

        {navigationRoutes.map((route, index) => {
          if (!route?.coordinates?.length) return null;
          const isPrimary = index === 0;
          const color = isPrimary ? "#6366f1" : "#f59e0b"; // Primary route blue, secondary orange
          const opacity = isPrimary ? 0.9 : 0.6;
          const weight = isPrimary ? (showNavigation ? 6 : 8) : 4;
          const dashArray = isPrimary && navigationRoutes.length > 1 ? "10, 10" : null; // Dash primary if secondary exists

          return (
            <Polyline
              key={index}
              positions={route.coordinates.filter(pos => isValidPosition(pos))}
              pathOptions={{
                color,
                weight,
                opacity,
                lineCap: "round",
                lineJoin: "round",
                dashArray: dashArray
              }}
            />
          );
        })}

        {currentRoute && currentRoute.coordinates?.length > 1 && !showNavigation && (
          <>
            {isValidPosition(currentRoute.coordinates[0]) && (
              <Marker position={currentRoute.coordinates[0]}>
                <Popup>
                  <div className="text-center text-sm">
                    <p className="font-bold text-emerald-600">🚴 Início</p>
                    <p className="text-xs text-gray-600">{currentRoute.start_address}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            {isValidPosition(currentRoute.coordinates[currentRoute.coordinates.length - 1]) && (
              <Marker position={currentRoute.coordinates[currentRoute.coordinates.length - 1]}>
                <Popup>
                  <div className="text-center text-sm">
                    <p className="font-bold text-blue-600">🎯 Destino</p>
                    <p className="text-xs text-gray-600">{currentRoute.end_address}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </>
        )}
      </MapContainer>

      <MiniMap
        route={currentRoute}
        userPosition={userLocation}
        isNavigating={showNavigation}
        isExpanded={miniMapExpanded}
        onExpand={() => setMiniMapExpanded(true)}
        onClose={() => setMiniMapExpanded(false)}
      />

      {mapPointMode && !showNavigation && (
        <MapPointSelector
          mode={mapPointMode}
          onCancel={handleCancelMapSelection}
          onConfirm={handleConfirmPoint}
          coordinates={selectedMapCoords}
        />
      )}

      {!showNavigation && !mapPointMode && (
        <div className="absolute top-2 left-2 right-2 z-10 flex flex-col sm:flex-row justify-between items-start gap-2">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 w-auto">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-2 h-2 text-white" />
              </div>
              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                <Construction className="w-2 h-2 text-white" />
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap justify-end w-full sm:w-auto">
            {navigationRoutes.length > 0 && !showNavigation && (
              <Button
                onClick={handleStartNavigation}
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xl animate-pulse h-10 sm:h-11 text-xs px-3"
                size="sm"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Iniciar</span>
              </Button>
            )}
            {navigationRoutes.length > 0 && (
              <Button
                onClick={handleCloseNavigation}
                variant="destructive"
                className="shadow-xl active:scale-95 h-10 sm:h-11 text-xs px-3"
                size="sm"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            )}
            <Button
              onClick={() => setShowIncidentFeed(!showIncidentFeed)}
              className={`shadow-xl active:scale-95 h-10 sm:h-11 text-xs px-2.5 sm:px-3 ${showIncidentFeed ? 'bg-orange-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              size="sm"
            >
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <Button
              onClick={handleActivateIncidentMode}
              className={`shadow-xl active:scale-95 h-10 sm:h-11 text-xs px-2.5 sm:px-3 ${mapPointMode === 'incident' ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-red-500 hover:bg-red-600'}`}
              size="sm"
            >
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/95 backdrop-blur-sm hover:bg-white active:scale-95 text-gray-700 shadow-xl h-10 sm:h-11 text-xs px-2.5 sm:px-3"
              size="sm"
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <Button
              onClick={() => setShowRoutePlanner(true)}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xl h-10 sm:h-11 text-xs px-2.5 sm:px-3"
              size="sm"
            >
              <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      )}

      {showNavigation && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            onClick={() => setShowQuickReport(true)}
            className="bg-red-600 hover:bg-red-700 active:scale-95 shadow-xl h-11 text-sm"
            size="sm"
          >
            <AlertCircle className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Reportar</span>
          </Button>
        </div>
      )}

      {showFilters && (
        <MapFilters
          filters={filters}
          setFilters={setFilters}
          onClose={() => setShowFilters(false)}
          onAddRoute={() => setShowAddRoute(true)}
          onAddLocation={() => setShowAddLocation(true)}
        />
      )}

      {showIncidentFeed && (
        <IncidentFeed
          incidents={incidents}
          onClose={() => setShowIncidentFeed(false)}
          userLocation={userLocation}
          onFocusIncident={handleFocusIncident}
        />
      )}

      <SOSButton userLocation={userLocation} />

      {sosAlerts.length > 0 && filters.sos && !showNavigation && (
        <ActiveSOSPanel sosAlerts={sosAlerts} userLocation={userLocation} />
      )}

      {showNavigation && navigationRoutes.length > 0 && (
        <>
          <MultiRouteNavigation // Changed component name
            routes={navigationRoutes} // Changed prop name and type
            onClose={handleCloseNavigation}
            currentPosition={userLocation}
            onRouteRecalculated={handleRouteRecalculated}
            onCenterMap={handleCenterMap}
          />
          <VoiceNavigation
            currentInstruction={currentRoute?.instructions?.[0]}
            distance={currentRoute?.instructions?.[0]?.distance}
            enabled={voiceEnabled}
            onToggle={() => setVoiceEnabled(!voiceEnabled)}
          />
        </>
      )}

      {showQuickReport && isValidPosition(userLocation) && (
        <QuickIncidentReport
          position={userLocation}
          onClose={() => setShowQuickReport(false)}
        />
      )}

      {selectedSupportLocation && !showNavigation && (
        <SupportLocationNavigator
          location={selectedSupportLocation}
          onNavigate={handleNavigateToSupport}
          onClose={() => setSelectedSupportLocation(null)}
        />
      )}

      {showIncidentModal && isValidPosition(selectedPosition) && (
        <AddIncidentModal
          position={selectedPosition}
          onClose={() => {
            setShowIncidentModal(false);
            setSelectedPosition(null);
            setMapPointMode(null);
            mapClickCallbackRef.current = null;
            setSelectedMapCoords(null);
          }}
        />
      )}

      {showRoutePlanner && (
        <RoutePlanner
          userLocation={userLocation}
          onClose={() => {
            setShowRoutePlanner(false);
            setMapPointMode(null);
            mapClickCallbackRef.current = null;
            setSelectedMapCoords(null);
            setDestinationLocation(null);
          }}
          onRouteCalculated={handleRouteCalculated}
          onRequestMapPoint={handleRequestMapPoint}
          waitingForMapPoint={!!mapPointMode}
          destinationLocation={destinationLocation}
        />
      )}

      {showAddRoute && (
        <AddPreferredRoute
          userLocation={userLocation}
          onClose={() => setShowAddRoute(false)}
        />
      )}

      {showAddLocation && isValidPosition(selectedPosition) && (
        <AddSupportLocation
          position={selectedPosition}
          onClose={() => {
            setShowAddLocation(false);
            setSelectedPosition(null);
          }}
        />
      )}

      {validatingIncident && (
        <IncidentFeedbackModal
          incident={validatingIncident}
          onClose={() => setValidatingIncident(null)}
        />
      )}

      {resolvingSOS && (
        <SOSResolutionModal
          sosAlert={resolvingSOS}
          onClose={() => setResolvingSOS(null)}
        />
      )}
    </div>
  );
}
