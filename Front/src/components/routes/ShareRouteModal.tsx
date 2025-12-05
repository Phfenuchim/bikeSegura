import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, Users, Lock, Check, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

export default function ShareRouteModal({ route, onClose }) {
  const [visibility, setVisibility] = useState("public");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [description, setDescription] = useState(route.description || "");
  const [difficulty, setDifficulty] = useState("moderada");
  const [selectedTags, setSelectedTags] = useState([]);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: visibility === 'friends',
  });

  const shareRouteMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.PreferredRoute.create({
        name: route.name,
        description: description,
        coordinates: route.coordinates,
        start_address: route.start_address,
        end_address: route.end_address,
        distance_km: route.distance_km,
        difficulty: difficulty,
        tags: selectedTags,
        visibility: visibility,
        shared_with: visibility === 'friends' ? selectedFriends : [],
        votes: 0,
        voted_by: [],
        is_validated: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferred-routes'] });
      const message = 
        visibility === 'public' ? "✅ Rota compartilhada com a comunidade!" :
        visibility === 'friends' ? `✅ Rota compartilhada com ${selectedFriends.length} amigos!` :
        "✅ Rota mantida privada!";
      alert(message);
      onClose();
    },
  });

  const availableTags = [
    { id: "ciclovia", label: "🚴 Ciclovia", color: "bg-blue-100 text-blue-800" },
    { id: "via_tranquila", label: "😌 Tranquila", color: "bg-green-100 text-green-800" },
    { id: "paisagem", label: "🌳 Paisagem", color: "bg-emerald-100 text-emerald-800" },
    { id: "comercio", label: "🏪 Comércio", color: "bg-orange-100 text-orange-800" },
    { id: "parque", label: "🌲 Parque", color: "bg-teal-100 text-teal-800" }
  ];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleFriend = (email) => {
    if (selectedFriends.includes(email)) {
      setSelectedFriends(selectedFriends.filter(e => e !== email));
    } else {
      setSelectedFriends([...selectedFriends, email]);
    }
  };

  const filteredUsers = allUsers.filter(user => 
    user.email !== currentUser?.email &&
    (user.full_name?.toLowerCase().includes(friendSearch.toLowerCase()) ||
     user.email.toLowerCase().includes(friendSearch.toLowerCase()))
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Compartilhar Rota: {route.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Descrição */}
          <div>
            <Label className="text-sm font-bold mb-2 block">Descrição</Label>
            <Textarea
              placeholder="Descreva pontos de interesse, dicas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="border-2 focus:border-emerald-500"
            />
          </div>

          {/* Dificuldade */}
          <div>
            <Label className="text-sm font-bold mb-3 block">Dificuldade</Label>
            <RadioGroup value={difficulty} onValueChange={setDifficulty}>
              <div className="grid grid-cols-3 gap-2">
                <label className={`relative cursor-pointer ${difficulty === 'facil' ? 'ring-4 ring-green-500' : ''} rounded-xl overflow-hidden transition-all`}>
                  <RadioGroupItem value="facil" id="facil-share" className="sr-only" />
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 p-3 text-center hover:shadow-lg transition-shadow">
                    <div className="text-2xl mb-1">😊</div>
                    <div className="font-bold text-green-800 text-sm">Fácil</div>
                  </div>
                </label>
                
                <label className={`relative cursor-pointer ${difficulty === 'moderada' ? 'ring-4 ring-yellow-500' : ''} rounded-xl overflow-hidden transition-all`}>
                  <RadioGroupItem value="moderada" id="moderada-share" className="sr-only" />
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 p-3 text-center hover:shadow-lg transition-shadow">
                    <div className="text-2xl mb-1">😐</div>
                    <div className="font-bold text-yellow-800 text-sm">Moderada</div>
                  </div>
                </label>
                
                <label className={`relative cursor-pointer ${difficulty === 'dificil' ? 'ring-4 ring-red-500' : ''} rounded-xl overflow-hidden transition-all`}>
                  <RadioGroupItem value="dificil" id="dificil-share" className="sr-only" />
                  <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 p-3 text-center hover:shadow-lg transition-shadow">
                    <div className="text-2xl mb-1">😰</div>
                    <div className="font-bold text-red-800 text-sm">Difícil</div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-sm font-bold mb-2 block">Características</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`cursor-pointer px-3 py-2 text-sm transition-all ${
                    selectedTags.includes(tag.id)
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 scale-110 shadow-lg'
                      : `${tag.color} hover:scale-105`
                  }`}
                >
                  {tag.label}
                  {selectedTags.includes(tag.id) && <Check className="w-3 h-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Visibilidade */}
          <div className="border-2 border-gray-300 rounded-lg p-4 space-y-3">
            <Label className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Quem pode ver esta rota?
            </Label>
            
            <RadioGroup value={visibility} onValueChange={setVisibility}>
              <div className="space-y-2">
                <label className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  visibility === 'public' ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300 hover:border-blue-300'
                }`}>
                  <RadioGroupItem value="public" id="public-share" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>Pública - Comunidade</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      🌍 Todos podem ver, votar e usar esta rota
                    </p>
                  </div>
                </label>

                <label className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  visibility === 'friends' ? 'bg-purple-50 border-purple-400' : 'bg-gray-50 border-gray-300 hover:border-purple-300'
                }`}>
                  <RadioGroupItem value="friends" id="friends-share" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>Apenas Amigos</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      👥 Compartilhe com usuários específicos
                    </p>
                  </div>
                </label>

                <label className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  visibility === 'private' ? 'bg-gray-50 border-gray-400' : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                }`}>
                  <RadioGroupItem value="private" id="private-share" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Lock className="w-4 h-4 text-gray-600" />
                      <span>Manter Privada</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      🔒 Apenas você terá acesso
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>

            {/* Seleção de Amigos */}
            {visibility === 'friends' && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <Label className="text-sm font-bold mb-2 block">
                  Selecionar Amigos ({selectedFriends.length} selecionados)
                </Label>
                <Input
                  placeholder="🔍 Buscar por nome ou email..."
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  className="mb-3"
                />
                <ScrollArea className="h-48 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {filteredUsers.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhum usuário encontrado
                      </p>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.email}
                          onClick={() => toggleFriend(user.email)}
                          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all ${
                            selectedFriends.includes(user.email)
                              ? 'bg-purple-100 border-2 border-purple-400'
                              : 'bg-white hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {user.full_name?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.full_name || user.email}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                          {selectedFriends.includes(user.email) && (
                            <Check className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Informações da Rota */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Detalhes da Rota</p>
            <div className="flex gap-3 text-sm">
              <span>📏 {route.distance_km?.toFixed(1)} km</span>
              <span>⏱️ {route.duration_minutes} min</span>
              <span>📍 {route.start_address?.substring(0, 30)}...</span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={() => shareRouteMutation.mutate()}
              disabled={shareRouteMutation.isLoading || (visibility === 'friends' && selectedFriends.length === 0)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {shareRouteMutation.isLoading ? (
                "Compartilhando..."
              ) : visibility === 'public' ? (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Compartilhar Publicamente
                </>
              ) : visibility === 'friends' ? (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Compartilhar com Amigos
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Manter Privada
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
