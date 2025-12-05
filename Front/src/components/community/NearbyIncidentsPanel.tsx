import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const incidentIcons = {
  assalto: "🔴",
  obra: "🟠",
  buraco: "🟡",
  iluminacao_precaria: "⚫",
  outro: "⚪"
};

const incidentLabels = {
  assalto: "Assalto",
  obra: "Obra",
  buraco: "Buraco",
  iluminacao_precaria: "Má Iluminação",
  outro: "Outro"
};

const severityColors = {
  baixa: "bg-yellow-100 text-yellow-800 border-yellow-200",
  media: "bg-orange-100 text-orange-800 border-orange-200",
  alta: "bg-red-100 text-red-800 border-red-200"
};

export default function NearbyIncidentsPanel({ incidents, userLocation }) {
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

  const incidentsWithDistance = incidents
    .map(incident => ({
      ...incident,
      distance: userLocation 
        ? calculateDistance(userLocation[0], userLocation[1], incident.latitude, incident.longitude)
        : null
    }))
    .filter(inc => !inc.distance || inc.distance < 5)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, 10);

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Incidentes Próximos
        </CardTitle>
        <p className="text-xs text-gray-600">
          Alertas em um raio de 5km
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {incidentsWithDistance.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 text-sm">✅ Nenhum incidente próximo</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-3">
              {incidentsWithDistance.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-orange-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{incidentIcons[incident.type]}</span>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">
                          {incidentLabels[incident.type]}
                        </h4>
                        {incident.distance !== null && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {incident.distance < 1 
                              ? `${(incident.distance * 1000).toFixed(0)}m` 
                              : `${incident.distance.toFixed(1)}km`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={`text-xs ${severityColors[incident.severity]}`}>
                      {incident.severity}
                    </Badge>
                  </div>

                  {incident.description && (
                    <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                      {incident.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(incident.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <span>
                      ✓ {incident.validation_score || 0} validações
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
