
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Bell, MapPin, AlertTriangle, Calendar, Users, Save } from "lucide-react";

export default function ConfiguracoesPage() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const [preferences, setPreferences] = useState(
    user?.notification_preferences || {
      sos_alerts: true,
      sos_radius_km: 5,
      incident_alerts: true,
      incident_radius_km: 2,
      route_updates: true,
      event_reminders: true,
      community_updates: false,
    }
  );

  const updatePreferencesMutation = useMutation({
    mutationFn: (prefs) => base44.auth.updateMe({ notification_preferences: prefs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      alert("✅ Preferências salvas!");
    },
  });

  const handleSave = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  const handleLogout = () => {
    if (confirm("Tem certeza que deseja sair?")) {
      base44.auth.logout();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
          <p className="text-gray-600 text-sm sm:text-base">Personalize suas preferências de notificações</p>
        </div>

        <div className="space-y-6">
          <Card className="shadow-xl border-2 border-emerald-100">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5 text-emerald-600" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* SOS Alerts */}
              <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <Label className="font-bold text-gray-900">Alertas SOS</Label>
                      <p className="text-xs text-gray-600">Receber alertas de emergência</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.sos_alerts}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, sos_alerts: checked })
                    }
                  />
                </div>
                {preferences.sos_alerts && (
                  <div className="space-y-2 pl-13">
                    <Label className="text-sm text-gray-700">
                      Raio: {preferences.sos_radius_km}km
                    </Label>
                    <Slider
                      value={[preferences.sos_radius_km]}
                      onValueChange={(value) =>
                        setPreferences({ ...preferences, sos_radius_km: value[0] })
                      }
                      min={1}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Incident Alerts */}
              <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <Label className="font-bold text-gray-900">Incidentes na Rota</Label>
                      <p className="text-xs text-gray-600">Alertas de incidentes próximos</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.incident_alerts}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, incident_alerts: checked })
                    }
                  />
                </div>
                {preferences.incident_alerts && (
                  <div className="space-y-2 pl-13">
                    <Label className="text-sm text-gray-700">
                      Raio: {preferences.incident_radius_km}km
                    </Label>
                    <Slider
                      value={[preferences.incident_radius_km]}
                      onValueChange={(value) =>
                        setPreferences({ ...preferences, incident_radius_km: value[0] })
                      }
                      min={0.5}
                      max={10}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Route Updates */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <Label className="font-bold text-gray-900">Atualizações de Rotas</Label>
                    <p className="text-xs text-gray-600">Mudanças em rotas salvas</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.route_updates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, route_updates: checked })
                  }
                />
              </div>

              {/* Event Reminders */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <Label className="font-bold text-gray-900">Lembretes de Eventos</Label>
                    <p className="text-xs text-gray-600">Eventos que você participa</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.event_reminders}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, event_reminders: checked })
                  }
                />
              </div>

              {/* Community Updates */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <Label className="font-bold text-gray-900">Atualizações da Comunidade</Label>
                    <p className="text-xs text-gray-600">Novidades e atualizações gerais</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.community_updates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, community_updates: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={updatePreferencesMutation.isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base shadow-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            Salvar Preferências
          </Button>

          {/* Logout Card */}
          <Card className="border-2 border-red-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Sair da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Você será desconectado da sua conta. Para acessar novamente, será necessário fazer login.
              </p>
              <Button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 w-full"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Sair da Conta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
