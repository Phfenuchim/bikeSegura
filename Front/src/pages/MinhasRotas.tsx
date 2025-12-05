
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Trash2, Navigation, Edit, Heart, Star, Share2, Map as MapIcon, List } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import EditRouteModal from "../components/routes/EditRouteModal";
import RouteFeedbackModal from "../components/feedback/RouteFeedbackModal";
import ShareRouteModal from "../components/routes/ShareRouteModal";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

export default function MinhasRotasPage() {
  const [editingRoute, setEditingRoute] = useState(null);
  const [feedbackRoute, setFeedbackRoute] = useState(null);
  const [sharingRoute, setSharingRoute] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState([-23.5505, -46.6333]);
  const [activeTab, setActiveTab] = useState("list");
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: savedRoutes = [], isLoading } = useQuery({
    queryKey: ['saved-routes'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.SavedRoute.filter({ user_email: user.email }, '-updated_date');
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => 
      base44.entities.SavedRoute.update(id, { is_favorite: !isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedRoute.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
    },
  });

  const handleNavigate = async (route) => {
    if (!route || !route.coordinates || route.coordinates.length === 0) {
      alert("❌ Rota sem coordenadas válidas");
      return;
    }

    const coords = route.coordinates.map(c => 
      Array.isArray(c) ? [c[0], c[1]] :
      c.lat && c.lng ? [c.lat, c.lng] : null
    ).filter(c => c !== null);

    if (coords.length === 0) {
      alert("❌ Coordenadas da rota estão em formato inválido");
      return;
    }

    // Pegar localização atual
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const startCoord = coords[0]; // The first coordinate of the saved route
        
        const routes = [];
        
        // Calculate distance to the start of the saved route
        const distanceToStart = calculateDistance(userLat, userLng, startCoord[0], startCoord[1]);
        
        // If current location is far from the route start (e.g., > 50m), calculate an access route
        if (distanceToStart > 0.05) { // 0.05 km = 50 meters
          try {
            // OSRM expects [longitude, latitude]
            const osrmResponse = await fetch(
              `https://router.project-osrm.org/route/v1/cycling/${userLng},${userLat};${startCoord[1]},${startCoord[0]}?overview=full&geometries=geojson&steps=true`
            );
            const osrmData = await osrmResponse.json();
            
            if (osrmData.code === 'Ok' && osrmData.routes?.[0]) {
              const accessRouteData = osrmData.routes[0];
              // OSRM coordinates are [lng, lat], convert to Leaflet's [lat, lng]
              const accessCoords = accessRouteData.geometry.coordinates.map(c => [c[1], c[0]]);
              
              let accessInstructions = [];
              accessRouteData.legs?.forEach(leg => {
                leg.steps?.forEach(step => {
                  if (step.maneuver) {
                    const name = step.name || 'via';
                    let text = '';
                    if (step.maneuver.type === 'depart') text = `Siga pela ${name}`;
                    else if (step.maneuver.type === 'arrive') text = `Chegou ao início da rota`;
                    else if (step.maneuver.modifier?.includes('right')) text = `Vire à direita na ${name}`;
                    else if (step.maneuver.modifier?.includes('left')) text = `Vire à esquerda na ${name}`;
                    else text = `Continue pela ${name}`;
                    
                    accessInstructions.push({
                      text,
                      distance: (step.distance / 1000).toFixed(2), // Convert meters to km
                      type: step.maneuver.type || 'turn'
                    });
                  }
                });
              });
              
              routes.push({
                coordinates: accessCoords,
                distance_km: accessRouteData.distance / 1000,
                duration_minutes: Math.round(accessRouteData.duration / 60),
                start_address: "Sua localização",
                end_address: route.start_address,
                name: "🚴 Rota de Acesso",
                instructions: accessInstructions
              });
            }
          } catch (error) {
            console.error("Erro ao calcular rota de acesso:", error);
            // Optionally, inform the user but proceed with the main route
            alert("⚠️ Não foi possível calcular a rota de acesso. Navegando diretamente para o início da rota salva.");
          }
        }
        
        // Add the main saved route
        routes.push({
          coordinates: coords,
          distance_km: route.distance_km || 0,
          duration_minutes: route.duration_minutes || 0,
          start_address: route.start_address || "Origem",
          end_address: route.end_address || "Destino",
          name: route.name || "Rota salva",
          instructions: [{
            text: `Navegando para ${route.end_address || 'destino'}`,
            distance: (route.distance_km || 0).toFixed(2),
            type: 'navigate'
          }]
        });
        
        sessionStorage.setItem('navigationRoutes', JSON.stringify(routes));
        navigate(createPageUrl("Mapa"));
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
        alert("❌ Não foi possível obter sua localização. Navegando diretamente para o início da rota salva.");
        
        // Fallback: navigate with just the saved route if geolocation fails
        const fallbackRoutes = [{
          coordinates: coords,
          distance_km: route.distance_km || 0,
          duration_minutes: route.duration_minutes || 0,
          start_address: route.start_address || "Origem",
          end_address: route.end_address || "Destino",
          name: route.name || "Rota salva",
          instructions: [{
            text: `Navegando para ${route.end_address || 'destino'}`,
            distance: (route.distance_km || 0).toFixed(2),
            type: 'navigate'
          }]
        }];
        sessionStorage.setItem('navigationRoutes', JSON.stringify(fallbackRoutes));
        navigate(createPageUrl("Mapa"));
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 } // Options for getCurrentPosition
    );
  };

  const handleToggleFavorite = (route) => {
    toggleFavoriteMutation.mutate({ id: route.id, isFavorite: route.is_favorite });
  };

  const handleDelete = (routeId) => {
    if (confirm("Tem certeza que deseja excluir esta rota?")) {
      deleteRouteMutation.mutate(routeId);
    }
  };

  const handleViewOnMap = (route) => {
    setActiveTab("map");
    setSelectedRoute(route);
    setShowOnlySelected(true);
    if (route.coordinates?.length > 0) {
      const firstCoord = route.coordinates[0];
      if (Array.isArray(firstCoord)) {
        setMapCenter([firstCoord[0], firstCoord[1]]);
      } else if (firstCoord.lat && firstCoord.lng) {
        setMapCenter([firstCoord.lat, firstCoord.lng]);
      }
    }
  };

  const favoriteRoutes = savedRoutes.filter(r => r.is_favorite);
  const otherRoutes = savedRoutes.filter(r => !r.is_favorite);
  const routeColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f43f5e'];
  const routesToDisplay = showOnlySelected && selectedRoute ? [selectedRoute] : savedRoutes;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Carregando rotas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🚴 Minhas Rotas
            </h1>
            <p className="text-gray-600">
              {savedRoutes.length} {savedRoutes.length === 1 ? 'rota salva' : 'rotas salvas'}
            </p>
          </div>
        </div>

        {savedRoutes.length === 0 ? (
          <Card className="p-12 text-center">
            <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">Nenhuma rota salva ainda</p>
            <p className="text-gray-500 text-sm mb-6">
              Planeje uma rota no mapa e salve para acesso rápido
            </p>
            <Button
              onClick={() => navigate(createPageUrl("Mapa"))}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Ir para o Mapa
            </Button>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="list">
                <List className="w-4 h-4 mr-2" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="map">
                <MapIcon className="w-4 h-4 mr-2" />
                Mapa
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-8">
              {favoriteRoutes.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-6 h-6 text-amber-500" />
                    Rotas Favoritas
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteRoutes.map((route) => (
                      <RouteCard
                        key={route.id}
                        route={route}
                        onNavigate={handleNavigate}
                        onFeedback={() => setFeedbackRoute(route)}
                        onEdit={() => setEditingRoute(route)}
                        onDelete={handleDelete}
                        onToggleFavorite={handleToggleFavorite}
                        onShareToCommunity={() => setSharingRoute(route)}
                        onViewOnMap={handleViewOnMap}
                      />
                    ))}
                  </div>
                </div>
              )}

              {otherRoutes.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Outras Rotas</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherRoutes.map((route) => (
                      <RouteCard
                        key={route.id}
                        route={route}
                        onNavigate={handleNavigate}
                        onFeedback={() => setFeedbackRoute(route)}
                        onEdit={() => setEditingRoute(route)}
                        onDelete={handleDelete}
                        onToggleFavorite={handleToggleFavorite}
                        onShareToCommunity={() => setSharingRoute(route)}
                        onViewOnMap={handleViewOnMap}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="map">
              {showOnlySelected && selectedRoute && (
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-indigo-600 text-white">
                    Visualizando: {selectedRoute.name}
                  </Badge>
                  <Button onClick={() => setShowOnlySelected(false)} variant="outline" size="sm">
                    Ver Todas
                  </Button>
                </div>
              )}

              <Card>
                <CardContent className="p-0">
                  <div className="h-[70vh] w-full">
                    <MapContainer
                      center={mapCenter}
                      zoom={13}
                      className="h-full w-full rounded-lg"
                      key={`${mapCenter[0]}-${mapCenter[1]}`}
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {routesToDisplay.map((route, index) => {
                        if (!route.coordinates?.length) return null;
                        
                        const coords = route.coordinates.map(c =>
                          Array.isArray(c) ? [c[0], c[1]] :
                          c.lat && c.lng ? [c.lat, c.lng] : null
                        ).filter(c => c !== null);
                        
                        if (coords.length < 2) return null;
                        
                        const color = routeColors[index % routeColors.length];
                        
                        return (
                          <React.Fragment key={route.id}>
                            <Polyline
                              positions={coords}
                              pathOptions={{
                                color,
                                weight: 5,
                                opacity: 0.8
                              }}
                              eventHandlers={{
                                click: () => handleViewOnMap(route)
                              }}
                            />

                            <Marker position={coords[0]}>
                              <Popup>
                                <div className="text-center">
                                  <p className="font-bold">🚴 Início</p>
                                  <p className="text-xs">{route.name}</p>
                                </div>
                              </Popup>
                            </Marker>

                            <Marker position={coords[coords.length - 1]}>
                              <Popup>
                                <div className="text-center">
                                  <p className="font-bold">🎯 Destino</p>
                                  <p className="text-xs">{route.name}</p>
                                </div>
                              </Popup>
                            </Marker>
                          </React.Fragment>
                        );
                      })}
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {editingRoute && <EditRouteModal route={editingRoute} onClose={() => setEditingRoute(null)} />}
      {feedbackRoute && <RouteFeedbackModal route={feedbackRoute} onClose={() => setFeedbackRoute(null)} />}
      {sharingRoute && <ShareRouteModal route={sharingRoute} onClose={() => setSharingRoute(null)} />}
    </div>
  );
}

function RouteCard({ route, onNavigate, onFeedback, onEdit, onDelete, onToggleFavorite, onShareToCommunity, onViewOnMap }) {
  return (
    <Card className="hover:shadow-2xl transition-shadow border-2 hover:border-emerald-400">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-xl text-gray-900 line-clamp-1">{route.name}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFavorite(route)}
            className={route.is_favorite ? 'text-amber-500' : 'text-gray-400'}
          >
            <Star className={`w-5 h-5 ${route.is_favorite ? 'fill-current' : ''}`} />
          </Button>
        </div>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex gap-2">
            <span className="text-emerald-600 font-semibold">📍</span>
            <span className="text-gray-700 line-clamp-1">{route.start_address || "?"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-600 font-semibold">🎯</span>
            <span className="text-gray-700 line-clamp-1">{route.end_address || "?"}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Badge className="bg-indigo-100 text-indigo-800">
            📏 {route.distance_km?.toFixed(1) || '?'} km
          </Badge>
          <Badge className="bg-purple-100 text-purple-800">
            ⏱️ {route.duration_minutes || '?'} min
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onNavigate(route)} className="bg-emerald-600" size="sm">
            <Navigation className="w-4 h-4 mr-1" />
            Navegar
          </Button>
          <Button onClick={() => onViewOnMap(route)} variant="outline" size="sm">
            <MapIcon className="w-4 h-4 mr-1" />
            Mapa
          </Button>
          <Button onClick={() => onShareToCommunity(route)} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-1" />
            Compartilhar
          </Button>
          <Button onClick={() => onFeedback(route)} variant="outline" size="sm">
            <Heart className="w-4 h-4 mr-1" />
            Avaliar
          </Button>
          <Button onClick={() => onEdit(route)} variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button onClick={() => onDelete(route.id)} variant="ghost" size="sm" className="text-red-600">
            <Trash2 className="w-4 h-4 mr-1" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
