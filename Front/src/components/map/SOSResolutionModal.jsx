import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";

export default function SOSResolutionModal({ sosAlert, onClose }) {
  const [feedback, setFeedback] = useState("");
  const [resolutionType, setResolutionType] = useState(null);
  const queryClient = useQueryClient();

  const resolveSOSMutation = useMutation({
    mutationFn: async ({ status, feedbackText }) => {
      const user = await base44.auth.me();
      
      await base44.entities.SOSAlert.update(sosAlert.id, {
        status: status,
        resolution_feedback: feedbackText,
        resolved_by: user.email,
        resolved_at: new Date().toISOString()
      });

      if (status === 'resolvido') {
        const responders = sosAlert.responders || [];
        for (const responder of responders) {
          await base44.auth.updateMe({
            points: (user.points || 0) + 10,
            sos_helped: (user.sos_helped || 0) + 1
          });

          await base44.entities.Notification.create({
            user_email: responder.user_email,
            type: 'sos_resolved',
            title: '✅ SOS Resolvido',
            message: `Obrigado por ajudar! Você ganhou 10 pontos.`,
            priority: 'media'
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sos-alerts'] });
      alert("✅ Status do SOS atualizado!");
      onClose();
    },
  });

  const handleResolve = (status) => {
    setResolutionType(status);
  };

  const handleSubmit = () => {
    if (!resolutionType) {
      alert("Por favor, selecione uma opção");
      return;
    }

    resolveSOSMutation.mutate({
      status: resolutionType,
      feedbackText: feedback
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            🆘 Finalizar Pedido de Ajuda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Solicitante:</strong> {sosAlert.user_name || sosAlert.created_by}
            </p>
            {sosAlert.description && (
              <p className="text-xs text-blue-700 mt-1">
                {sosAlert.description}
              </p>
            )}
          </div>

          <div>
            <Label className="font-bold mb-3 block">Como foi resolvido?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleResolve('resolvido')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  resolutionType === 'resolvido'
                    ? 'bg-green-50 border-green-500 ring-2 ring-green-300'
                    : 'bg-white border-gray-300 hover:border-green-400'
                }`}
              >
                <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${
                  resolutionType === 'resolvido' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <div className="font-bold text-sm text-gray-900">Ajuda Recebida</div>
                <div className="text-xs text-gray-600 mt-1">Problema resolvido</div>
              </button>

              <button
                onClick={() => handleResolve('cancelado')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  resolutionType === 'cancelado'
                    ? 'bg-gray-50 border-gray-500 ring-2 ring-gray-300'
                    : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
              >
                <XCircle className={`w-8 h-8 mx-auto mb-2 ${
                  resolutionType === 'cancelado' ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <div className="font-bold text-sm text-gray-900">Sem Resposta</div>
                <div className="text-xs text-gray-600 mt-1">Ninguém ajudou</div>
              </button>
            </div>
          </div>

          <div>
            <Label className="font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              Comentário (opcional)
            </Label>
            <Textarea
              placeholder="Como foi a experiência? O que aconteceu?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {resolutionType === 'resolvido' && sosAlert.responders && sosAlert.responders.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-semibold mb-1">
                🎉 {sosAlert.responders.length} {sosAlert.responders.length === 1 ? 'ciclista ajudou' : 'ciclistas ajudaram'}!
              </p>
              <p className="text-xs text-green-700">
                Eles receberão 10 pontos cada pela ajuda
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!resolutionType || resolveSOSMutation.isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {resolveSOSMutation.isLoading ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}