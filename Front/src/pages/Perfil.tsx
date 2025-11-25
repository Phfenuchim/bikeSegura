
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, MapPin, Trophy, Edit2, Save, Heart, MessageCircle, Clock, Zap, Activity, Users, UserPlus, UserCheck, UserX, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import UserBadges from "../components/profile/UserBadges";
import UserStatistics from "../components/profile/UserStatistics";
import LevelProgress from "../components/profile/LevelProgress";
import WorkoutMapModal from "../components/feed/WorkoutMapModal";

const AVATAR_OPTIONS = [
  '🚴', '🚴‍♀️', '🚴‍♂️', '🚵', '🚵‍♀️', '🚵‍♂️',
  '🏃', '🏃‍♀️', '🏃‍♂️', '🤸', '🤸‍♀️', '🤸‍♂️',
  '🧑', '👨', '👩', '🧔', '👱', '🦸', '🦹', '🧙',
  '😎', '😊', '🤩', '🥳', '🤠', '👽', '🤖', '🐱',
  '🐶', '🐼', '🦁', '🦊', '🐻', '🐨', '🐯'
];

export default function PerfilPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchFriends, setSearchFriends] = useState("");
  const [friendsSubTab, setFriendsSubTab] = useState("meus-amigos");
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myPosts = [] } = useQuery({
    queryKey: ['my-posts', user?.email],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.WorkoutPost.filter({ user_email: user.email }, '-created_date');
    },
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['all-badges'],
    queryFn: () => base44.entities.Badge.list(),
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setIsEditing(false);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => base44.entities.WorkoutPost.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      alert("Treino excluído!");
    },
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (friendEmail) => {
      const updatedRequests = [...(user.friend_requests_sent || []), friendEmail];
      await base44.auth.updateMe({ friend_requests_sent: updatedRequests });
      
      const friend = allUsers.find(u => u.email === friendEmail);
      const friendRequests = [...(friend.friend_requests_received || []), user.email];
      await base44.entities.User.update(friend.id, { friend_requests_received: friendRequests });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      alert("✅ Solicitação enviada!");
    },
  });

  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (friendEmail) => {
      const updatedFriends = [...(user.friends || []), friendEmail];
      const updatedReceived = user.friend_requests_received.filter(email => email !== friendEmail);
      await base44.auth.updateMe({ 
        friends: updatedFriends,
        friend_requests_received: updatedReceived
      });
      
      const friend = allUsers.find(u => u.email === friendEmail);
      const friendUpdatedFriends = [...(friend.friends || []), user.email];
      const friendUpdatedSent = friend.friend_requests_sent.filter(email => email !== user.email);
      await base44.entities.User.update(friend.id, {
        friends: friendUpdatedFriends,
        friend_requests_sent: friendUpdatedSent
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      alert("✅ Amigo adicionado!");
    },
  });

  const rejectFriendRequestMutation = useMutation({
    mutationFn: async (friendEmail) => {
      const updatedReceived = user.friend_requests_received.filter(email => email !== friendEmail);
      await base44.auth.updateMe({ friend_requests_received: updatedReceived });
      
      const friend = allUsers.find(u => u.email === friendEmail);
      const friendUpdatedSent = friend.friend_requests_sent.filter(email => email !== user.email);
      await base44.entities.User.update(friend.id, { friend_requests_sent: friendUpdatedSent });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendEmail) => {
      const updatedFriends = user.friends.filter(email => email !== friendEmail);
      await base44.auth.updateMe({ friends: updatedFriends });
      
      const friend = allUsers.find(u => u.email === friendEmail);
      const friendUpdatedFriends = friend.friends.filter(email => email !== user.email);
      await base44.entities.User.update(friend.id, { friends: friendUpdatedFriends });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      alert("Amigo removido");
    },
  });

  const handleSaveBio = () => {
    updateUserMutation.mutate({ bio: editedBio });
  };

  const handleSelectAvatar = (avatar) => {
    updateUserMutation.mutate({ avatar });
    setShowAvatarPicker(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const points = user?.points || 0;

  const friendRequests = user?.friend_requests_received || [];
  const friends = user?.friends || [];
  const sentRequests = user?.friend_requests_sent || [];

  const filteredUsers = allUsers.filter(u => 
    u.email !== user?.email &&
    !friends.includes(u.email) &&
    !sentRequests.includes(u.email) &&
    !friendRequests.includes(u.email) && // Also exclude those who sent requests to current user
    (u.full_name?.toLowerCase().includes(searchFriends.toLowerCase()) ||
     u.email.toLowerCase().includes(searchFriends.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Profile */}
        <Card className="mb-8 overflow-hidden border-none shadow-xl">
          <div className="h-32 bg-gradient-to-r from-emerald-500 via-emerald-600 to-blue-600"></div>
          <CardContent className="relative pt-0 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
              {/* Avatar */}
              <div className="relative">
                <button
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white border-4 border-white shadow-2xl hover:scale-105 transition-transform active:scale-95 group relative"
                >
                  <span className="text-5xl">
                    {user?.avatar || user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </span>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Edit2 className="w-6 h-6 text-white" />
                  </div>
                </button>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <Trophy className="w-6 h-6 text-amber-900" />
                </div>

                {showAvatarPicker && (
                  <div className="absolute top-0 left-36 z-50 bg-white rounded-xl shadow-2xl border-4 border-emerald-200 p-4 w-80">
                    <h3 className="font-bold text-sm mb-3 text-gray-900">Escolha seu Avatar</h3>
                    <div className="grid grid-cols-7 gap-2 max-h-64 overflow-y-auto">
                      {AVATAR_OPTIONS.map((avatar, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectAvatar(avatar)}
                          className={`w-10 h-10 flex items-center justify-center text-2xl rounded-lg hover:bg-emerald-100 transition-colors active:scale-95 ${
                            user?.avatar === avatar ? 'bg-emerald-200 ring-2 ring-emerald-500' : 'bg-gray-50'
                          }`}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowAvatarPicker(false)}
                      className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium"
                    >
                      Fechar
                    </button>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {user?.full_name || user?.email?.split('@')[0]}
                </h1>
                <p className="text-gray-600 mb-3">{user?.email}</p>
                
                <LevelProgress level={level} xp={xp} />
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
                  <p className="text-2xl font-bold text-gray-900">{myPosts.length}</p>
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

        {/* Tabs Content */}
        <Tabs defaultValue="treinos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto">
            <TabsTrigger value="treinos">Treinos</TabsTrigger>
            <TabsTrigger value="amigos">
              Amigos
              {friendRequests.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{friendRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="sobre">Sobre</TabsTrigger>
          </TabsList>

          <TabsContent value="treinos">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-6 h-6 text-emerald-600" />
                  Meus Treinos ({myPosts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg mb-2">Nenhum treino publicado ainda</p>
                    <p className="text-gray-500 text-sm">Complete uma rota e compartilhe seu treino!</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="grid md:grid-cols-2 gap-4">
                      {myPosts.map((post) => (
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

                              <div className="bg-purple-50 rounded-lg p-2 text-center border border-purple-200">
                                <TrendingUp className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Pace</p>
                                <p className="text-sm font-bold text-purple-900">{post.pace_per_km || '--'}</p>
                              </div>

                              <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-200">
                                <Activity className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Elevação</p>
                                <p className="text-sm font-bold text-amber-900">{post.elevation_gain || 0}m</p>
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

                              <div className="flex gap-2">
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
                                <Button
                                  onClick={() => {
                                    if (confirm("Tem certeza que deseja excluir este treino?")) {
                                      deletePostMutation.mutate(post.id);
                                    }
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-red-600 hover:text-red-700"
                                >
                                  Excluir
                                </Button>
                              </div>
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

          <TabsContent value="amigos" className="space-y-6">
            {friendRequests.length > 0 && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    Solicitações Recebidas ({friendRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {friendRequests.map((email) => {
                    const requester = allUsers.find(u => u.email === email);
                    return (
                      <div key={email} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-300">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl">
                            {requester?.avatar || '👤'}
                          </div>
                          <div>
                            <a 
                              href={`/PerfilPublico?email=${email}`}
                              className="font-bold hover:text-blue-600 transition-colors"
                            >
                              {requester?.full_name || email.split('@')[0]}
                            </a>
                            <p className="text-xs text-gray-600">{email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => acceptFriendRequestMutation.mutate(email)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Aceitar
                          </Button>
                          <Button
                            onClick={() => rejectFriendRequestMutation.mutate(email)}
                            size="sm"
                            variant="outline"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card className="border-2 border-emerald-200">
              <CardHeader>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setFriendsSubTab("meus-amigos")}
                    variant={friendsSubTab === "meus-amigos" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Meus Amigos ({friends.length})
                  </Button>
                  <Button
                    onClick={() => setFriendsSubTab("pesquisar")}
                    variant={friendsSubTab === "pesquisar" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Pesquisar
                  </Button>
                  <Button
                    onClick={() => setFriendsSubTab("enviadas")}
                    variant={friendsSubTab === "enviadas" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Enviadas ({sentRequests.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {friendsSubTab === "meus-amigos" && (
                  <>
                    {friends.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg mb-2">Você ainda não tem amigos</p>
                        <p className="text-gray-500 text-sm mb-4">Pesquise e adicione ciclistas para acompanhar seus treinos</p>
                        <Button
                          onClick={() => setFriendsSubTab("pesquisar")}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Pesquisar Amigos
                        </Button>
                      </div>
                    ) : (
                      <ScrollArea className="h-96">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {friends.map((email) => {
                            const friendUser = allUsers.find(u => u.email === email);
                            return (
                              <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl">
                                    {friendUser?.avatar || '👤'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{friendUser?.full_name || email.split('@')[0]}</p>
                                    <p className="text-xs text-gray-600 truncate">{friendUser?.routes_completed || 0} rotas</p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => {
                                    if (confirm(`Remover ${friendUser?.full_name || email.split('@')[0]} dos amigos?`)) {
                                      removeFriendMutation.mutate(email);
                                    }
                                  }}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <UserX className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </>
                )}

                {friendsSubTab === "pesquisar" && (
                  <>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por nome ou email..."
                        value={searchFriends}
                        onChange={(e) => setSearchFriends(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {filteredUsers.length === 0 ? (
                          <div className="text-center py-12">
                            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">Nenhum usuário encontrado</p>
                          </div>
                        ) : (
                          filteredUsers.map((friendUser) => (
                            <div key={friendUser.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl">
                                  {friendUser.avatar || '👤'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold truncate">{friendUser.full_name || friendUser.email.split('@')[0]}</p>
                                  <p className="text-xs text-gray-600 truncate">{friendUser.email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      <Zap className="w-3 h-3 mr-1" />
                                      Nv {friendUser.level || 1}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {friendUser.routes_completed || 0} rotas
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={() => sendFriendRequestMutation.mutate(friendUser.email)}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </>
                )}

                {friendsSubTab === "enviadas" && (
                  <>
                    {sentRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg mb-2">Nenhuma solicitação enviada</p>
                        <p className="text-gray-500 text-sm">Adicione amigos para ver suas solicitações aqui</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-96">
                        <div className="space-y-2">
                          {sentRequests.map((email) => {
                            const requestedUser = allUsers.find(u => u.email === email);
                            return (
                              <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xl">
                                    {requestedUser?.avatar || '👤'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate">{requestedUser?.full_name || email.split('@')[0]}</p>
                                    <p className="text-xs text-gray-600 truncate">{email}</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-amber-700 border-amber-300">
                                  Aguardando...
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <UserBadges userBadges={user?.badges_earned || []} allBadges={allBadges} userStats={user} points={points} level={level} />
          </TabsContent>

          <TabsContent value="stats">
            <UserStatistics stats={user} />
          </TabsContent>

          <TabsContent value="sobre">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Sobre Mim</span>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(true);
                        setEditedBio(user?.bio || "");
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bio">Biografia</Label>
                      <Textarea
                        id="bio"
                        placeholder="Conte um pouco sobre você e sua paixão por pedalar..."
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value)}
                        rows={5}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveBio}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {user?.bio ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{user.bio}</p>
                    ) : (
                      <p className="text-gray-400 italic">
                        Você ainda não adicionou uma biografia. Clique em "Editar" para adicionar.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
