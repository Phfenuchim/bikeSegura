import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, ArrowUp, Navigation, X, MapPin, AlertTriangle, ChevronDown, ChevronUp, Save, Share2, RefreshCw, Users, Route, Locate, Zap, Clock, Signal, SignalLow, SignalMedium, SignalHigh } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CreateEventFromRouteModal from "../events/CreateEventFromRouteModal";
import CreatePostModal from "../feed/CreatePostModal";

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

const normalizeCoordinate = (coord) => {
  if (!coord) return null;
  if (Array.isArray(coord) && coord.length === 2) return coord;
  if (coord.lat !== undefined && coord.lng !== undefined) return [coord.lat, coord.lng];
  if (coord.latitude !== undefined && coord.longitude !== undefined) return [coord.latitude, coord.longitude];
  return null;
};

const getDirectionIcon = (type) => {
  const iconMap = {
    'turn-right': ArrowRight,
    'turn-left': ArrowLeft,
    'turn-slight-right': ArrowRight,
    'turn-slight-left': ArrowLeft,
    'turn-sharp-right': ArrowRight,
    'turn-sharp-left': ArrowLeft,
    'straight': ArrowUp,
    'continue': ArrowUp,
    'depart': Navigation,
    'arrive': MapPin,
    'navigate': Navigation,
    'default': Navigation
  };
  return iconMap[type] || iconMap['default'];
};

export default function RouteNavigation({ 
  route, 
  onClose, 
  currentPosition, 
  onRouteRecalculated,
  onCenterMap,
  onRouteComplete,
  onProgressUpdate
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userPosition, setUserPosition] = useState(currentPosition);
  const [distanceToNext, setDistanceToNext] = useState(null);
  const [totalDistanceTraveled, setTotalDistanceTraveled] = useState(0);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [offRouteTime, setOffRouteTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [startTime] = useState(Date.now());
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  
  // Novos estados para rastreamento avançado
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsSignalQuality, setGpsSignalQuality] = useState('good');
  const [lastGpsUpdate, setLastGpsUpdate] = useState(Date.now());
  const [speedHistory, setSpeedHistory] = useState([]);
  
  const routeMetadataRef = useRef(null);
  const queryClient = useQueryClient();
  const watchIdRef = useRef(null);
  const offRouteTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const lastPositionRef = useRef(null);
  const lastPositionTimeRef = useRef(null);
  const gpsTimeoutRef = useRef(null);

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
      alert("✅ Rota salva!");
    },
  });

  useEffect(() => {
    if (route?.coordinates?.length > 0) {
      const destCoord = normalizeCoordinate(route.coordinates[route.coordinates.length - 1]);
      
      if (destCoord) {
        routeMetadataRef.current = {
          destination: destCoord,
          start_address: route.start_address || "Origem",
          end_address: route.end_address || "Destino",
          name: route.name || "Minha Rota",
          distance_km: route.distance_km || 0,
        };
      }
    }
  }, [route]);

  const activeRoute = route;
  const currentMetadata = routeMetadataRef.current;

  if (!activeRoute?.coordinates?.length) {
    return (
      <Card className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-auto sm:w-full sm:max-w-md z-[1000] shadow-2xl border-2 border-red-300 bg-red-50">
        <CardContent className="p-4 sm:p-6">
          <p className="text-red-800 font-semibold text-center text-sm">
            ⚠️ Rota inválida
          </p>
          <Button onClick={onClose} variant="outline" className="w-full mt-3 h-11">
            Fechar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!activeRoute.instructions?.length) {
    activeRoute.instructions = [{
      text: `Navegando para ${currentMetadata?.end_address || activeRoute.end_address || 'destino'}`,
      distance: (currentMetadata?.distance_km || activeRoute.distance_km || 0).toFixed(2),
      type: 'navigate'
    }];
  }

  useEffect(() => {
    mountedRef.current = true;

    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          if (mountedRef.current) {
            const newPosition = [position.coords.latitude, position.coords.longitude];
            const currentTime = Date.now();
            
            setUserPosition(newPosition);
            setGpsAccuracy(position.coords.accuracy);
            setLastGpsUpdate(currentTime);
            
            // Calcular velocidade
            if (lastPositionRef.current && lastPositionTimeRef.current) {
              const timeDiff = (currentTime - lastPositionTimeRef.current) / 1000; // segundos
              
              if (timeDiff > 0) {
                const distance = calculateDistance(
                  lastPositionRef.current[0],
                  lastPositionRef.current[1],
                  newPosition[0],
                  newPosition[1]
                );
                
                const speed = (distance / timeDiff) * 3600; // km/h
                
                // Filtrar velocidades irreais (> 100 km/h para ciclista)
                if (speed <= 100) {
                  setCurrentSpeed(speed);
                  
                  setSpeedHistory(prev => {
                    const updated = [...prev, speed];
                    if (updated.length > 10) updated.shift(); // Manter últimas 10 leituras
                    
                    // Calcular velocidade média
                    const avg = updated.reduce((a, b) => a + b, 0) / updated.length;
                    setAverageSpeed(avg);
                    
                    return updated;
                  });
                }
              }
            }
            
            lastPositionRef.current = newPosition;
            lastPositionTimeRef.current = currentTime;
            
            // Determinar qualidade do sinal
            if (position.coords.accuracy <= 10) {
              setGpsSignalQuality('excellent');
            } else if (position.coords.accuracy <= 20) {
              setGpsSignalQuality('good');
            } else if (position.coords.accuracy <= 50) {
              setGpsSignalQuality('fair');
            } else {
              setGpsSignalQuality('poor');
            }
          }
        },
        (error) => {
          console.error("GPS erro:", error);
          setGpsSignalQuality('lost');
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      watchIdRef.current = id;
    }

    return () => {
      mountedRef.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (offRouteTimerRef.current) {
        clearInterval(offRouteTimerRef.current);
      }
      if (gpsTimeoutRef.current) {
        clearTimeout(gpsTimeoutRef.current);
      }
    };
  }, []);

  // Monitorar perda de sinal GPS
  useEffect(() => {
    if (gpsTimeoutRef.current) {
      clearTimeout(gpsTimeoutRef.current);
    }
    
    gpsTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        const timeSinceLastUpdate = Date.now() - lastGpsUpdate;
        if (timeSinceLastUpdate > 10000) { // 10 segundos sem atualização
          setGpsSignalQuality('lost');
        }
      }
    }, 10000);
    
    return () => {
      if (gpsTimeoutRef.current) clearTimeout(gpsTimeoutRef.current);
    };
  }, [lastGpsUpdate]);

  useEffect(() => {
    if (offRouteTimerRef.current) {
      clearInterval(offRouteTimerRef.current);
    }

    if (isOffRoute && !isRecalculating && mountedRef.current) {
      offRouteTimerRef.current = setInterval(() => {
        if (mountedRef.current) {
          setOffRouteTime(prev => {
            const newTime = prev + 1;
            if (newTime >= 10) handleRecalculateRoute();
            return newTime;
          });
        }
      }, 1000);
    } else {
      setOffRouteTime(0);
    }

    return () => {
      if (offRouteTimerRef.current) clearInterval(offRouteTimerRef.current);
    };
  }, [isOffRoute, isRecalculating]);

  useEffect(() => {
    if (!userPosition || !activeRoute?.coordinates?.length) return;

    const normalizedCoords = activeRoute.coordinates.map(normalizeCoordinate).filter(c => c !== null);
    if (normalizedCoords.length === 0) return;

    let closestDistance = Infinity;
    let closestIndex = 0;

    normalizedCoords.forEach((coord, idx) => {
      const dist = calculateDistance(userPosition[0], userPosition[1], coord[0], coord[1]);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestIndex = idx;
      }
    });

    setIsOffRoute(closestDistance > 0.15);

    const routeLength = normalizedCoords.length;
    const progressRatio = closestIndex / routeLength;
    const baseDistance = currentMetadata?.distance_km || activeRoute.distance_km || 0;
    const traveled = progressRatio * baseDistance;
    setTotalDistanceTraveled(traveled);

    const progressPercentage = baseDistance > 0 ? Math.min(100, (traveled / baseDistance) * 100) : 0;
    if (onProgressUpdate) {
      onProgressUpdate(progressPercentage);
    }

    // Calcular tempo restante estimado
    const remainingDist = baseDistance - traveled;
    if (averageSpeed > 0 && remainingDist > 0) {
      const timeRemainingHours = remainingDist / averageSpeed;
      const timeRemainingMinutes = Math.round(timeRemainingHours * 60);
      setEstimatedTimeRemaining(timeRemainingMinutes);
    } else {
      setEstimatedTimeRemaining(null);
    }

    if (progressRatio > 0.95 && !routeCompleted) {
      setRouteCompleted(true);
      if (onRouteComplete) {
        onRouteComplete();
      }
    }

    if (activeRoute.instructions?.length) {
      const pointsPerInstruction = Math.max(1, Math.floor(routeLength / activeRoute.instructions.length));
      const nextInstructionIndex = Math.min((currentStepIndex + 1) * pointsPerInstruction, routeLength - 1);
      const nextPoint = normalizedCoords[nextInstructionIndex];

      if (nextPoint?.length === 2) {
        const distToNext = calculateDistance(
          userPosition[0], userPosition[1],
          nextPoint[0], nextPoint[1]
        );
        setDistanceToNext(distToNext);

        if (distToNext < 0.05 && currentStepIndex < activeRoute.instructions.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        }
      }
    }
  }, [userPosition, currentStepIndex, activeRoute, routeCompleted, currentMetadata, onProgressUpdate, onRouteComplete, averageSpeed]);

  const handleRecalculateRoute = async () => {
    if (!mountedRef.current || isRecalculating || !userPosition || !currentMetadata?.destination) {
      return;
    }

    const destination = currentMetadata.destination;
    if (!destination || destination.length !== 2) {
      console.error("❌ Destino inválido:", destination);
      return;
    }

    setIsRecalculating(true);

    try {
      const [userLat, userLng] = userPosition;
      const [destLat, destLng] = destination;

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/cycling/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`
      );
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes?.[0]) {
        throw new Error("Rota não encontrada");
      }

      const newRoute = data.routes[0];
      const routeCoordinates = newRoute.geometry.coordinates.map(c => [c[1], c[0]]);

      let instructions = [];
      newRoute.legs?.forEach(leg => {
        leg.steps?.forEach(step => {
          if (step.maneuver) {
            const name = step.name || 'via';
            let text = '';
            
            if (step.maneuver.type === 'depart') text = `Siga pela ${name}`;
            else if (step.maneuver.type === 'arrive') text = 'Chegou!';
            else if (step.maneuver.modifier?.includes('right')) text = `Vire à direita na ${name}`;
            else if (step.maneuver.modifier?.includes('left')) text = `Vire à esquerda na ${name}`;
            else text = `Continue pela ${name}`;
            
            instructions.push({
              text,
              distance: (step.distance / 1000).toFixed(2),
              type: step.maneuver.type || 'turn'
            });
          }
        });
      });

      if (!instructions.length) {
        instructions = [{
          text: `Continue até ${currentMetadata.end_address}`,
          distance: (newRoute.distance / 1000).toFixed(2),
          type: 'navigate'
        }];
      }

      const recalculatedRoute = {
        coordinates: routeCoordinates,
        distance_km: newRoute.distance / 1000,
        duration_minutes: Math.round(newRoute.duration / 60),
        instructions,
        start_address: currentMetadata.start_address,
        end_address: currentMetadata.end_address,
        name: currentMetadata.name
      };

      if (onRouteRecalculated) {
        onRouteRecalculated(recalculatedRoute, false);
      }

      setCurrentStepIndex(0);
      setIsOffRoute(false);
      setOffRouteTime(0);
    } catch (error) {
      console.error("❌ Erro:", error);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleSaveRoute = () => {
    const routeName = prompt("Nome:", currentMetadata?.name || "Minha rota");
    if (!routeName) return;

    const elapsedTime = Math.round((Date.now() - startTime) / 60000);
    const routeCoords = activeRoute.coordinates.map(c => ({ lat: c[0], lng: c[1] }));

    saveRouteMutation.mutate({
      name: routeName,
      start_address: currentMetadata?.start_address || activeRoute.start_address,
      end_address: currentMetadata?.end_address || activeRoute.end_address,
      coordinates: routeCoords,
      distance_km: totalDistanceTraveled,
      duration_minutes: elapsedTime,
      is_favorite: false,
      times_used: 1
    });
  };

  const handleShareRoute = async () => {
    const routeName = currentMetadata?.name || activeRoute.name || "Minha rota";
    const distance = (currentMetadata?.distance_km || activeRoute.distance_km || 0).toFixed(1);
    
    const shareUrl = `${window.location.origin}?route=${encodeURIComponent(routeName)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: routeName,
          text: `Rota de ${distance}km!`,
          url: shareUrl
        });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("📋 Link copiado!");
    }
  };

  const handleRouteComplete = async () => {
    const elapsedTime = Math.round((Date.now() - startTime) / 60000);
    const avgSpeed = elapsedTime > 0 ? (totalDistanceTraveled / (elapsedTime / 60)) : 0;
    const routeCoords = activeRoute.coordinates.map(c => ({ lat: c[0], lng: c[1] }));
    
    setShowPostModal({
      distance_km: totalDistanceTraveled,
      duration_minutes: elapsedTime,
      average_speed: parseFloat(avgSpeed.toFixed(1)),
      start_address: currentMetadata?.start_address || activeRoute.start_address,
      end_address: currentMetadata?.end_address || activeRoute.end_address,
      name: currentMetadata?.name || activeRoute.name,
      coordinates: routeCoords
    });
  };

  const getGpsSignalIcon = () => {
    switch (gpsSignalQuality) {
      case 'excellent':
      case 'good':
        return <SignalHigh className="w-4 h-4 text-green-600" />;
      case 'fair':
        return <SignalMedium className="w-4 h-4 text-yellow-600" />;
      case 'poor':
        return <SignalLow className="w-4 h-4 text-orange-600" />;
      case 'lost':
        return <Signal className="w-4 h-4 text-red-600" />;
      default:
        return <Signal className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTime = (minutes) => {
    if (!minutes || minutes < 0) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins}min`;
  };

  const currentInstruction = activeRoute.instructions?.[currentStepIndex] || activeRoute.instructions?.[0];
  const Icon = getDirectionIcon(currentInstruction?.type);
  const baseDistance = currentMetadata?.distance_km || activeRoute.distance_km || 0;
  const progressPercentage = baseDistance > 0 ? Math.min(100, (totalDistanceTraveled / baseDistance) * 100).toFixed(0) : 0;
  const remainingDistance = Math.max(0, baseDistance - totalDistanceTraveled).toFixed(1);
  const displayName = currentMetadata?.name || activeRoute.name || "Navegação";

  if (isMinimized) {
    return (
      <div className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-auto sm:w-full sm:max-w-sm z-[1000]">
        <Card 
          className="shadow-2xl border-4 border-indigo-400 bg-gradient-to-r from-indigo-600 to-purple-600 cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold opacity-90">
                      {progressPercentage}% • {remainingDistance}km
                    </p>
                    {getGpsSignalIcon()}
                  </div>
                  <p className="font-bold text-sm truncate">
                    {currentInstruction?.text}
                  </p>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {currentSpeed.toFixed(0)} km/h
                    </span>
                    {estimatedTimeRemaining && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(estimatedTimeRemaining)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onCenterMap?.(userPosition); }}
                  className="text-white hover:bg-white/20 h-9 w-9"
                >
                  <Locate className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="text-white hover:bg-white/20 h-9 w-9"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {gpsSignalQuality === 'lost' && (
              <div className="mt-2 bg-red-500 rounded-lg p-2">
                <p className="text-white text-xs font-bold">⚠️ Sinal GPS perdido</p>
              </div>
            )}

            {isOffRoute && (
              <div className="mt-2 bg-red-500 rounded-lg p-2 animate-pulse">
                <div className="flex items-center justify-between text-white text-xs">
                  <span className="font-bold">⚠️ Fora da rota</span>
                  {isRecalculating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>{10 - offRouteTime}s</span>}
                </div>
              </div>
            )}

            <Progress value={progressPercentage} className="h-1.5 bg-white/30 mt-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-auto sm:w-full sm:max-w-md z-[1000]">
        <Card className="shadow-2xl border-4 border-indigo-400">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white pb-2 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2 truncate">
                <Navigation className="w-4 h-4 shrink-0" />
                {displayName}
              </CardTitle>
              <div className="flex gap-1 shrink-0">
                {getGpsSignalIcon()}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onCenterMap?.(userPosition)}
                  className="text-white hover:bg-indigo-700 h-8 w-8"
                >
                  <Locate className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(true)}
                  className="text-white hover:bg-indigo-700 h-8 w-8"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-indigo-700 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="mt-2">
              <Progress value={progressPercentage} className="h-2 bg-indigo-300" />
              <div className="flex justify-between mt-1 text-xs">
                <span>{progressPercentage}%</span>
                <span>{remainingDistance}km</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 bg-gradient-to-br from-white to-indigo-50 max-h-[65vh] overflow-y-auto">
            {gpsSignalQuality === 'lost' && (
              <div className="mb-3 bg-red-100 border-2 border-red-400 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-800">
                  <Signal className="w-5 h-5" />
                  <div>
                    <p className="font-bold text-sm">Sinal GPS perdido</p>
                    <p className="text-xs">Aguardando reconexão...</p>
                  </div>
                </div>
              </div>
            )}

            {isOffRoute && (
              <div className="mb-3 bg-red-100 border-2 border-red-400 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="font-bold text-sm">Fora da rota!</p>
                  </div>
                  {isRecalculating && <RefreshCw className="w-4 h-4 animate-spin text-red-600" />}
                </div>
                <p className="text-xs text-red-700 mb-2">
                  {isRecalculating ? "Recalculando..." : `Automático em ${10 - offRouteTime}s`}
                </p>
                <Button
                  onClick={handleRecalculateRoute}
                  disabled={isRecalculating}
                  size="sm"
                  className="w-full bg-red-600 hover:bg-red-700 h-10"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
                  Recalcular Agora
                </Button>
              </div>
            )}

            <div className="mb-3 bg-white rounded-xl p-3 shadow-lg border-2 border-indigo-200">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">
                    {currentInstruction?.text}
                  </h3>
                  {distanceToNext !== null && (
                    <Badge className="bg-indigo-500 text-white">
                      📏 {distanceToNext < 1 ? `${(distanceToNext * 1000).toFixed(0)}m` : `${distanceToNext.toFixed(1)}km`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-white rounded-lg p-2 text-center border">
                <Zap className="w-4 h-4 mx-auto mb-1 text-yellow-600" />
                <p className="text-xs text-gray-500">Velocidade</p>
                <p className="text-sm font-bold text-gray-900">{currentSpeed.toFixed(0)}</p>
                <p className="text-xs text-gray-500">km/h</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center border">
                <Zap className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                <p className="text-xs text-gray-500">Média</p>
                <p className="text-sm font-bold text-gray-900">{averageSpeed.toFixed(0)}</p>
                <p className="text-xs text-gray-500">km/h</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center border">
                <Clock className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                <p className="text-xs text-gray-500">Restante</p>
                <p className="text-xs font-bold text-gray-900">{formatTime(estimatedTimeRemaining)}</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center border">
                <MapPin className="w-4 h-4 mx-auto mb-1 text-green-600" />
                <p className="text-xs text-gray-500">Precisão</p>
                <p className="text-xs font-bold text-gray-900">{gpsAccuracy ? `${Math.round(gpsAccuracy)}m` : '--'}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <Button onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))} disabled={currentStepIndex === 0} variant="outline" className="flex-1 h-10">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button onClick={() => setCurrentStepIndex(Math.min(activeRoute.instructions.length - 1, currentStepIndex + 1))} disabled={currentStepIndex === activeRoute.instructions.length - 1} className="flex-1 h-10 bg-indigo-600">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <Button onClick={handleSaveRoute} variant="outline" size="sm" className="text-xs h-10">
                <Save className="w-4 h-4" />
              </Button>
              <Button onClick={handleShareRoute} variant="outline" size="sm" className="text-xs h-10">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button onClick={() => setShowEventModal(true)} variant="outline" size="sm" className="text-xs h-10">
                <Users className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg p-2 text-center border">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-base font-bold text-indigo-600">{baseDistance.toFixed(1)}km</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center border">
                <p className="text-xs text-gray-500">Tempo</p>
                <p className="text-base font-bold text-purple-600">{Math.round((Date.now() - startTime) / 60000)}min</p>
              </div>
            </div>

            {routeCompleted && (
              <div className="mt-3 bg-green-50 border-2 border-green-400 rounded-lg p-3 text-center">
                <p className="font-bold text-green-700 mb-2">🎉 Chegou!</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleSaveRoute} size="sm" className="bg-green-600">
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button onClick={handleRouteComplete} size="sm" className="bg-emerald-600">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showEventModal && (
        <CreateEventFromRouteModal
          route={activeRoute}
          onClose={() => setShowEventModal(false)}
        />
      )}

      {showPostModal && (
        <CreatePostModal
          initialRoute={showPostModal}
          onClose={() => setShowPostModal(false)}
        />
      )}
    </>
  );
}
