
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Clock, TrendingUp, Zap, Users, X } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function CreatePostModal({ initialRoute, onClose }) {
  const [caption, setCaption] = useState("");
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [visibility, setVisibility] = useState("friends");
  const [selectedSpecificFriends, setSelectedSpecificFriends] = useState([]);
  const [searchTag, setSearchTag] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const calculateXPAndPoints = (distance, duration) => {
    const baseXP = Math.floor(distance * 10);
    const timeBonus = duration < 60 ? 20 : 10;
    const xp = baseXP + timeBonus;
    const points = Math.floor(distance * 5);
    return { xp, points };
  };

  const calculatePace = (distance, duration) => {
    if (!distance || !duration) return "--:--";
    const paceMinutes = duration / distance;
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.floor((paceMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  };

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      const { xp, points } = calculateXPAndPoints(initialRoute.distance_km, initialRoute.duration_minutes);
      
      await base44.auth.updateMe({
        points: (user.points || 0) + points,
        xp: (user.xp || 0) + xp,
        routes_completed: (user.routes_completed || 0) + 1,
        total_distance_km: (user.total_distance_km || 0) + initialRoute.distance_km,
        total_duration_minutes: (user.total_duration_minutes || 0) + initialRoute.duration_minutes,
        level: Math.floor(((user.xp || 0) + xp) / 100) + 1
      });

      return base44.entities.WorkoutPost.create({
        ...postData,
        xp_earned: xp,
        points_earned: points
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-posts'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      alert("✅ Treino publicado com sucesso!");
      onClose();
    },
  });

  const handleSubmit = () => {
    const pace = calculatePace(initialRoute.distance_km, initialRoute.duration_minutes);
    
    createPostMutation.mutate({
      user_email: user.email,
      route_name: initialRoute.name,
      route_coordinates: initialRoute.coordinates || [],
      distance_km: initialRoute.distance_km,
      duration_minutes: initialRoute.duration_minutes,
      average_speed: initialRoute.average_speed || (initialRoute.distance_km / (initialRoute.duration_minutes / 60)),
      pace_per_km: pace,
      elevation_gain: initialRoute.elevation_gain || 0,
      calories: Math.floor(initialRoute.distance_km * 50),
      caption: caption,
      tagged_users: taggedUsers,
      visibility: visibility,
      shared_with: visibility === 'specific' ? selectedSpecificFriends : []
    });
  };

  const toggleTagUser = (email) => {
    setTaggedUsers(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const toggleSpecificFriend = (email) => {
    setSelectedSpecificFriends(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const friends = allUsers.filter(u => user?.friends?.includes(u.email));
  const filteredFriends = friends.filter(f => 
    f.full_name?.toLowerCase().includes(searchTag.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTag.toLowerCase())
  );

  const { xp, points } = calculateXPAndPoints(initialRoute.distance_km || 0, initialRoute.duration_minutes || 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-xl">🎉 Compartilhar Treino</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 border-2 border-emerald-200">
            <h3 className="font-bold text-lg mb-3 text-emerald-900">Métricas do Treino</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-gray-600">Distância</p>
                  <p className="font-bold text-emerald-900">{initialRoute.distance_km?.toFixed(1)} km</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Duração</p>
                  <p className="font-bold text-blue-900">{initialRoute.duration_minutes} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">Pace</p>
                  <p className="font-bold text-purple-900">{calculatePace(initialRoute.distance_km, initialRoute.duration_minutes)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xs text-gray-600">Velocidade Média</p>
                  <p className="font-bold text-amber-900">{(initialRoute.distance_km / (initialRoute.duration_minutes / 60)).toFixed(1)} km/h</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-200">
            <h3 className="font-bold mb-2 text-purple-900">🏆 Recompensas</h3>
            <div className="flex gap-3">
              <Badge className="bg-purple-600 text-white px-3 py-1.5">
                <Zap className="w-4 h-4 mr-1" />
                +{xp} XP
              </Badge>
              <Badge className="bg-emerald-600 text-white px-3 py-1.5">
                💎 +{points} Pontos
              </Badge>
            </div>
          </div>

          <div>
            <Label className="font-semibold mb-2 block">Legenda</Label>
            <Textarea
              placeholder="Conte como foi o seu treino..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label className="font-semibold mb-2 block">Visibilidade</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={visibility === "private" ? "default" : "outline"}
                onClick={() => setVisibility("private")}
                size="sm"
              >
                🔒 Somente Eu
              </Button>
              <Button
                type="button"
                variant={visibility === "specific" ? "default" : "outline"}
                onClick={() => setVisibility("specific")}
                size="sm"
              >
                👤 Amigos Específicos
              </Button>
              <Button
                type="button"
                variant={visibility === "friends" ? "default" : "outline"}
                onClick={() => setVisibility("friends")}
                size="sm"
              >
                👥 Meus Amigos
              </Button>
              <Button
                type="button"
                variant={visibility === "public" ? "default" : "outline"}
                onClick={() => setVisibility("public")}
                size="sm"
              >
                🌍 Público
              </Button>
            </div>
          </div>

          {visibility === "specific" && friends.length > 0 && (
            <div>
              <Label className="font-semibold mb-2 block">Compartilhar Com</Label>
              <Input
                placeholder="Buscar amigos..."
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                className="mb-2"
              />
              <ScrollArea className="h-32 border rounded-lg p-2">
                <div className="space-y-1">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.email}
                      onClick={() => toggleSpecificFriend(friend.email)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedSpecificFriends.includes(friend.email) ? 'bg-emerald-100 border-emerald-400' : 'hover:bg-gray-100'
                      } border`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                          {friend.avatar || '👤'}
                        </div>
                        <span className="font-medium text-sm">{friend.full_name || friend.email.split('@')[0]}</span>
                        {selectedSpecificFriends.includes(friend.email) && (
                          <Badge className="ml-auto bg-emerald-600">✓</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedSpecificFriends.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {selectedSpecificFriends.map((email) => {
                    const friend = allUsers.find(u => u.email === email);
                    return (
                      <Badge key={email} variant="secondary" className="pl-2 pr-1">
                        {friend?.full_name || email.split('@')[0]}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSpecificFriend(email);
                          }}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {friends.length > 0 && (
            <div>
              <Label className="font-semibold mb-2 block flex items-center gap-2">
                <Users className="w-4 h-4" />
                Marcar Amigos
              </Label>
              <Input
                placeholder="Buscar amigos..."
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                className="mb-2"
              />
              <ScrollArea className="h-32 border rounded-lg p-2">
                <div className="space-y-1">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.email}
                      onClick={() => toggleTagUser(friend.email)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        taggedUsers.includes(friend.email) ? 'bg-emerald-100 border-emerald-400' : 'hover:bg-gray-100'
                      } border`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                          {friend.avatar || '👤'}
                        </div>
                        <span className="font-medium text-sm">{friend.full_name || friend.email.split('@')[0]}</span>
                        {taggedUsers.includes(friend.email) && (
                          <Badge className="ml-auto bg-emerald-600">✓</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {taggedUsers.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {taggedUsers.map((email) => {
                    const friend = allUsers.find(u => u.email === email);
                    return (
                      <Badge key={email} variant="secondary" className="pl-2 pr-1">
                        {friend?.full_name || email.split('@')[0]}
                        <button
                          onClick={() => toggleTagUser(email)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createPostMutation.isLoading || (visibility === 'specific' && selectedSpecificFriends.length === 0)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            Compartilhar Treino
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
