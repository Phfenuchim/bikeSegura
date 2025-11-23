import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Users, Globe, Lock, Sparkles } from "lucide-react";

export default function CreateEventFromRouteModal({ route, onClose }) {
  const [name, setName] = useState(route.name || "");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [difficulty, setDifficulty] = useState("moderada");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [visibility, setVisibility] = useState("publico");
  const [selectedTags, setSelectedTags] = useState([]);
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const user = await base44.auth.me();
      return base44.entities.RouteEvent.create({
        ...eventData,
        created_by: user.email,
        participants: [{
          user_email: user.email,
          joined_at: new Date().toISOString(),
          status: "confirmado"
        }],
        metrics: [],
        status: "agendado"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-events'] });
      alert("✅ Evento criado com sucesso!");
      onClose();
    },
  });

  const availableTags = [
    { id: "ciclovia", label: "🚴 Ciclovia" },
    { id: "via_tranquila", label: "😌 Tranquila" },
    { id: "paisagem", label: "🌳 Paisagem" },
    { id: "comercio", label: "🏪 Comércio" },
    { id: "parque", label: "🌲 Parque" }
  ];

  const handleSubmit = () => {
    if (!name || !startDate) {
      alert("⚠️ Preencha nome e data do evento");
      return;
    }

    const routeData = {
      coordinates: route.coordinates,
      distance_km: route.distance_km,
      duration_minutes: route.duration_minutes,
      instructions: route.instructions,
      start_address: route.start_address,
      end_address: route.end_address
    };

    createEventMutation.mutate({
      name,
      description,
      route_data: routeData,
      start_date: new Date(startDate).toISOString(),
      difficulty,
      max_participants: maxParticipants ? parseInt(maxParticipants) : null,
      visibility,
      tags: selectedTags
    });
  };

  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            Criar Evento desta Rota
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info da Rota */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-800 mb-1">
              <strong>Rota:</strong> {route.start_address} → {route.end_address}
            </p>
            <p className="text-xs text-emerald-700">
              📏 {route.distance_km.toFixed(1)} km • ⏱️ {route.duration_minutes} min
            </p>
          </div>

          <div>
            <Label className="font-bold">Nome do Evento *</Label>
            <Input
              placeholder="Ex: Pedalada Matinal pela Cidade"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label className="font-bold">Descrição</Label>
            <Textarea
              placeholder="Descreva o evento, ponto de encontro, o que levar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-bold flex items-center gap-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                Data e Hora *
              </Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label className="font-bold flex items-center gap-1">
                <Users className="w-4 h-4 text-purple-600" />
                Máximo de Participantes
              </Label>
              <Input
                type="number"
                placeholder="Deixe vazio para ilimitado"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
              />
            </div>
          </div>

          {/* Dificuldade */}
          <div>
            <Label className="font-bold mb-3 block">Dificuldade</Label>
            <RadioGroup value={difficulty} onValueChange={setDifficulty}>
              <div className="grid grid-cols-3 gap-2">
                <label className={`cursor-pointer ${difficulty === 'facil' ? 'ring-2 ring-green-500' : ''} rounded-lg overflow-hidden`}>
                  <RadioGroupItem value="facil" id="facil" className="sr-only" />
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 p-3 text-center hover:scale-105 transition-transform">
                    <div className="text-2xl mb-1">😊</div>
                    <div className="font-bold text-green-800 text-sm">Fácil</div>
                  </div>
                </label>
                <label className={`cursor-pointer ${difficulty === 'moderada' ? 'ring-2 ring-yellow-500' : ''} rounded-lg overflow-hidden`}>
                  <RadioGroupItem value="moderada" id="moderada" className="sr-only" />
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 p-3 text-center hover:scale-105 transition-transform">
                    <div className="text-2xl mb-1">😐</div>
                    <div className="font-bold text-yellow-800 text-sm">Moderada</div>
                  </div>
                </label>
                <label className={`cursor-pointer ${difficulty === 'dificil' ? 'ring-2 ring-red-500' : ''} rounded-lg overflow-hidden`}>
                  <RadioGroupItem value="dificil" id="dificil" className="sr-only" />
                  <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 p-3 text-center hover:scale-105 transition-transform">
                    <div className="text-2xl mb-1">😰</div>
                    <div className="font-bold text-red-800 text-sm">Difícil</div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Tags */}
          <div>
            <Label className="font-bold mb-2 block">Tags (opcional)</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`cursor-pointer px-3 py-2 transition-all ${
                    selectedTags.includes(tag.id)
                      ? 'bg-emerald-500 text-white scale-110'
                      : 'bg-gray-200 text-gray-700 hover:scale-105'
                  }`}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Visibilidade */}
          <div>
            <Label className="font-bold mb-3 block">Visibilidade</Label>
            <RadioGroup value={visibility} onValueChange={setVisibility}>
              <div className="grid grid-cols-2 gap-3">
                <label className={`cursor-pointer ${visibility === 'publico' ? 'ring-2 ring-blue-500' : ''} rounded-lg`}>
                  <RadioGroupItem value="publico" id="publico" className="sr-only" />
                  <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg flex items-center gap-3 hover:scale-105 transition-transform">
                    <Globe className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-bold text-blue-900">🌍 Público</div>
                      <div className="text-xs text-blue-700">Todos podem ver e participar</div>
                    </div>
                  </div>
                </label>
                <label className={`cursor-pointer ${visibility === 'privado' ? 'ring-2 ring-gray-500' : ''} rounded-lg`}>
                  <RadioGroupItem value="privado" id="privado" className="sr-only" />
                  <div className="bg-gray-50 border-2 border-gray-300 p-4 rounded-lg flex items-center gap-3 hover:scale-105 transition-transform">
                    <Lock className="w-6 h-6 text-gray-600" />
                    <div>
                      <div className="font-bold text-gray-900">🔒 Privado</div>
                      <div className="text-xs text-gray-700">Apenas convidados</div>
                    </div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createEventMutation.isLoading || !name || !startDate}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {createEventMutation.isLoading ? "Criando..." : "Criar Evento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}