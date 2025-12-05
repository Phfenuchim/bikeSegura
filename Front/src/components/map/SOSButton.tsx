
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import LiveLocationSharing from "./LiveLocationSharing";

export default function SOSButton({ userLocation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [description, setDescription] = useState("");
  const [isSending, setIsSending] = useState(false); // New state
  const [createdSOSId, setCreatedSOSId] = useState(null); // New state
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (user && isOpen) {
      setUserName(user.full_name || user.email.split('@')[0]);
    }
  }, [user, isOpen]);

  const createSOSMutation = useMutation({
    mutationFn: async (sosData) => {
      const currentUser = await base44.auth.me(); // Fetch current user right before mutation
      return base44.entities.SOSAlert.create({
        ...sosData,
        created_by: currentUser.email
      });
    },
    onSuccess: (createdSOS) => {
      queryClient.invalidateQueries({ queryKey: ['sos-alerts'] });
      setCreatedSOSId(createdSOS.id);
      setIsSending(false);
      alert("✅ Alerta SOS enviado! A comunidade foi notificada.");
    },
    onError: (error) => {
      console.error("Failed to create SOS alert:", error);
      setIsSending(false);
      alert("❌ Falha ao enviar alerta SOS. Por favor, tente novamente.");
    }
  });

  const handleSendSOS = async () => {
    if (!userLocation || userLocation.length !== 2) {
      alert("❌ Localização não disponível. Por favor, habilite o compartilhamento de localização.");
      return;
    }

    // Since userName is pre-filled, this check might be less critical, but good for empty cases
    if (!userName.trim()) {
      alert("Por favor, informe seu nome.");
      return;
    }

    setIsSending(true);
    createSOSMutation.mutate({
      latitude: userLocation[0],
      longitude: userLocation[1],
      description: description || "Preciso de ajuda!",
      user_name: userName,
      status: "ativo",
      responders: []
    });
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        // Reset states when closing the sheet
        if (!open) {
          setUserName(user ? (user.full_name || user.email.split('@')[0]) : "");
          setDescription("");
          setCreatedSOSId(null);
          setIsSending(false);
          createSOSMutation.reset(); // Reset mutation state as well
        }
      }}>
        <SheetTrigger asChild>
          <Button
            className="fixed top-20 right-4 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-2xl border-4 border-white z-[400] animate-pulse"
            size="icon"
          >
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-2xl text-red-600 flex items-center gap-2 justify-center">
              <AlertCircle className="w-7 h-7 animate-pulse" />
              Acionar SOS
            </SheetTitle>
            <SheetDescription className="text-sm text-center">
              Envie um pedido de ajuda para ciclistas próximos
            </SheetDescription>
          </SheetHeader>

          {!createdSOSId ? (
            <div className="space-y-4 pb-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Seu Nome *
                </Label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Como você se chama?"
                  className="h-11 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descrição (opcional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a situação..."
                  rows={4}
                  className="text-base"
                />
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-800">
                  ⚠️ Este alerta será enviado para ciclistas próximos. Use apenas em emergências reais.
                </p>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="flex-1 h-12 text-base"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendSOS}
                  disabled={createSOSMutation.isLoading || isSending}
                  className="flex-1 bg-red-600 hover:bg-red-700 h-12 text-base"
                >
                  {createSOSMutation.isLoading || isSending ? (
                    "Enviando..."
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Enviar SOS
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <LiveLocationSharing sosAlertId={createdSOSId} isActive={true} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
