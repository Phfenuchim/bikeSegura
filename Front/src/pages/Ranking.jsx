import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, TrendingUp, Crown, Zap, Route, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RankingPage() {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: topUsers = [], isLoading } = useQuery({
    queryKey: ['top-users'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 50);
    },
  });

  const { data: topDistance = [] } = useQuery({
    queryKey: ['top-distance'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users
        .filter(u => u.total_distance_km > 0)
        .sort((a, b) => (b.total_distance_km || 0) - (a.total_distance_km || 0))
        .slice(0, 20);
    },
  });

  const { data: topRoutes = [] } = useQuery({
    queryKey: ['top-routes'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users
        .filter(u => u.routes_completed > 0)
        .sort((a, b) => (b.routes_completed || 0) - (a.routes_completed || 0))
        .slice(0, 20);
    },
  });

  const { data: topIncidentReporters = [] } = useQuery({
    queryKey: ['top-incident-reporters'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users
        .filter(u => u.incidents_reported > 0)
        .sort((a, b) => (b.incidents_reported || 0) - (a.incidents_reported || 0))
        .slice(0, 20);
    },
  });

  const { data: topSOSResponders = [] } = useQuery({
    queryKey: ['top-sos-responders'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users
        .filter(u => u.sos_responses > 0)
        .sort((a, b) => (b.sos_responses || 0) - (a.sos_responses || 0))
        .slice(0, 20);
    },
  });

  const getRankIcon = (position) => {
    if (position === 0) return <Crown className="w-6 h-6 text-amber-500" />;
    if (position === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="text-lg font-bold text-gray-400">#{position + 1}</span>;
  };

  const renderRankingList = (users, metricKey, unit = '') => {
    return (
      <div className="space-y-3">
        {users.map((user, index) => {
          const isCurrentUser = user.email === currentUser?.email;
          let metricValue;
          
          if (metricKey === 'points') {
            metricValue = user.points || 0;
          } else if (metricKey === 'total_distance_km') {
            metricValue = (user.total_distance_km || 0).toFixed(1);
          } else if (metricKey === 'routes_completed') {
            metricValue = user.routes_completed || 0;
          } else if (metricKey === 'incidents_reported') {
            metricValue = user.incidents_reported || 0;
          } else if (metricKey === 'sos_responses') {
            metricValue = user.sos_responses || 0;
          }

          return (
            <a
              key={user.id}
              href={`/PerfilPublico?email=${user.email}`}
              className={`block p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                isCurrentUser
                  ? 'border-emerald-400 bg-emerald-50'
                  : index === 0
                  ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50'
                  : 'border-gray-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 flex items-center justify-center">
                  {getRankIcon(index)}
                </div>

                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {user.avatar || user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 truncate">
                      {user.full_name || user.email?.split('@')[0]}
                    </h3>
                    {isCurrentUser && (
                      <Badge className="bg-emerald-100 text-emerald-700">Você</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-gray-500">
                      <Zap className="w-3 h-3 inline mr-1" />
                      Nv {user.level || 1}
                    </p>
                    {user.achievements && user.achievements.length > 0 && (
                      <p className="text-sm text-gray-500">
                        <Trophy className="w-3 h-3 inline mr-1" />
                        {user.achievements.length} conquistas
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">{metricValue}{unit}</p>
                  <p className="text-xs text-gray-500">
                    {metricKey === 'points' && 'pontos'}
                    {metricKey === 'total_distance_km' && 'km'}
                    {metricKey === 'routes_completed' && 'rotas'}
                    {metricKey === 'incidents_reported' && 'reportes'}
                    {metricKey === 'sos_responses' && 'ajudas'}
                  </p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏆 Leaderboards
          </h1>
          <p className="text-gray-600">
            Conheça os ciclistas que mais se destacam na comunidade
          </p>
        </div>

        <Tabs defaultValue="pontos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 max-w-4xl mx-auto">
            <TabsTrigger value="pontos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Pontos</span>
            </TabsTrigger>
            <TabsTrigger value="distancia" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Distância</span>
            </TabsTrigger>
            <TabsTrigger value="rotas" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Route className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Rotas</span>
            </TabsTrigger>
            <TabsTrigger value="reportes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="ajudas" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Award className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">SOS</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pontos">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Top Ciclistas por Pontos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderRankingList(topUsers, 'points')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distancia">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Top por Distância Percorrida
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderRankingList(topDistance, 'total_distance_km', ' km')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rotas">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5 text-purple-600" />
                  Top por Rotas Completadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderRankingList(topRoutes, 'routes_completed')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reportes">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Top Reportadores de Incidentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderRankingList(topIncidentReporters, 'incidents_reported')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ajudas">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-red-600" />
                  Top Respondedores SOS
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderRankingList(topSOSResponders, 'sos_responses')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}