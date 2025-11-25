
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Calendar, Users, MapPin, TrendingUp, Clock, Plus, Play, Share2, CheckCircle, Map as MapIcon, List } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import CreateRouteEventModal from "../components/events/CreateRouteEventModal";
import EventDetailsModal from "../components/events/EventDetailsModal";
import LiveParticipantTracker from "../components/events/LiveParticipantTracker";

export default function EventosDeRotasPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mapCenter, setMapCenter] = useState([-23.5505, -46.6333]);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['route-events'],
    queryFn: () => base44.entities.RouteEvent.list('-start_date', 50),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const joinEventMutation = useMutation({
    mutationFn: async (eventId) => {
      const event = events.find(e => e.id === eventId);
      const user = await base44.auth.me();
      
      const updatedParticipants = [
        ...event.participants,
        {
          user_email: user.email,
          joined_at: new Date().toISOString(),
          status: "confirmado"
        }
      ];

      return base44.entities.RouteEvent.update(eventId, {
        participants: updatedParticipants
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-events'] });
      alert("✅ Você entrou no evento!");
    },
  });

  const shareEvent = async (event) => {
    const shareUrl = `${window.location.origin}?event=${event.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `Participe deste evento de ciclismo: ${event.name}`,
          url: shareUrl
        });
      } catch (error) {
        console.log("Compartilhamento cancelado");
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("📋 Link copiado para a área de transferência!");
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || event.status === filterStatus;
    
    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
      const eventDate = new Date(event.start_date);
      
      if (filterStartDate) {
        const start = startOfDay(new Date(filterStartDate));
        matchesDate = matchesDate && (isAfter(eventDate, start) || eventDate.toDateString() === start.toDateString());
      }
      
      if (filterEndDate) {
        const end = endOfDay(new Date(filterEndDate));
        matchesDate = matchesDate && (isBefore(eventDate, end) || eventDate.toDateString() === end.toDateString());
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const upcomingEvents = filteredEvents.filter(e => e.status === 'agendado');
  const activeEvents = filteredEvents.filter(e => e.status === 'em_andamento');
  const completedEvents = filteredEvents.filter(e => e.status === 'concluido');

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

  const statusLabels = {
    agendado: "Agendado",
    em_andamento: "Em Andamento",
    concluido: "Concluído"
  };

  const isParticipant = (event) => {
    return user && event.participants.some(p => p.user_email === user.email);
  };

  const eventColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#f97316', '#a855f7', '#6366f1', '#22c55e'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🚴 Eventos de Rotas
            </h1>
            <p className="text-gray-600">
              Participe de pedaladas em grupo e compartilhe experiências
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Evento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Agendados</p>
                  <p className="text-2xl font-bold text-blue-600">{upcomingEvents.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Em Andamento</p>
                  <p className="text-2xl font-bold text-purple-600">{activeEvents.length}</p>
                </div>
                <Play className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold text-green-600">{completedEvents.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Participantes</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {events.reduce((sum, e) => sum + e.participants.length, 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-2 border-emerald-200">
          <CardContent className="p-4">
            <div className="space-y-4">
              <Input
                placeholder="🔍 Buscar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Data Início</Label>
                  <Input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="h-10"
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Data Fim</Label>
                  <Input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs font-semibold mb-2 block">Status</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={filterStatus === "all" ? "default" : "outline"}
                      onClick={() => setFilterStatus("all")}
                      size="sm"
                      className="flex-1 h-10"
                    >
                      Todos
                    </Button>
                    <Button
                      variant={filterStatus === "agendado" ? "default" : "outline"}
                      onClick={() => setFilterStatus("agendado")}
                      size="sm"
                      className="flex-1 h-10"
                    >
                      Agendados
                    </Button>
                    <Button
                      variant={filterStatus === "em_andamento" ? "default" : "outline"}
                      onClick={() => setFilterStatus("em_andamento")}
                      size="sm"
                      className="flex-1 h-10"
                    >
                      Ativos
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-sm text-gray-600">
                  <span className="font-bold">{filteredEvents.length}</span> {filteredEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
                </p>
                {(searchQuery || filterStatus !== "all" || filterStartDate || filterEndDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStatus("all");
                      setFilterStartDate("");
                      setFilterEndDate("");
                    }}
                    className="text-xs"
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapIcon className="w-4 h-4" />
              Mapa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {filteredEvents.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">Nenhum evento encontrado</p>
                <p className="text-gray-500 text-sm mb-4">
                  Ajuste os filtros ou seja o primeiro a criar um evento!
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Evento
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="hover:shadow-2xl transition-shadow cursor-pointer border-2 hover:border-emerald-400"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl line-clamp-1">{event.name}</CardTitle>
                        <Badge className={statusColors[event.status]}>
                          {statusLabels[event.status]}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">
                          {format(new Date(event.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>{event.route_data.distance_km?.toFixed(1) || '?'} km</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold">{event.participants.length} participantes</span>
                        {event.max_participants && (
                          <span className="text-gray-500">/ {event.max_participants}</span>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Badge className={difficultyColors[event.difficulty]}>
                          {event.difficulty === 'facil' ? '😊 Fácil' :
                           event.difficulty === 'moderada' ? '😐 Moderada' :
                           '😰 Difícil'}
                        </Badge>
                        {event.tags?.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        {isParticipant(event) ? (
                          <Badge className="bg-green-500 text-white w-full justify-center py-2">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Participando
                          </Badge>
                        ) : event.status === 'agendado' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              joinEventMutation.mutate(event.id);
                            }}
                            disabled={joinEventMutation.isLoading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Participar
                          </Button>
                        )}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            shareEvent(event);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Compartilhar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="map">
            <Card className="border-2 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-emerald-600" />
                  Mapa de Eventos com Localização ao Vivo
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredEvents.length} {filteredEvents.length === 1 ? 'evento visualizado' : 'eventos visualizados'}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[70vh] w-full">
                  <MapContainer
                    center={mapCenter}
                    zoom={12}
                    className="h-full w-full rounded-b-lg"
                    zoomControl={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {filteredEvents.map((event, index) => {
                      if (!event.route_data?.coordinates || event.route_data.coordinates.length === 0) return null;
                      
                      const coords = event.route_data.coordinates.map(c => [c.lat || c[0], c.lng || c[1]]);
                      const color = eventColors[index % eventColors.length];
                      
                      return (
                        <React.Fragment key={event.id}>
                          <Polyline
                            positions={coords}
                            pathOptions={{
                              color: color,
                              weight: 4,
                              opacity: 0.7,
                              lineCap: "round",
                              lineJoin: "round"
                            }}
                          >
                            <Popup>
                              <div className="p-2 min-w-[220px]">
                                <h3 className="font-bold text-base mb-2">{event.name}</h3>
                                <div className="space-y-2 mb-3">
                                  <div className="flex items-center gap-2 text-xs">
                                    <Calendar className="w-3 h-3 text-blue-600" />
                                    <span>{format(new Date(event.start_date), "dd/MM HH:mm", { locale: ptBR })}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <Users className="w-3 h-3 text-purple-600" />
                                    <span>{event.participants.length} participantes</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <MapPin className="w-3 h-3 text-emerald-600" />
                                    <span>{event.route_data.distance_km?.toFixed(1)} km</span>
                                  </div>
                                </div>
                                <Badge className={statusColors[event.status]} size="sm">
                                  {statusLabels[event.status]}
                                </Badge>
                                <Button
                                  onClick={() => setSelectedEvent(event)}
                                  size="sm"
                                  className="w-full mt-2 h-8 text-xs"
                                >
                                  Ver Detalhes
                                </Button>
                              </div>
                            </Popup>
                          </Polyline>

                          <Marker position={coords[0]}>
                            <Popup>
                              <div className="text-center text-sm">
                                <p className="font-bold text-blue-600">🚴 Início</p>
                                <p className="text-xs text-gray-600">{event.name}</p>
                              </div>
                            </Popup>
                          </Marker>

                          <Marker position={coords[coords.length - 1]}>
                            <Popup>
                              <div className="text-center text-sm">
                                <p className="font-bold text-emerald-600">🎯 Chegada</p>
                                <p className="text-xs text-gray-600">{event.name}</p>
                              </div>
                            </Popup>
                          </Marker>
                        </React.Fragment>
                      );
                    })}

                    {filteredEvents.map((event) => (
                      <LiveParticipantTracker
                        key={event.id}
                        eventId={event.id}
                        allUsers={allUsers}
                      />
                    ))}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            {/* Legenda */}
            <Card className="mt-4 border-2 border-gray-200">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm mb-3">Legendas dos Eventos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredEvents.slice(0, 9).map((event, index) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-gray-100 border-2 border-transparent hover:border-emerald-300"
                    >
                      <div 
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: eventColors[index % eventColors.length] }}
                      />
                      <span className="text-sm font-medium text-gray-900 truncate flex-1 text-left">
                        {event.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                          <Badge className={`${statusColors[event.status]} text-xs`} variant="outline">
                          {event.status === 'agendado' ? '📅' : event.status === 'em_andamento' ? '▶️' : '✓'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.route_data?.distance_km?.toFixed(1)}km
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
                {filteredEvents.length > 9 && (
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    + {filteredEvents.length - 9} eventos não exibidos na legenda
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showCreateModal && (
        <CreateRouteEventModal
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          isParticipant={isParticipant(selectedEvent)}
        />
      )}
    </div>
  );
}
