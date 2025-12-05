
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Heart, 
  MessageCircle, 
  MapPin, 
  TrendingUp, 
  Clock, 
  Zap,
  Users,
  Award,
  Send,
  Activity,
  Lock,
  Globe,
  UserCheck,
  Image as ImageIcon,
  X
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import WorkoutMapModal from "../components/feed/WorkoutMapModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function FeedPage() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [activeTab, setActiveTab] = useState("seguindo");
  const [expandedImage, setExpandedImage] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: followingPosts = [] } = useQuery({
    queryKey: ['following-posts'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      const allPosts = await base44.entities.WorkoutPost.list('-created_date', 100);
      return allPosts.filter(post => 
        post.user_email === currentUser.email ||
        (post.visibility === 'friends' && currentUser.friends?.includes(post.user_email)) ||
        (post.visibility === 'specific' && post.shared_with?.includes(currentUser.email))
      );
    },
    enabled: !!user,
  });

  const { data: explorePosts = [] } = useQuery({
    queryKey: ['explore-posts'],
    queryFn: async () => {
      return base44.entities.WorkoutPost.filter({ visibility: 'public' }, '-created_date', 100);
    },
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const posts = activeTab === "seguindo" ? followingPosts : explorePosts;

  const likePostMutation = useMutation({
    mutationFn: async (postId) => {
      const post = posts.find(p => p.id === postId);
      const hasLiked = post.likes?.includes(user.email);
      const newLikes = hasLiked
        ? post.likes.filter(email => email !== user.email)
        : [...(post.likes || []), user.email];
      
      return base44.entities.WorkoutPost.update(postId, { likes: newLikes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following-posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, text }) => {
      const post = posts.find(p => p.id === postId);
      const newComment = {
        user_email: user.email,
        text: text,
        created_at: new Date().toISOString()
      };
      const updatedComments = [...(post.comments || []), newComment];
      
      return base44.entities.WorkoutPost.update(postId, { comments: updatedComments });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['following-posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      setCommentText(prev => ({ ...prev, [variables.postId]: '' }));
    },
  });

  const getVisibilityBadge = (visibility) => {
    const badges = {
      private: { icon: Lock, text: "Privado", color: "bg-gray-500" },
      specific: { icon: UserCheck, text: "Amigos Específicos", color: "bg-blue-500" },
      friends: { icon: Users, text: "Amigos", color: "bg-emerald-500" },
      public: { icon: Globe, text: "Público", color: "bg-indigo-500" }
    };
    
    const badge = badges[visibility] || badges.friends;
    const Icon = badge.icon;
    
    return (
      <Badge className={`${badge.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </Badge>
    );
  };

  const renderPostCard = (post) => {
    const postUser = allUsers.find(u => u.email === post.user_email);
    const hasLiked = post.likes?.includes(user?.email);
    const isOwnPost = post.user_email === user?.email;
    const sortedComments = [...(post.comments || [])].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    return (
      <Card key={post.id} className="hover:shadow-2xl transition-shadow border-2 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl">
                {postUser?.avatar || '🚴'}
              </div>
              <div>
                {activeTab === "explorar" || !isOwnPost ? (
                  <a 
                    href={`/PerfilPublico?email=${post.user_email}`}
                    className="font-bold text-gray-900 hover:text-emerald-600 transition-colors"
                  >
                    {postUser?.full_name || post.user_email.split('@')[0]}
                  </a>
                ) : (
                  <p className="font-bold text-gray-900">{postUser?.full_name || post.user_email.split('@')[0]}</p>
                )}
                <p className="text-xs text-gray-500">
                  {format(new Date(post.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isOwnPost && getVisibilityBadge(post.visibility)}
              {post.xp_earned > 0 && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Zap className="w-3 h-3 mr-1" />
                  +{post.xp_earned} XP
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {post.caption && (
            <p className="text-gray-700">{post.caption}</p>
          )}

          {post.photos && post.photos.length > 0 && (
            <div className={`grid gap-2 ${post.photos.length === 1 ? 'grid-cols-1' : post.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
              {post.photos.slice(0, 4).map((photo, idx) => (
                <div
                  key={idx}
                  onClick={() => setExpandedImage(photo)}
                  className="relative cursor-pointer group overflow-hidden rounded-lg aspect-square bg-gray-100"
                >
                  <img
                    src={photo}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {idx === 3 && post.photos.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <p className="text-white font-bold text-2xl">+{post.photos.length - 4}</p>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-3 text-center">
                <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Distância</p>
                <p className="text-lg font-bold text-emerald-900">{post.distance_km.toFixed(1)} km</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 text-center">
                <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Duração</p>
                <p className="text-lg font-bold text-blue-900">{post.duration_minutes} min</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-3 text-center">
                <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Pace</p>
                <p className="text-lg font-bold text-purple-900">{post.pace_per_km || '--'}</p>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3 text-center">
                <Activity className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Elevação</p>
                <p className="text-lg font-bold text-amber-900">{post.elevation_gain || 0}m</p>
              </CardContent>
            </Card>
          </div>

          {post.tagged_users && post.tagged_users.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Com:</span>
              {post.tagged_users.map(email => {
                const taggedUser = allUsers.find(u => u.email === email);
                return (
                  <Badge key={email} variant="outline" className="text-xs">
                    {taggedUser?.full_name || email.split('@')[0]}
                  </Badge>
                );
              })}
            </div>
          )}

          {post.route_coordinates && post.route_coordinates.length > 0 && (
            <Button
              onClick={() => setSelectedPost(post)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Ver Trajeto no Mapa
            </Button>
          )}

          <div className="flex items-center gap-4 pt-3 border-t">
            <Button
              onClick={() => likePostMutation.mutate(post.id)}
              variant="ghost"
              size="sm"
              className={hasLiked ? 'text-red-600' : 'text-gray-600'}
            >
              <Heart className={`w-5 h-5 mr-2 ${hasLiked ? 'fill-current' : ''}`} />
              {post.likes?.length || 0}
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <MessageCircle className="w-5 h-5 mr-2" />
              {post.comments?.length || 0}
            </Button>
          </div>

          {sortedComments.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <ScrollArea className="max-h-60">
                {sortedComments.map((comment, idx) => {
                  const commentUser = allUsers.find(u => u.email === comment.user_email);
                  return (
                    <div key={idx} className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg mb-2 border">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-bold text-sm">{commentUser?.full_name || comment.user_email.split('@')[0]}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(comment.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Adicionar comentário..."
              value={commentText[post.id] || ''}
              onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
              className="flex-1"
            />
            <Button
              onClick={() => addCommentMutation.mutate({ postId: post.id, text: commentText[post.id] })}
              disabled={!commentText[post.id]?.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🚴 Feed de Treinos</h1>
            <p className="text-gray-600">Acompanhe os treinos dos seus amigos e da comunidade</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-600 text-white px-4 py-2">
              <Award className="w-4 h-4 mr-2" />
              {user?.points || 0} pts
            </Badge>
            <Badge className="bg-indigo-600 text-white px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              {user?.xp || 0} XP
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="seguindo">
              <Users className="w-4 h-4 mr-2" />
              Seguindo ({followingPosts.length})
            </TabsTrigger>
            <TabsTrigger value="explorar">
              <Globe className="w-4 h-4 mr-2" />
              Explorar ({explorePosts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seguindo">
            {followingPosts.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">Nenhum treino ainda</p>
                <p className="text-gray-500 text-sm mb-4">Complete uma rota e compartilhe seu treino ou adicione amigos!</p>
                <Button onClick={() => window.location.href = '/Perfil'} className="bg-emerald-600 hover:bg-emerald-700">
                  <Users className="w-4 h-4 mr-2" />
                  Adicionar Amigos
                </Button>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {followingPosts.map(renderPostCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="explorar">
            {explorePosts.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">Nenhum treino público ainda</p>
                <p className="text-gray-500 text-sm">Seja o primeiro a publicar um treino público!</p>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {explorePosts.map(renderPostCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedPost && (
        <WorkoutMapModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {expandedImage && (
        <Dialog open={true} onOpenChange={() => setExpandedImage(null)}>
          <DialogContent className="max-w-6xl max-h-[95vh] p-0 border-none">
            <div className="relative w-full h-[95vh] bg-black">
              <Button
                onClick={() => setExpandedImage(null)}
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>
              <img
                src={expandedImage}
                alt="Foto expandida"
                className="w-full h-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
