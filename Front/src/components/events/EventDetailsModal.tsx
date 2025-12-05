
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, TrendingUp, Clock, Navigation, Share2, UserPlus, Trophy, Dumbbell, AlertCircle } from "lucide-react";
import { format, isWithinInterval, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

import LiveLocationSharing from "../map/LiveLocationSharing";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000;
};

export default function EventDetailsModal({ event, onClose, isParticipant }) {
  const [userLocation, setUserLocation] = useState(null);
  const [canStart, setCanStart] = useState(false);
  const [distanceToStart, setDistanceToStart] = useState(null);
  const [isEventTime, setIsEventTime] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!userLocation || !event.route_data?.coordinates || event.route_data.coordinates.length === 0) {
      setCanStart(false);
      return;
    }

    const startCoord = event.route_data.coordinates[0];
    if (!startCoord || !startCoord.lat || !startCoord.lng) {
      setCanStart(false);
      return;
    }

    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      startCoord.lat,
      startCoord.lng
    );
    setDistanceToStart(distance);

    const now = new Date();
    const eventStart = new Date(event.start_date);
    const eventEnd = addHours(eventStart, 2);
    const withinTime = isWithinInterval(now, { start: eventStart, end: eventEnd });
    setIsEventTime(withinTime);

    setCanStart(distance <= 50);
  }, [userLocation, event]);

  const joinEventMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const updatedParticipants = [
        ...event.participants,
        {
          user_email: user.email,
          joined_at: new Date().toISOString(),
          status: "confirmado"
        }
      ];
      return base44.entities.RouteEvent.update(event.id, {
        participants: updatedParticipants
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-events'] });
      alert("✅ Você entrou no evento!");
      onClose();
    },
  });

  const startNavigation = () => {
    if (!canStart) {
      alert("❌ Você precisa estar a no máximo 50m do ponto de partida!");
      return;
    }

    if (event.route_data && event.route_data.coordinates) {
      const routeData = {
        coordinates: event.route_data.coordinates || [],
        distance_km: event.route_data.distance_km || 0,
        duration_minutes: event.route_data.duration_minutes || 0,
        start_address: event.route_data.start_address || "Ponto de Partida",
        end_address: event.route_data.end_address || "Chegada",
        name: event.name,
        eventId: event.id,
        isTraining: !isEventTime,
        instructions: event.route_data.instructions || [{
          text: `Navegando para ${event.route_data.end_address || 'chegada'}`,
          distance: event.route_data.distance_km?.toFixed(2) || '0',
          type: 'navigate'
        }]
      };
      sessionStorage.setItem('navigationRoute', JSON.stringify(routeData));
      navigate(createPageUrl("Mapa"));
    } else {
      alert("❌ Dados da rota não disponíveis");
    }
  };

  const shareEvent = async () => {
    const shareUrl = `${window.location.origin}?event=${event.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `Participe deste evento: ${event.name}`,
          url: shareUrl
        });
      } catch (error) {
        console.log("Compartilhamento cancelado");
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("📋 Link copiado!");
    }
  };

  const difficultyColors = {
    facil: "bg-green-100 text-green-800",
    moderada: "bg-yellow-100 text-yellow-800",
    dificil: "bg-red-100 text-red-800"
  };

  const statusColors = {
    agendado: "bg-blue-100 text-blue-800",
    em_andamento: "bg-purple-100 text-purple-800",
    concluido: "bg-gray-100 text-gray-800"
  };

  const eventMetrics = event.metrics?.filter(m => {
    const completedDate = new Date(m.completed_at);
    const eventStart = new Date(event.start_date);
    const eventEnd = addHours(eventStart, 2);
    return isWithinInterval(completedDate, { start: eventStart, end: eventEnd });
  }) || [];

  const trainingMetrics = event.metrics?.filter(m => {
    const completedDate = new Date(m.completed_at);
    const eventStart = new Date(event.start_date);
    const eventEnd = addHours(eventStart, 2);
    return !isWithinInterval(completedDate, { start: eventStart, end: eventEnd });
  }) || [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-2 flex-wrap">
            <Badge className={statusColors[event.status]}>
              {event.status === 'agendado' ? 'Agendado' :
               event.status === 'em_andamento' ? 'Em Andamento' : 'Concluído'}
            </Badge>
            <Badge className={difficultyColors[event.difficulty]}>
              {event.difficulty === 'facil' ? '😊 Fácil' :
               event.difficulty === 'moderada' ? '😐 Moderada' : '😰 Difícil'}
            </Badge>
            {event.tags?.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>

          {event.description && (
            <p className="text-gray-700">{event.description}</p>
          )}

          {isParticipant && distanceToStart !== null && (
            <Card className={`border-2 ${canStart ? 'border-green-400 bg-green-50' : 'border-orange-400 bg-orange-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className={`w-5 h-5 ${canStart ? 'text-green-600' : 'text-orange-600'}`} />
                  <div className="flex-1">
                    <p className={`font-bold ${canStart ? 'text-green-900' : 'text-orange-900'}`}>
                      {canStart ? '✅ Você pode iniciar!' : '📍 Distância do ponto de partida'}
                    </p>
                    <p className={`text-sm ${canStart ? 'text-green-700' : 'text-orange-700'}`}>
                      {canStart 
                        ? `Você está a ${distanceToStart.toFixed(0)}m do início` 
                        : `Você está a ${distanceToStart.toFixed(0)}m do início (máx. 50m)`}
                    </p>
                    {!isEventTime && canStart && (
                      <p className="text-sm text-blue-700 mt-1">
                        ℹ️ Fora do horário do evento. Será registrado como treino.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <p className="font-semibold text-gray-900">Data e Hora</p>
                </div>
                <p className="text-gray-700">
                  {format(new Date(event.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <p className="font-semibold text-gray-900">Participantes</p>
                </div>
                <p className="text-gray-700">
                  {event.participants.length}
                  {event.max_participants && ` / ${event.max_participants}`} pessoas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <p className="font-semibold text-gray-900">Distância</p>
                </div>
                <p className="text-gray-700">
                  {event.route_data?.distance_km?.toFixed(1) || '?'} km
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <p className="font-semibold text-gray-900">Duração</p>
                </div>
                <p className="text-gray-700">
                  {event.route_data?.duration_minutes || '?'} min
                </p>
              </CardContent>
            </Card>
          </div>

          {isParticipant && event.status === 'em_andamento' && (
            <LiveLocationSharing eventId={event.id} />
          )}

          {event.participants.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3">Participantes</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {event.participants.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {participant.user_email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{participant.user_email.split('@')[0]}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(participant.joined_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {participant.status === 'confirmado' ? '✓ Confirmado' :
                       participant.status === 'em_percurso' ? '🚴 Em Percurso' :
                       participant.status === 'concluido' ? '🏁 Concluído' : 'Desistiu'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(eventMetrics.length > 0 || trainingMetrics.length > 0) && (
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Métricas
              </h3>
              <Tabs defaultValue="event" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="event" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Prova ({eventMetrics.length})
                  </TabsTrigger>
                  <TabsTrigger value="training" className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" />
                    Treino ({trainingMetrics.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="event" className="space-y-2 mt-4">
                  {eventMetrics.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-8">Nenhuma métrica de prova ainda</p>
                  ) : (
                    eventMetrics.map((metric, index) => (
                      <Card key={index}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold">{metric.user_email.split('@')[0]}</p>
                            <div className="flex gap-4 text-sm">
                              <span>📏 {metric.distance_covered?.toFixed(1)} km</span>
                              <span>⏱️ {metric.time_elapsed} min</span>
                              {metric.completed_at && (
                                <span className="text-xs text-gray-500">
                                  {format(new Date(metric.completed_at), "dd/MM HH:mm", { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="training" className="space-y-2 mt-4">
                  {trainingMetrics.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-8">Nenhuma métrica de treino ainda</p>
                  ) : (
                    trainingMetrics.map((metric, index) => (
                      <Card key={index} className="border-blue-200">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold flex items-center gap-2">
                              {metric.user_email.split('@')[0]}
                              <Badge variant="outline" className="text-xs">Treino</Badge>
                            </p>
                            <div className="flex gap-4 text-sm">
                              <span>📏 {metric.distance_covered?.toFixed(1)} km</span>
                              <span>⏱️ {metric.time_elapsed} min</span>
                              {metric.completed_at && (
                                <span className="text-xs text-gray-500">
                                  {format(new Date(metric.completed_at), "dd/MM HH:mm", { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            {!isParticipant && event.status === 'agendado' && (
              <Button
                onClick={() => joinEventMutation.mutate()}
                disabled={joinEventMutation.isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Participar do Evento
              </Button>
            )}
            {isParticipant && event.route_data && (
              <Button
                onClick={startNavigation}
                disabled={!canStart}
                className={`flex-1 ${canStart ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                <Navigation className="w-4 h-4 mr-2" />
                {canStart ? 'Iniciar Navegação' : 'Aproxime-se do Início'}
              </Button>
            )}
            <Button
              onClick={shareEvent}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
