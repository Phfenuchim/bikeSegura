import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation, MapPin, Target, Save, AlertTriangle, ArrowRight, Map, Bike, Play, Plus, X, Sparkles, Loader2, Route } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import AddressAutocomplete from "./AddressAutocomplete";
import AISuggestions from "./AISuggestions";
import ElevationProfile from "./ElevationProfile";

export default function RoutePlanner({ userLocation, onClose, onRouteCalculated, onRequestMapPoint, waitingForMapPoint, destinationLocation }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [routeName, setRouteName] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedRoutes, setCalculatedRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [error, setError] = useState(null);
  const [routePreference, setRoutePreference] = useState("balanced");
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (userLocation) {
      setOrigin(`📍 Minha localização`);
      setOriginCoords({ lat: userLocation[0], lon: userLocation[1] });
    }
  }, [userLocation]);

  useEffect(() => {
    if (destinationLocation) {
      const addressText = destinationLocation.address || destinationLocation.name || `${destinationLocation.latitude}, ${destinationLocation.longitude}`;
      setDestination(addressText);
      setDestCoords({ lat: destinationLocation.latitude, lon: destinationLocation.longitude });
      setShowAISuggestions(false);
    }
  }, [destinationLocation]);

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.filter({ status: 'ativo' }),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const saveRouteMutation = useMutation({
    mutationFn: async (routeData) => {
      const user = await base44.auth.me();
      return base44.entities.SavedRoute.create({
        ...routeData,
        user_email: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
      alert("✅ Rota salva com sucesso!");
    },
  });

  const handleSelectPointOnMap = (pointType, waypointIndex = null) => {
    if (onRequestMapPoint) {
      onRequestMapPoint(pointType, (lat, lng) => {
        const addressText = `📍 Ponto no mapa (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        
        if (pointType === "origin") {
          setOrigin(addressText);
          setOriginCoords({ lat, lon: lng });
        } else if (pointType === "destination") {
          setDestination(addressText);
          setDestCoords({ lat, lon: lng });
        } else if (pointType === "waypoint" && waypointIndex !== null) {
          const newWaypoints = [...waypoints];
          newWaypoints[waypointIndex] = {
            address: addressText,
            coords: { lat, lon: lng }
          };
          setWaypoints(newWaypoints);
        }
      });
    }
  };

  const addWaypoint = () => {
    setWaypoints([...waypoints, { address: "", coords: null }]);
  };

  const removeWaypoint = (index) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const updateWaypoint = (index, address, coords) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = { address, coords };
    setWaypoints(newWaypoints);
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

  const calculateRoute = async () => {
    if (!originCoords || !destCoords) {
      setError("Por favor, selecione origem e destino");
      return;
    }

    const validWaypoints = waypoints.filter(wp => wp.coords !== null);
    setIsCalculating(true);
    setError(null);
    setCalculatedRoutes([]);
    setSelectedRoute(null);

    try {
      const strategies = [
        { profile: 'cycling', name: 'Otimizada para Bicicleta' },
        { profile: 'cycling', name: 'Rota Alternativa' },
        { profile: 'cycling', name: 'Mais Rápida' }
      ];

      let allCoords = [originCoords, ...validWaypoints.map(wp => wp.coords), destCoords];
      const coordsString = allCoords.map(c => `${c.lon},${c.lat}`).join(';');

      const routeOptions = [];
      for (const strategy of strategies) {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/${strategy.profile}/${coordsString}?overview=full&geometries=geojson&steps=true&alternatives=true`
          );
          
          const data = await response.json();
          
          if (data.code === 'Ok' && data.routes) {
            data.routes.forEach((route, idx) => {
              routeOptions.push({
                ...route,
                strategyName: idx === 0 ? strategy.name : `${strategy.name} ${idx + 1}`
              });
            });
          }
        } catch (error) {
          console.warn(`Strategy ${strategy.profile} failed:`, error);
        }
      }

      const processedRoutes = routeOptions.slice(0, 3).map((routeData) => {
        const geometry = routeData.geometry.coordinates;
        const routeCoordinates = geometry.map(coord => [coord[1], coord[0]]);

        let instructions = [];
        if (routeData.legs?.[0]?.steps) {
          routeData.legs.forEach(leg => {
            leg.steps.forEach((step) => {
              if (step.maneuver) {
                const streetName = step.name || 'via desconhecida';
                let text = '';
                
                if (step.maneuver.type === 'depart') text = `Siga pela ${streetName}`;
                else if (step.maneuver.type === 'arrive') text = 'Você chegou ao destino';
                else if (step.maneuver.modifier?.includes('right')) text = `Vire à direita na ${streetName}`;
                else if (step.maneuver.modifier?.includes('left')) text = `Vire à esquerda na ${streetName}`;
                else text = `Continue pela ${streetName}`;
                
                instructions.push({
                  text,
                  distance: (step.distance / 1000).toFixed(2),
                  type: step.maneuver.type || 'turn',
                });
              }
            });
          });
        }

        if (!instructions.length) {
          instructions = [{
            text: `Siga até ${destination}`,
            distance: (routeData.distance / 1000).toFixed(2),
            type: 'navigate'
          }];
        }

        const nearbyIncidents = incidents.filter(incident => {
          for (let i = 0; i < routeCoordinates.length; i += 5) {
            const point = routeCoordinates[i];
            const dist = calculateDistance(point[0], point[1], incident.latitude, incident.longitude);
            if (dist <= 0.3) return true;
          }
          return false;
        });

        return {
          coordinates: routeCoordinates,
          distance_km: routeData.distance / 1000,
          duration_minutes: Math.round(routeData.duration / 60),
          start_address: origin,
          end_address: destination,
          incidents: nearbyIncidents,
          instructions,
          routeName: routeData.strategyName
        };
      });

      setCalculatedRoutes(processedRoutes);
      if (processedRoutes.length > 0) {
        setSelectedRoute(processedRoutes[0]);
      }
      
    } catch (err) {
      console.error("❌ Erro ao calcular rota:", err);
      setError(`Erro ao calcular rota: ${err.message}`);
    }

    setIsCalculating(false);
  };

  const handleUseRoute = () => {
    if (selectedRoute) {
      onRouteCalculated(selectedRoute);
    }
  };

  const handleSaveRoute = () => {
    if (!routeName.trim()) {
      alert("Por favor, dê um nome para a rota");
      return;
    }

    if (!selectedRoute) {
      alert("Selecione uma rota primeiro");
      return;
    }

    const routeCoords = selectedRoute.coordinates.map(coord => ({ lat: coord[0], lng: coord[1] }));

    saveRouteMutation.mutate({
      name: routeName,
      start_address: origin,
      end_address: destination,
      coordinates: routeCoords,
      distance_km: selectedRoute.distance_km,
      duration_minutes: selectedRoute.duration_minutes,
      is_favorite: false,
      times_used: 0
    });
  };

  const handleAIDestination = (address, name) => {
    setDestination(address);
    setShowAISuggestions(false);
  };

  if (waitingForMapPoint) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-[9999] p-0">
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Navigation className="w-5 h-5 text-emerald-600" />
            Planejador de Rotas
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-4 p-4 sm:p-6">
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 font-bold text-sm">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Origem
              </Label>
              <AddressAutocomplete
                value={origin}
                onChange={setOrigin}
                onSelect={(s) => setOriginCoords({ lat: s.lat, lon: s.lon })}
                placeholder="Digite o endereço de origem"
                referencePoint={null}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setOrigin(`📍 Minha localização`);
                    setOriginCoords({ lat: userLocation[0], lon: userLocation[1] });
                  }}
                  className="flex-1 h-10 text-xs"
                >
                  📍 Minha Localização
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => handleSelectPointOnMap("origin")} 
                  className="flex-1 h-10 text-xs"
                >
                  <Map className="w-4 h-4 mr-1" /> Mapa
                </Button>
              </div>
            </div>

            {waypoints.length > 0 && (
              <div className="border-2 border-purple-200 rounded-lg p-3 bg-purple-50 space-y-2">
                <h4 className="font-bold text-sm">Pontos Intermediários</h4>
                {waypoints.map((waypoint, index) => (
                  <div key={index} className="flex gap-2">
                    <AddressAutocomplete
                      value={waypoint.address}
                      onChange={(val) => updateWaypoint(index, val, waypoint.coords)}
                      onSelect={(s) => updateWaypoint(index, s.name, { lat: s.lat, lon: s.lon })}
                      placeholder={`Ponto ${index + 1}`}
                      referencePoint={originCoords}
                    />
                    <Button variant="outline" size="sm" onClick={() => handleSelectPointOnMap("waypoint", index)} className="h-10 w-10 p-0">
                      <Map className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeWaypoint(index)} className="h-10 w-10 p-0 text-red-600">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {waypoints.length < 3 && (
              <Button onClick={addWaypoint} size="sm" variant="outline" className="w-full h-9">
                <Plus className="w-3 h-3 mr-1" />
                Adicionar Ponto Intermediário
              </Button>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 font-bold text-sm">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="flex-1">Destino</span>
                <Button
                  onClick={() => setShowAISuggestions(!showAISuggestions)}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-purple-600"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {showAISuggestions ? "Fechar" : "IA"}
                </Button>
              </Label>
              <AddressAutocomplete
                value={destination}
                onChange={setDestination}
                onSelect={(s) => setDestCoords({ lat: s.lat, lon: s.lon })}
                placeholder="Digite o endereço de destino"
                referencePoint={originCoords}
              />
              <Button 
                variant="outline"
                size="sm" 
                onClick={() => handleSelectPointOnMap("destination")} 
                className="w-full h-10 text-xs"
              >
                <Map className="w-4 h-4 mr-1" /> Selecionar no Mapa
              </Button>
            </div>

            {showAISuggestions && (
              <AISuggestions
                userLevel={currentUser?.level || 1}
                userLocation={userLocation}
                onUseAsDestination={handleAIDestination}
              />
            )}

            <div className="space-y-2">
              <Label className="font-bold text-sm">Preferência</Label>
              <Select value={routePreference} onValueChange={setRoutePreference}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">⚖️ Equilibrada</SelectItem>
                  <SelectItem value="shortest">⚡ Mais Curta</SelectItem>
                  <SelectItem value="safest">🛡️ Mais Segura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={calculateRoute}
              disabled={isCalculating || !originCoords || !destCoords}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 font-bold"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Route className="w-5 h-5 mr-2" />
                  Calcular Rotas
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {calculatedRoutes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                  {calculatedRoutes.length} Rotas Encontradas
                </h3>

                <div className="grid gap-3">
                  {calculatedRoutes.map((route, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all ${
                        selectedRoute === route
                          ? 'border-2 border-emerald-500 shadow-lg'
                          : 'border hover:border-emerald-300'
                      }`}
                      onClick={() => setSelectedRoute(route)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-emerald-500 text-xs">
                            {index === 0 ? '⭐ Recomendada' : `Opção ${index + 1}`}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Distância</span>
                            <p className="font-bold text-emerald-600">{route.distance_km.toFixed(1)} km</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Tempo</span>
                            <p className="font-bold text-blue-600">{route.duration_minutes} min</p>
                          </div>
                          {route.incidents?.length > 0 && (
                            <div className="col-span-2 flex items-center text-orange-500 text-xs mt-1">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {route.incidents.length} incidentes próximos
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedRoute && (
                  <div className="space-y-3 border-t-2 border-emerald-500 pt-4">
                    <ElevationProfile route={selectedRoute} />

                    <Button
                      onClick={handleUseRoute}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Usar Esta Rota
                    </Button>

                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <Label className="font-bold text-sm">Salvar Rota</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome da rota"
                          value={routeName}
                          onChange={(e) => setRouteName(e.target.value)}
                          className="flex-1 h-10 text-sm"
                        />
                        <Button
                          onClick={handleSaveRoute}
                          disabled={saveRouteMutation.isLoading}
                          className="bg-blue-600 hover:bg-blue-700 h-10 px-4"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}