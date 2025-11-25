
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Users, CheckCircle, Navigation, Languages } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const isValidCoordinate = (coord) => {
  return coord !== null && coord !== undefined && !isNaN(coord) && isFinite(coord);
};

const createSOSIcon = (status) => {
  const colors = {
    ativo: '#ef4444',
    ajuda_a_caminho: '#f59e0b',
    resolvido: '#10b981'
  };
  
  const color = colors[status] || colors.ativo;
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        animation: pulse-sos 1.5s infinite;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <style>
        @keyframes pulse-sos {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      </style>
    `,
    className: 'sos-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function SOSAlertMarkers({ sosAlerts, userLocation, onResolveSOS, onNavigateToSOS }) {
  const queryClient = useQueryClient();
  const [translatedTexts, setTranslatedTexts] = useState({});
  const [translatingId, setTranslatingId] = useState(null);

  const respondSOSMutation = useMutation({
    mutationFn: async (alertId) => {
      const alert = sosAlerts.find(a => a.id === alertId);
      const user = await base44.auth.me();
      
      const newResponders = [
        ...(alert.responders || []),
        {
          user_email: user.email,
          responded_at: new Date().toISOString()
        }
      ];

      await base44.entities.SOSAlert.update(alertId, {
        status: 'ajuda_a_caminho',
        responders: newResponders
      });

      await base44.auth.updateMe({
        points: (user.points || 0) + 15,
        sos_responses: (user.sos_responses || 0) + 1
      });

      await base44.entities.Notification.create({
        user_email: alert.created_by,
        type: 'sos_alert',
        title: '🚴 Ajuda a Caminho!',
        message: `${user.full_name || user.email} está indo te ajudar!`,
        priority: 'critica'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sos-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      alert("✅ Resposta enviada! O ciclista foi notificado.");
    },
  });

  const translateText = async (text, alertId) => {
    if (!text) return;
    
    setTranslatingId(alertId);
    try {
      const currentLang = localStorage.getItem('app_language') || 'pt';
      const targetLang = currentLang === 'pt' ? 'en' : 'pt';
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate this ${currentLang === 'pt' ? 'Portuguese' : 'English'} text to ${targetLang === 'en' ? 'English' : 'Portuguese'}. Return ONLY the translation, nothing else: "${text}"`,
        response_json_schema: null
      });

      setTranslatedTexts(prev => ({
        ...prev,
        [alertId]: result
      }));
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setTranslatingId(null);
    }
  };

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

  return (
    <>
      {sosAlerts.filter(alert => 
        alert && 
        isValidCoordinate(alert.latitude) && 
        isValidCoordinate(alert.longitude)
      ).map((alert) => {
        const distance = userLocation && Array.isArray(userLocation) && userLocation.length === 2 && isValidCoordinate(userLocation[0]) && isValidCoordinate(userLocation[1])
          ? calculateDistance(userLocation[0], userLocation[1], alert.latitude, alert.longitude)
          : null;

        const displayText = translatedTexts[alert.id] || alert.description;

        return (
          <Marker
            key={alert.id}
            position={[alert.latitude, alert.longitude]}
            icon={createSOSIcon(alert.status)}
          >
            <Popup maxWidth={320} className="sos-popup">
              <div className="p-2 w-full">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    SOS
                  </h3>
                  {alert.status === 'ajuda_a_caminho' && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      🚴 A caminho
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 mb-3">
                  <p className="text-sm">
                    <strong>Ciclista:</strong> {alert.user_name || alert.created_by?.split('@')[0]}
                  </p>
                  {alert.description && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Descrição:</span>
                        <button
                          onClick={() => translateText(alert.description, alert.id)}
                          disabled={translatingId === alert.id}
                          className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"
                        >
                          <Languages className="w-3 h-3" />
                          {translatingId === alert.id ? '...' : 'Traduzir'}
                        </button>
                      </div>
                      <p className="text-sm bg-red-50 p-2 rounded border border-red-200">
                        💬 {displayText}
                      </p>
                    </div>
                  )}
                  {distance !== null && (
                    <p className="text-sm text-blue-600 font-semibold">
                      📍 {distance < 1 
                        ? `${(distance * 1000).toFixed(0)}m` 
                        : `${distance.toFixed(1)}km`}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    ⏰ {format(new Date(alert.created_date), "dd/MM HH:mm", { locale: ptBR })}
                  </p>
                </div>

                {alert.responders && alert.responders.length > 0 && (
                  <div className="mb-2 bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs text-blue-800 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {alert.responders.length} {alert.responders.length === 1 ? 'respondeu' : 'responderam'}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {alert.status === 'ativo' && onNavigateToSOS && (
                    <Button
                      onClick={() => onNavigateToSOS(alert)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-sm py-2"
                      size="sm"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Navegar até SOS
                    </Button>
                  )}

                  {alert.status === 'ativo' && (
                    <Button
                      onClick={() => respondSOSMutation.mutate(alert.id)}
                      disabled={respondSOSMutation.isLoading}
                      className="w-full bg-red-600 hover:bg-red-700 text-sm py-2"
                      size="sm"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Vou Ajudar! (+15 pts)
                    </Button>
                  )}

                  {alert.created_by && onResolveSOS && (
                    <Button
                      onClick={() => onResolveSOS(alert)}
                      variant="outline"
                      size="sm"
                      className="w-full text-sm py-2"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalizar
                    </Button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
