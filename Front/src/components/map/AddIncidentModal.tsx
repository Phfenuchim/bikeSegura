import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Construction, ShieldAlert, Lightbulb, MapPin } from "lucide-react";

const incidentTypes = [
  { value: "buraco", label: "Buraco na via", icon: Construction, color: "text-orange-600" },
  { value: "obra", label: "Obra / Bloqueio", icon: Construction, color: "text-orange-600" },
  { value: "assalto", label: "Assalto / Área perigosa", icon: ShieldAlert, color: "text-red-600" },
  { value: "iluminacao_precaria", label: "Iluminação precária", icon: Lightbulb, color: "text-purple-600" },
  { value: "outro", label: "Outro", icon: MapPin, color: "text-gray-600" },
];

const severityOptions = [
  { value: "baixa", label: "Baixa - Pouco impacto" },
  { value: "media", label: "Média - Atenção recomendada" },
  { value: "alta", label: "Alta - Evitar área" },
];

const POINTS_PER_INCIDENT = 10;

export default function AddIncidentModal({ position, onClose }) {
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("media");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const incidentMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Incident.create(data);
    },
    onSuccess: async () => {
      // Award points and update statistics
      const user = await base44.auth.me();
      const newPoints = (user.points || 0) + POINTS_PER_INCIDENT;
      const newIncidentCount = (user.statistics?.incidents_reported || 0) + 1;
      const newLevel = Math.floor(newPoints / 100) + 1;
      
      await base44.auth.updateMe({
        points: newPoints,
        level: newLevel,
        statistics: {
          ...user.statistics,
          incidents_reported: newIncidentCount
        }
      });

      // Create notification for the user
      await base44.entities.Notification.create({
        user_email: user.email,
        type: 'badge_earned',
        title: '🎉 Pontos Conquistados!',
        message: `Você ganhou ${POINTS_PER_INCIDENT} pontos por reportar um incidente!`,
        priority: 'baixa'
      });

      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!type) {
      alert("Por favor, selecione o tipo de incidente");
      return;
    }

    setIsSubmitting(true);

    incidentMutation.mutate({
      type,
      severity,
      description,
      latitude: position[0],
      longitude: position[1],
      status: "ativo"
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Reportar Incidente
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Você está reportando um incidente na localização selecionada. 
              Isso ajudará outros ciclistas a planejarem rotas mais seguras!
            </p>
            <p className="text-sm font-semibold text-emerald-700 mt-2">
              🎁 Ganhe {POINTS_PER_INCIDENT} pontos por reportar!
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de incidente *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map((inc) => (
                  <SelectItem key={inc.value} value={inc.value}>
                    <div className="flex items-center gap-2">
                      <inc.icon className={`w-4 h-4 ${inc.color}`} />
                      {inc.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Gravidade *</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {severityOptions.map((sev) => (
                  <SelectItem key={sev.value} value={sev.value}>
                    {sev.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Adicione mais detalhes sobre o incidente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Localização: {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </span>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? "Reportando..." : "Reportar Incidente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
