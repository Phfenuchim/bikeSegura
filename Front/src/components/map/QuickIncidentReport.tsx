import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const POINTS_PER_INCIDENT = 15;

const incidentTypes = [
  { id: 'assalto', label: '🔴 Assalto', color: 'bg-red-500' },
  { id: 'buraco', label: '🟠 Buraco', color: 'bg-orange-500' },
  { id: 'obra', label: '🟡 Obra', color: 'bg-yellow-500' },
  { id: 'iluminacao_precaria', label: '⚫ Má Iluminação', color: 'bg-purple-500' }
];

export default function QuickIncidentReport({ position, onClose }) {
  const [selectedType, setSelectedType] = useState(null);
  const queryClient = useQueryClient();

  const createIncidentMutation = useMutation({
    mutationFn: async (type) => {
      const user = await base44.auth.me();
      
      // Create incident
      await base44.entities.Incident.create({
        type: type,
        latitude: position[0],
        longitude: position[1],
        severity: 'media',
        status: 'ativo',
        description: 'Reportado durante navegação'
      });

      // Update user points
      const newPoints = (user.points || 0) + POINTS_PER_INCIDENT;
      const newLevel = Math.floor(newPoints / 100) + 1;
      const newIncidentCount = (user.statistics?.incidents_reported || 0) + 1;

      await base44.auth.updateMe({
        points: newPoints,
        level: newLevel,
        statistics: {
          ...user.statistics,
          incidents_reported: newIncidentCount
        }
      });

      // Create notification
      await base44.entities.Notification.create({
        user_email: user.email,
        type: 'badge_earned',
        title: '✅ Incidente Reportado!',
        message: `Você ganhou ${POINTS_PER_INCIDENT} pontos por reportar um incidente`,
        priority: 'baixa'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      onClose();
    },
  });

  return (
    <Card className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[2000] shadow-2xl border-4 border-red-400 w-80">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Reportar Rápido
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Ganhe {POINTS_PER_INCIDENT} pontos
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {incidentTypes.map((type) => (
            <Button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id);
                createIncidentMutation.mutate(type.id);
              }}
              disabled={createIncidentMutation.isLoading}
              className={`w-full justify-start ${
                selectedType === type.id
                  ? type.color + ' text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              {createIncidentMutation.isLoading && selectedType === type.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              {type.label}
            </Button>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          📍 Posição: {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </p>
      </CardContent>
    </Card>
  );
}
