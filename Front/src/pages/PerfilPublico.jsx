import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Trophy, Activity, MapPin, Clock, Heart, MessageCircle, Zap, UserPlus, UserMinus, ArrowLeft, Users, Route } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import WorkoutMapModal from "../components/feed/WorkoutMapModal";
import UserBadges from "../components/profile/UserBadges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PerfilPublicoPage() {
  const [selectedPost, setSelectedPost] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const userEmail = urlParams.get('email');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profileUser, isLoading } = useQuery({
    queryKey: ['user-profile', userEmail],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: userEmail });
      return users[0];
    },
    enabled: !!userEmail,
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['user-public-posts', userEmail],
    queryFn: async () => {
      const allPosts = await base44.entities.WorkoutPost.filter({ user_email: userEmail }, '-created_date');
      return allPosts.filter(post => post.visibility === 'public');
    },
    enabled: !!userEmail,
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['all-badges'],
    queryFn: () => base44.entities.Badge.list(),
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async () => {
      const updatedSent = [...(currentUser.friend_requests_sent || []), userEmail];
      await base44.auth.updateMe({ friend_requests_sent: updatedSent });
      
      const updatedReceived = [...(profileUser.friend_requests_received || []), currentUser.email];
      await base44.entities.User.update(profileUser.id, { friend_requests_received: updatedReceived });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', userEmail] });
      alert("✅ Solicitação enviada!");
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async () => {
      const updatedFriends = (currentUser.friends || []).filter(email => email !== userEmail);
      await base44.auth.updateMe({ friends: updatedFriends });
      
      const updatedProfileFriends = (profileUser.friends || []).filter(email => email !== currentUser.email);
      await base44.entities.User.update(profileUser.id, { friends: updatedProfileFriends });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', userEmail] });
      alert("❌ Amigo removido");
    },
  });

  if (isLoading || !userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Usuário não encontrado</p>
      </div>
    );
  }

  const level = profileUser?.level || 1;
  const points = profileUser?.points || 0;
  const xp = profileUser?.xp || 0;
  const isFriend = currentUser?.friends?.includes(userEmail);
  const requestSent = currentUser?.friend_requests_sent?.includes(userEmail);
  const isOwnProfile = currentUser?.email === userEmail;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => window.history.back()}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Header Profile */}
        <Card className="mb-8 overflow-hidden border-none shadow-xl">
          <div className="h-32 bg-gradient-to-r from-emerald-500 via-emerald-600 to-blue-600"></div>
          <CardContent className="relative pt-0 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white border-4 border-white shadow-2xl">
                  <span className="text-5xl">
                    {profileUser?.avatar || profileUser?.full_name?.charAt(0).toUpperCase() || profileUser?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <Trophy className="w-6 h-6 text-amber-900" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {profileUser?.full_name || profileUser?.email?.split('@')[0]}
                </h1>
                <p className="text-gray-600 mb-3">{profileUser?.email}</p>
                {profileUser?.bio && (
                  <p className="text-gray-700 mb-3 max-w-2xl">{profileUser.bio}</p>
                )}
                
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-indigo-100 text-indigo-800 px-3 py-1">
                    <Zap className="w-4 h-4 mr-1" />
                    Nível {level}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
                    {xp} XP
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1">
                    <Route className="w-4 h-4 mr-1" />
                    {profileUser.routes_completed || 0} rotas
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                    <Users className="w-4 h-4 mr-1" />
                    {profileUser.friends?.length || 0} amigos
                  </Badge>
                </div>
                
                {!isOwnProfile && (
                  <div className="flex gap-2 mt-3">
                    {isFriend ? (
                      <Button
                        onClick={() => {
                          if (confirm("Remover dos amigos?")) {
                            removeFriendMutation.mutate();
                          }
                        }}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remover Amigo
                      </Button>
                    ) : requestSent ? (
                      <Button disabled variant="outline">
                        <Clock className="w-4 h-4 mr-2" />
                        Solicitação Enviada
                      </Button>
                    ) : (
                      <Button
                        onClick={() => sendFriendRequestMutation.mutate()}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Adicionar Amigo
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 md:gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-2">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{points}</p>
                  <p className="text-xs text-gray-500">Pontos</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                    <Activity className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{userPosts.length}</p>
                  <p className="text-xs text-gray-500">Treinos</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{level}</p>
                  <p className="text-xs text-gray-500">Nível</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="treinos" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="treinos">Treinos ({userPosts.length})</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="treinos">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-6 h-6 text-emerald-600" />
                  Treinos Públicos ({userPosts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Nenhum treino público ainda</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="grid md:grid-cols-2 gap-4">
                      {userPosts.map((post) => (
                        <Card key={post.id} className="border-2 hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm text-gray-600">
                                {format(new Date(post.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                              {post.xp_earned > 0 && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  <Zap className="w-3 h-3 mr-1" />
                                  +{post.xp_earned} XP
                                </Badge>
                              )}
                            </div>

                            {post.caption && (
                              <p className="text-gray-700 mb-3 text-sm">{post.caption}</p>
                            )}

                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-200">
                                <MapPin className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Distância</p>
                                <p className="text-lg font-bold text-emerald-900">{post.distance_km.toFixed(1)} km</p>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-200">
                                <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Duração</p>
                                <p className="text-lg font-bold text-blue-900">{post.duration_minutes} min</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t">
                              <div className="flex gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
                                  {post.likes?.length || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  {post.comments?.length || 0}
                                </span>
                              </div>
                              {post.route_coordinates && post.route_coordinates.length > 0 && (
                                <Button
                                  onClick={() => setSelectedPost(post)}
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                >
                                  <MapPin className="w-3 h-3 mr-1" />
                                  Mapa
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <UserBadges 
              userBadges={profileUser?.badges_earned || []} 
              allBadges={allBadges} 
              userStats={profileUser} 
              points={points} 
              level={level} 
            />
          </TabsContent>
        </Tabs>
      </div>

      {selectedPost && (
        <WorkoutMapModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}