import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function RouteFeedbackModal({ route, onClose }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState("");

  const queryClient = useQueryClient();

  const feedbackMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.RouteFeedback.create({
        ...data,
        user_email: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-feedback'] });
      alert("Obrigado pelo seu feedback! 🙏");
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!rating) {
      alert("Por favor, selecione uma avaliação");
      return;
    }

    feedbackMutation.mutate({
      route_id: route.id || route.routeName,
      rating,
      category,
      feedback,
      distance_km: route.distance_km,
      duration_minutes: route.duration_minutes,
      incidents_encountered: route.incidents?.length || 0
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Avaliar Rota</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Como foi sua experiência com esta rota?
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              O que você achou? (Opcional)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'safe', label: '🛡️ Segura', icon: ThumbsUp },
                { id: 'scenic', label: '🌳 Bonita', icon: ThumbsUp },
                { id: 'fast', label: '⚡ Rápida', icon: ThumbsUp },
                { id: 'bike_lane', label: '🚴 Ciclovia', icon: ThumbsUp },
                { id: 'dangerous', label: '⚠️ Perigosa', icon: ThumbsDown },
                { id: 'bad_pavement', label: '🕳️ Má pavimentação', icon: ThumbsDown }
              ].map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={category === cat.id ? "default" : "outline"}
                    onClick={() => setCategory(cat.id)}
                    className={`text-xs h-auto py-3 ${
                      category === cat.id 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : ''
                    }`}
                  >
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Comentários Adicionais
            </p>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Compartilhe sua experiência..."
              className="h-24"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              💡 Seu feedback nos ajuda a melhorar as rotas para toda a comunidade!
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={feedbackMutation.isLoading || !rating}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
