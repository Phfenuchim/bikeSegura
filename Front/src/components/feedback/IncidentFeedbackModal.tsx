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
import { ThumbsUp, ThumbsDown, Flag, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function IncidentFeedbackModal({ incident, onClose }) {
  const [isAccurate, setIsAccurate] = useState(null);
  const [isResolved, setIsResolved] = useState(null);
  const [comment, setComment] = useState("");

  const queryClient = useQueryClient();

  const feedbackMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      
      // Create feedback record
      await base44.entities.IncidentFeedback.create({
        ...data,
        user_email: user.email
      });

      // Update incident validation score
      if (isAccurate === true) {
        const currentScore = incident.validation_score || 0;
        await base44.entities.Incident.update(incident.id, {
          validation_score: currentScore + 1
        });
      } else if (isAccurate === false) {
        const currentScore = incident.validation_score || 0;
        await base44.entities.Incident.update(incident.id, {
          validation_score: Math.max(0, currentScore - 1)
        });
      }

      // Mark as resolved if user confirms
      if (isResolved === true) {
        await base44.entities.Incident.update(incident.id, {
          status: 'resolvido'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-feedback'] });
      alert("Obrigado por ajudar a validar os incidentes! 🙏");
      onClose();
    },
  });

  const handleSubmit = () => {
    if (isAccurate === null) {
      alert("Por favor, indique se o incidente é preciso");
      return;
    }

    feedbackMutation.mutate({
      incident_id: incident.id,
      is_accurate: isAccurate,
      is_resolved: isResolved,
      comment
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Validar Incidente</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="font-bold text-gray-900 capitalize mb-1">
              {incident.type.replace('_', ' ')}
            </p>
            <p className="text-sm text-gray-600">
              {incident.description || 'Sem descrição'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Reportado por: {incident.created_by?.split('@')[0]}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              ✅ Este incidente está correto e preciso?
            </p>
            <div className="flex gap-3">
              <Button
                variant={isAccurate === true ? "default" : "outline"}
                onClick={() => setIsAccurate(true)}
                className={`flex-1 ${
                  isAccurate === true 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'border-2'
                }`}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Sim, correto
              </Button>
              <Button
                variant={isAccurate === false ? "default" : "outline"}
                onClick={() => setIsAccurate(false)}
                className={`flex-1 ${
                  isAccurate === false 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'border-2'
                }`}
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Não, incorreto
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              🔧 O problema já foi resolvido?
            </p>
            <div className="flex gap-3">
              <Button
                variant={isResolved === true ? "default" : "outline"}
                onClick={() => setIsResolved(true)}
                className={`flex-1 ${
                  isResolved === true 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'border-2'
                }`}
              >
                Sim, resolvido
              </Button>
              <Button
                variant={isResolved === false ? "default" : "outline"}
                onClick={() => setIsResolved(false)}
                className={`flex-1 ${
                  isResolved === false 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'border-2'
                }`}
              >
                Não, ainda existe
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Comentário Adicional (Opcional)
            </p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Adicione informações úteis..."
              className="h-20"
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-xs text-emerald-800">
              💡 Sua validação ajuda a manter os dados precisos para toda a comunidade!
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={feedbackMutation.isLoading || isAccurate === null}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Validação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
