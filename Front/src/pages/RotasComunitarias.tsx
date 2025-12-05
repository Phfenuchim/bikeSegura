
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Route,
  ThumbsUp,
  Share2,
  Navigation,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Send,
  ThumbsUp as ThumbsUpFilled,
  Map as MapIcon,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import RouteDetailsModal from "../components/routes/RouteDetailsModal";

const createIncidentIcon = (type, severity) => {
  const colors = {
    assalto: '#ef4444',
    obra: '#f97316',
    buraco: '#f59e0b',
    iluminacao_precaria: '#a855f7',
    outro: '#6b7280'
  };

  const color = colors[type] || colors.outro;

  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 0 0 0 1.73-3Z"/>
        </svg>
      </div>
    `,
    className: 'community-incident-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createSOSIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background: #ef4444;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(239,68,68,0.5);
        animation: pulse-sos 1.5s infinite;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <style>
        @keyframes pulse-sos {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      </style>
    `,
    className: 'community-sos-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// RouteCommentsSection component
function RouteCommentsSection({ routeId }) {
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['route-comments', routeId],
    queryFn: () => base44.entities.RouteComment.filter({ route_id: routeId }, '-created_date'),
    enabled: !!routeId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      return base44.entities.RouteComment.create(commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-comments', routeId] });
      // Invalidate route ratings to ensure average rating display is updated in the parent
      queryClient.invalidateQueries({ queryKey: ['route-ratings'] });
      setNewComment("");
      setNewRating(5);
    },
  });

  const markHelpfulMutation = useMutation({
    mutationFn: async (comment) => {
      const hasMarked = comment.helpful_by?.includes(user?.email);
      const newCount = hasMarked ? comment.helpful_count - 1 : comment.helpful_count + 1;
      const newHelpfulBy = hasMarked
        ? comment.helpful_by.filter(email => email !== user?.email)
        : [...(comment.helpful_by || []), user?.email];

      return base44.entities.RouteComment.update(comment.id, {
        helpful_count: newCount,
        helpful_by: newHelpfulBy
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-comments', routeId] });
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim() || !routeId) return;

    addCommentMutation.mutate({
      route_id: routeId,
      user_email: user?.email,
      comment: newComment,
      rating: newRating
    });
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Comentários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Avaliação:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewRating(star)}
                    className={`text-xl ${star <= newRating ? 'text-amber-500' : 'text-gray-300'}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Compartilhe sua experiência com esta rota..."
              rows={3}
              className="text-sm"
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addCommentMutation.isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 h-10"
            >
              <Send className="w-4 h-4 mr-2" />
              Comentar
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[45vh]">
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">Seja o primeiro a comentar!</p>
            ) : (
              comments.map((comment) => {
                const hasMarkedHelpful = comment.helpful_by?.includes(user?.email);
                return (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">
                          {comment.user_email?.split('@')[0]}
                        </p>
                        {comment.rating && (
                          <div className="flex gap-0.5 my-1">
                            {[...Array(comment.rating)].map((_, i) => (
                              <span key={i} className="text-amber-500 text-xs">⭐</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.created_date), "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{comment.comment}</p>
                    <Button
                      onClick={() => markHelpfulMutation.mutate(comment)}
                      variant={hasMarkedHelpful ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                    >
                      {hasMarkedHelpful ? <ThumbsUpFilled className="w-3 h-3 mr-1" /> : <ThumbsUp className="w-3 h-3 mr-1" />}
                      Útil ({comment.helpful_count || 0})
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function RotasComunitariasPage() {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState([-23.5505, -46.6333]);
  const [activeTab, setActiveTab] = useState("feed");
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Search and filter states
  const [searchText, setSearchText] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterMinDistance, setFilterMinDistance] = useState(0);
  const [filterMaxDistance, setFilterMaxDistance] = useState(100);
  const [filterMinRating, setFilterMinRating] = useState(0);
  const [filterTags, setFilterTags] = useState([]);
  const [sortBy, setSortBy] = useState("votes");

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['preferred-routes'],
    queryFn: () => base44.entities.PreferredRoute.list('-votes'),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.filter({ status: 'ativo' }, '-created_date'),
  });

  const { data: sosAlerts = [] } = useQuery({
    queryKey: ['sos-alerts'],
    queryFn: () => base44.entities.SOSAlert.filter({ status: ['ativo', 'ajuda_a_caminho'] }, '-created_date'),
  });

  const voteRouteMutation = useMutation({
    mutationFn: async (route) => {
      const hasVoted = route.voted_by?.includes(user.email);
      const newVotes = hasVoted ? route.votes - 1 : route.votes + 1;
      const newVotedBy = hasVoted
        ? route.voted_by.filter(email => email !== user.email)
        : [...(route.voted_by || []), user.email];

      return base44.entities.PreferredRoute.update(route.id, {
        votes: newVotes,
        voted_by: newVotedBy
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferred-routes'] });
    },
  });

  const useRouteMutation = useMutation({
    mutationFn: async (route) => {
      const routeWithInstructions = {
        coordinates: route.coordinates || [],
        distance_km: route.distance_km || 0,
        start_address: route.start_address || "Origem",
        end_address: route.end_address || "Destino",
        name: route.name || "Rota comunitária",
        instructions: route.instructions || [{
          text: `Navegando para ${route.end_address || 'destino'}`,
          distance: route.distance_km?.toFixed(2) || '0',
          type: 'navigate'
        }]
      };
      sessionStorage.setItem('navigationRoute', JSON.stringify(routeWithInstructions));
      window.location.href = '/Mapa';
    },
  });

  const { data: routeRatings = {} } = useQuery({
    queryKey: ['route-ratings'],
    queryFn: async () => {
      const allComments = await base44.entities.RouteComment.list();
      const ratingsMap = {};
      allComments.forEach(comment => {
        if (comment.rating && comment.route_id) {
          if (!ratingsMap[comment.route_id]) {
            ratingsMap[comment.route_id] = { total: 0, count: 0 };
          }
          ratingsMap[comment.route_id].total += comment.rating;
          ratingsMap[comment.route_id].count += 1;
        }
      });
      return ratingsMap;
    },
  });

  const handleViewRouteOnMap = (route) => {
    setSelectedRoute(route);
    setActiveTab("map");
    setShowOnlySelected(true);
    if (route.coordinates && Array.isArray(route.coordinates) && route.coordinates.length > 0) {
      const firstCoord = route.coordinates[0];
      if (firstCoord && typeof firstCoord.lat === 'number' && typeof firstCoord.lng === 'number') {
        setMapCenter([firstCoord.lat, firstCoord.lng]);
      }
    }
  };

  const topRoutes = routes.slice(0, 3);
  const recentIncidents = incidents.slice(0, 5);
  const activeSOS = sosAlerts.slice(0, 3);

  const routeColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

  const getRouteAverageRating = (routeId) => {
    const rating = routeRatings[routeId];
    if (!rating || rating.count === 0) return 0;
    return (rating.total / rating.count).toFixed(1);
  };

  const filteredRoutes = routes.filter(route => {
    if (searchText && !route.name.toLowerCase().includes(searchText.toLowerCase()) &&
        !route.description?.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }

    if (filterDifficulty !== "all" && route.difficulty !== filterDifficulty) {
      return false;
    }

    if (route.distance_km < filterMinDistance || route.distance_km > filterMaxDistance) {
      return false;
    }

    const avgRating = parseFloat(getRouteAverageRating(route.id));
    if (avgRating < filterMinRating) {
      return false;
    }

    if (filterTags.length > 0) {
      const routeTags = route.tags || [];
      const hasTag = filterTags.some(tag => routeTags.includes(tag));
      if (!hasTag) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === "votes") return (b.votes || 0) - (a.votes || 0);
    if (sortBy === "rating") {
      const ratingA = parseFloat(getRouteAverageRating(a.id));
      const ratingB = parseFloat(getRouteAverageRating(b.id));
      return ratingB - ratingA;
    }
    if (sortBy === "distance") return a.distance_km - b.distance_km;
    if (sortBy === "recent") return new Date(b.created_date) - new Date(a.created_date);
    return 0;
  });

  const allTags = ["ciclovia", "via_tranquila", "paisagem", "comercio", "parque"];

  const routesToDisplay = showOnlySelected && selectedRoute ? [selectedRoute] : filteredRoutes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Rotas da Comunidade</h1>
          <p className="text-gray-600 text-sm sm:text-base">Descubra rotas compartilhadas por outros ciclistas</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 border-2 border-emerald-200">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Input
                  placeholder="🔍 Buscar rotas por nome ou descrição..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Difficulty Filter */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Dificuldade</Label>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full h-10 px-3 border rounded-md text-sm"
                  >
                    <option value="all">Todas</option>
                    <option value="facil">Fácil</option>
                    <option value="moderada">Moderada</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>

                {/* Distance Range */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">
                    Distância: {filterMinDistance}-{filterMaxDistance} km
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filterMinDistance}
                      onChange={(e) => setFilterMinDistance(Number(e.target.value))}
                      className="h-10 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filterMaxDistance}
                      onChange={(e) => setFilterMaxDistance(Number(e.target.value))}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Avaliação Mínima</Label>
                  <select
                    value={filterMinRating}
                    onChange={(e) => setFilterMinRating(Number(e.target.value))}
                    className="w-full h-10 px-3 border rounded-md text-sm"
                  >
                    <option value="0">Todas</option>
                    <option value="3">⭐ 3+ estrelas</option>
                    <option value="4">⭐ 4+ estrelas</option>
                    <option value="4.5">⭐ 4.5+ estrelas</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Ordenar Por</Label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-10 px-3 border rounded-md text-sm"
                  >
                    <option value="votes">Mais Votadas</option>
                    <option value="rating">Melhor Avaliação</option>
                    <option value="distance">Menor Distância</option>
                    <option value="recent">Mais Recentes</option>
                  </select>
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <Label className="text-xs font-semibold mb-2 block">Filtrar por Tags</Label>
                <div className="flex gap-2 flex-wrap">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={filterTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setFilterTags(prev =>
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        );
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-sm text-gray-600">
                  <span className="font-bold">{filteredRoutes.length}</span> {filteredRoutes.length === 1 ? 'rota encontrada' : 'rotas encontradas'}
                </p>
                {(searchText || filterDifficulty !== "all" || filterMinDistance > 0 || filterMaxDistance < 100 || filterMinRating > 0 || filterTags.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchText("");
                      setFilterDifficulty("all");
                      setFilterMinDistance(0);
                      setFilterMaxDistance(100);
                      setFilterMinRating(0);
                      setFilterTags([]);
                      setSortBy("votes"); // Reset sort by default
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feed">Feed & Comentários</TabsTrigger>
            <TabsTrigger value="map">Mapa Comunitário</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-4 mb-6">
              {/* Top Rotas */}
              <Card className="border-2 border-emerald-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Top 3 Rotas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topRoutes.map((route, idx) => (
                    <div key={route.id} className="p-2 bg-emerald-50 rounded-lg cursor-pointer hover:bg-emerald-100" onClick={() => setSelectedRoute(route)}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-600'} text-white`}>
                          #{idx + 1}
                        </Badge>
                        <p className="font-bold text-sm flex-1 truncate">{route.name}</p>
                        <Badge variant="outline" className="text-xs">{route.votes} 👍</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Incidentes Recentes */}
              <Card className="border-2 border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Incidentes Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {recentIncidents.map((incident) => (
                        <div key={incident.id} className="p-2 bg-orange-50 rounded-lg text-xs">
                          <p className="font-bold text-gray-900">{incident.type}</p>
                          <p className="text-gray-600 text-xs">{format(new Date(incident.created_date), "dd/MM HH:mm", { locale: ptBR })}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* SOS Ativos */}
              <Card className="border-2 border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" />
                    SOS Ativos ({activeSOS.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {activeSOS.map((sos) => (
                        <div key={sos.id} className="p-2 bg-red-50 rounded-lg text-xs border border-red-200">
                          <p className="font-bold text-gray-900">{sos.user_name}</p>
                          <p className="text-gray-600 line-clamp-1">{sos.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{format(new Date(sos.created_date), "HH:mm", { locale: ptBR })}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Rotas e Comentários */}
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Lista de Rotas */}
              <div>
                <Card className="border-2 border-emerald-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Route className="w-5 h-5 text-emerald-600" />
                      Rotas ({filteredRoutes.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[60vh]">
                      <div className="space-y-3">
                        {filteredRoutes.map((route) => {
                          const hasVoted = route.voted_by?.includes(user?.email);
                          const avgRating = getRouteAverageRating(route.id);
                          const ratingCount = routeRatings[route.id]?.count || 0;

                          return (
                            <Card
                              key={route.id}
                              className={`cursor-pointer transition-all ${
                                selectedRoute?.id === route.id
                                  ? 'border-2 border-emerald-500 shadow-lg'
                                  : 'hover:border-emerald-300'
                              }`}
                              onClick={() => setSelectedRoute(route)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-bold text-gray-900 flex-1">{route.name}</h3>
                                  {avgRating > 0 && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="text-amber-500 font-bold text-sm">⭐ {avgRating}</span>
                                      <span className="text-xs text-gray-500">({ratingCount})</span>
                                    </div>
                                  )}
                                </div>

                                {route.description && (
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{route.description}</p>
                                )}

                                <div className="flex flex-wrap gap-2 mb-3">
                                  <Badge variant="outline" className="text-xs">{route.distance_km?.toFixed(1)} km</Badge>
                                  {route.difficulty && (
                                    <Badge className={`text-xs ${
                                      route.difficulty === 'facil' ? 'bg-green-500' :
                                      route.difficulty === 'moderada' ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}>
                                      {route.difficulty}
                                    </Badge>
                                  )}
                                  {route.tags?.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                  ))}
                                </div>

                                <div className="grid grid-cols-4 gap-1">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      voteRouteMutation.mutate(route);
                                    }}
                                    variant={hasVoted ? "default" : "outline"}
                                    size="sm"
                                    className="h-9 text-xs"
                                  >
                                    {hasVoted ? <ThumbsUpFilled className="w-3 h-3" /> : <ThumbsUp className="w-3 h-3" />}
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowDetailsModal(true);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="h-9 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                  >
                                    <Info className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewRouteOnMap(route);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="h-9 text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                                  >
                                    <MapIcon className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      useRouteMutation.mutate(route);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 h-9 text-xs"
                                    size="sm"
                                  >
                                    <Navigation className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Comentários e Detalhes (now using RouteCommentsSection) */}
              <div>
                {selectedRoute ? (
                  <RouteCommentsSection routeId={selectedRoute.id} />
                ) : (
                  <Card className="border-2 border-gray-200 h-full flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Selecione uma rota para ver os comentários</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            {showOnlySelected && selectedRoute && (
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-indigo-600 text-white">
                  <MapIcon className="w-3 h-3 mr-1" />
                  Visualizando: {selectedRoute.name}
                </Badge>
                <Button
                  onClick={() => setShowOnlySelected(false)}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                >
                  Ver Todas as Rotas
                </Button>
              </div>
            )}

            <Card className="border-2 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapIcon className="w-5 h-5 text-emerald-600" />
                  Mapa Comunitário
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {routesToDisplay.length} {routesToDisplay.length === 1 ? 'rota visualizada' : 'rotas visualizadas'}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[70vh] w-full">
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    className="h-full w-full rounded-b-lg"
                    zoomControl={true}
                    key={`${mapCenter[0]}-${mapCenter[1]}-${showOnlySelected}`}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Rotas Comunitárias */}
                    {routesToDisplay.map((route, index) => {
                      if (!route.coordinates || !Array.isArray(route.coordinates) || route.coordinates.length === 0) return null;
                      
                      const coords = route.coordinates
                        .filter(c => c && typeof c.lat === 'number' && typeof c.lng === 'number')
                        .map(c => [c.lat, c.lng]);
                      
                      if (coords.length < 2) return null;
                      
                      const color = routeColors[index % routeColors.length];
                      const avgRating = getRouteAverageRating(route.id);
                      const ratingCount = routeRatings[route.id]?.count || 0;
                      
                      return (
                        <Polyline
                          key={route.id}
                          positions={coords}
                          pathOptions={{
                            color: color,
                            weight: showOnlySelected ? 6 : 4,
                            opacity: showOnlySelected ? 1 : 0.7,
                            lineCap: "round",
                            lineJoin: "round"
                          }}
                        >
                          <Popup>
                            <div className="p-2 min-w-[200px]">
                              <h3 className="font-bold text-sm mb-1">{route.name}</h3>
                              {avgRating > 0 && (
                                <div className="flex items-center gap-1 mb-2">
                                  <span className="text-amber-500 font-bold text-sm">⭐ {avgRating}</span>
                                  <span className="text-xs text-gray-500">({ratingCount} avaliações)</span>
                                </div>
                              )}
                              {route.description && (
                                <p className="text-xs text-gray-600 mb-2">{route.description}</p>
                              )}
                              <div className="flex gap-2 text-xs mb-2">
                                <Badge variant="outline">{route.distance_km?.toFixed(1)} km</Badge>
                                <Badge variant="outline">👍 {route.votes || 0}</Badge>
                                {route.difficulty && (
                                  <Badge className={`text-xs ${
                                    route.difficulty === 'facil' ? 'bg-green-500' :
                                    route.difficulty === 'moderada' ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}>
                                    {route.difficulty}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                onClick={() => {
                                  setSelectedRoute(route);
                                  setActiveTab("feed");
                                }}
                                size="sm"
                                className="w-full mt-2 h-8 text-xs"
                              >
                                Ver Detalhes
                              </Button>
                            </div>
                          </Popup>
                        </Polyline>
                      );
                    })}

                    {/* Incidentes */}
                    {incidents.map((incident) => {
                      if (!incident || typeof incident.latitude !== 'number' || typeof incident.longitude !== 'number') return null;
                      
                      return (
                        <Marker
                          key={incident.id}
                          position={[incident.latitude, incident.longitude]}
                          icon={createIncidentIcon(incident.type, incident.severity)}
                        >
                          <Popup>
                            <div className="p-1 text-xs">
                              <p className="font-bold">{incident.type}</p>
                              {incident.description && (
                                <p className="text-gray-600 text-xs">{incident.description}</p>
                              )}
                              <Badge className="mt-1 text-xs">{incident.severity}</Badge>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                    {/* SOS Alerts */}
                    {sosAlerts.map((sos) => {
                      if (!sos || typeof sos.latitude !== 'number' || typeof sos.longitude !== 'number') return null;
                      
                      return (
                        <Marker
                          key={sos.id}
                          position={[sos.latitude, sos.longitude]}
                          icon={createSOSIcon()}
                        >
                          <Popup>
                            <div className="p-2 text-xs">
                              <p className="font-bold text-red-600 mb-1">🆘 SOS Ativo</p>
                              <p className="font-semibold">{sos.user_name}</p>
                              {sos.description && (
                                <p className="text-gray-600 text-xs mt-1">{sos.description}</p>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            {/* Legenda */}
            <Card className="border-2 border-gray-200">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm mb-3">Legendas das Rotas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {routesToDisplay.slice(0, 9).map((route, index) => {
                    const avgRating = getRouteAverageRating(route.id);
                    return (
                      <button
                        key={route.id}
                        onClick={() => handleViewRouteOnMap(route)}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                          selectedRoute?.id === route.id 
                            ? 'bg-emerald-100 border-2 border-emerald-500' 
                            : 'hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: routeColors[index % routeColors.length] }}
                        />
                        <span className="text-sm font-medium text-gray-900 truncate flex-1 text-left">
                          {route.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {avgRating > 0 && (
                            <span className="text-xs text-amber-500">⭐ {avgRating}</span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {route.distance_km?.toFixed(1)}km
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {routesToDisplay.length > 9 && (
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    + {routesToDisplay.length - 9} rotas não exibidas na legenda
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showDetailsModal && selectedRoute && (
        <RouteDetailsModal
          route={selectedRoute}
          onClose={() => setShowDetailsModal(false)}
          onNavigate={() => useRouteMutation.mutate(selectedRoute)}
          avgRating={parseFloat(getRouteAverageRating(selectedRoute.id))}
          ratingCount={routeRatings[selectedRoute.id]?.count || 0}
        />
      )}
    </div>
  );
}
