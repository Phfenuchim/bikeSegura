import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Calendar, Users, Globe, Lock, Check } from "lucide-react";

export default function CreateRouteEventModal({ onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [difficulty, setDifficulty] = useState("moderada");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [visibility, setVisibility] = useState("publico");
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const queryClient = useQueryClient();

  const { data: savedRoutes = [] } = useQuery({
    queryKey: ['saved-routes'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.SavedRoute.filter({ user_email: user.email });
    },
  });

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

  const availableTags = ["ciclovia", "via_tranquila", "paisagem", "comercio", "parque"];

  const handleSubmit = () => {
    if (!name || !startDate || !selectedRoute) {
      alert("⚠️ Preencha nome, data e selecione uma rota");
      return;
    }

    createEventMutation.mutate({
      name,
      description,
      route_data: selectedRoute,
      start_date: new Date(startDate).toISOString(),
      difficulty,
      max_participants: maxParticipants ? parseInt(maxParticipants) : null,
      visibility,
      tags: selectedTags
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            Criar Evento de Rota
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Nome do Evento *</Label>
            <Input
              placeholder="Ex: Pedalada Matinal no Parque"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descreva o evento, ponto de encontro, etc..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Data e Hora *</Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Máximo de Participantes</Label>
              <Input
                type="number"
                placeholder="Opcional"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Selecione uma Rota *</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {savedRoutes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Você ainda não tem rotas salvas
                </p>
              ) : (
                savedRoutes.map((route) => (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRoute(route)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedRoute?.id === route.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{route.name}</p>
                        <p className="text-xs text-gray-600">
                          {route.distance_km?.toFixed(1)} km • {route.duration_minutes} min
                        </p>
                      </div>
                      {selectedRoute?.id === route.id && (
                        <Check className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Dificuldade</Label>
            <RadioGroup value={difficulty} onValueChange={setDifficulty}>
              <div className="grid grid-cols-3 gap-2">
                <label className={`cursor-pointer ${difficulty === 'facil' ? 'ring-2 ring-green-500' : ''} rounded-lg`}>
                  <RadioGroupItem value="facil" id="facil" className="sr-only" />
                  <div className="bg-green-50 border-2 border-green-300 p-3 text-center rounded-lg">
                    <div className="text-xl mb-1">😊</div>
                    <div className="font-bold text-green-800 text-sm">Fácil</div>
                  </div>
                </label>
                <label className={`cursor-pointer ${difficulty === 'moderada' ? 'ring-2 ring-yellow-500' : ''} rounded-lg`}>
                  <RadioGroupItem value="moderada" id="moderada" className="sr-only" />
                  <div className="bg-yellow-50 border-2 border-yellow-300 p-3 text-center rounded-lg">
                    <div className="text-xl mb-1">😐</div>
                    <div className="font-bold text-yellow-800 text-sm">Moderada</div>
                  </div>
                </label>
                <label className={`cursor-pointer ${difficulty === 'dificil' ? 'ring-2 ring-red-500' : ''} rounded-lg`}>
                  <RadioGroupItem value="dificil" id="dificil" className="sr-only" />
                  <div className="bg-red-50 border-2 border-red-300 p-3 text-center rounded-lg">
                    <div className="text-xl mb-1">😰</div>
                    <div className="font-bold text-red-800 text-sm">Difícil</div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-3 block">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter(t => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className={`cursor-pointer ${
                    selectedTags.includes(tag)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Visibilidade</Label>
            <RadioGroup value={visibility} onValueChange={setVisibility}>
              <div className="grid grid-cols-2 gap-3">
                <label className={`cursor-pointer ${visibility === 'publico' ? 'ring-2 ring-blue-500' : ''} rounded-lg`}>
                  <RadioGroupItem value="publico" id="publico" className="sr-only" />
                  <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg flex items-center gap-3">
                    <Globe className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-bold text-blue-900">Público</div>
                      <div className="text-xs text-blue-700">Todos podem ver</div>
                    </div>
                  </div>
                </label>
                <label className={`cursor-pointer ${visibility === 'privado' ? 'ring-2 ring-gray-500' : ''} rounded-lg`}>
                  <RadioGroupItem value="privado" id="privado" className="sr-only" />
                  <div className="bg-gray-50 border-2 border-gray-300 p-4 rounded-lg flex items-center gap-3">
                    <Lock className="w-6 h-6 text-gray-600" />
                    <div>
                      <div className="font-bold text-gray-900">Privado</div>
                      <div className="text-xs text-gray-700">Apenas convidados</div>
                    </div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createEventMutation.isLoading}
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
