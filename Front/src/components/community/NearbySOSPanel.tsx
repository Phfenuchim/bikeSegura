import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, MapPin, Clock, Users, Navigation } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const statusColors = {
  ativo: "bg-red-100 text-red-800 border-red-300",
  ajuda_a_caminho: "bg-yellow-100 text-yellow-800 border-yellow-300",
  resolvido: "bg-green-100 text-green-800 border-green-300"
};

const statusLabels = {
  ativo: "🆘 Aguardando",
  ajuda_a_caminho: "🚴 Ajuda a caminho",
  resolvido: "✅ Resolvido"
};

export default function NearbySOSPanel({ sosAlerts, userLocation }) {
  const navigate = useNavigate();

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const alertsWithDistance = sosAlerts
    .filter(alert => alert.status === 'ativo' || alert.status === 'ajuda_a_caminho')
    .map(alert => ({
      ...alert,
      distance: userLocation 
        ? calculateDistance(userLocation[0], userLocation[1], alert.latitude, alert.longitude)
        : null
    }))
    .filter(alert => !alert.distance || alert.distance < 10)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, 10);

  const handleNavigateToSOS = (alert) => {
    sessionStorage.setItem('focusSOS', JSON.stringify({
      lat: alert.latitude,
      lng: alert.longitude,
      id: alert.id
    }));
    navigate(createPageUrl("Mapa"));
  };

  return (
    <Card className="border-2 border-red-200">
      <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Pedidos de Ajuda (SOS)
        </CardTitle>
        <p className="text-xs text-gray-600">
          Ciclistas precisando de ajuda em um raio de 10km
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {alertsWithDistance.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 text-sm">✅ Nenhum pedido de ajuda ativo</p>
            <p className="text-xs text-gray-400 mt-1">
              Você será notificado quando alguém precisar
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-3">
              {alertsWithDistance.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-red-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <h4 className="font-bold text-sm text-gray-900">
                          {alert.user_name || alert.created_by?.split('@')[0] || 'Ciclista'}
                        </h4>
                      </div>
                      {alert.distance !== null && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3" />
                          {alert.distance < 1 
                            ? `${(alert.distance * 1000).toFixed(0)}m de você` 
                            : `${alert.distance.toFixed(1)}km de você`}
                        </p>
                      )}
                    </div>
                    <Badge className={`text-xs ${statusColors[alert.status]}`}>
                      {statusLabels[alert.status]}
                    </Badge>
                  </div>

                  {alert.description && (
                    <p className="text-xs text-gray-700 mb-2 bg-gray-50 rounded p-2 border border-gray-200">
                      💬 {alert.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(alert.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {alert.responders && alert.responders.length > 0 && (
                      <span className="text-xs text-blue-600 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {alert.responders.length} {alert.responders.length === 1 ? 'ajudando' : 'ajudando'}
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => handleNavigateToSOS(alert)}
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Navigation className="w-3 h-3 mr-2" />
                    Ver no Mapa e Ajudar
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
