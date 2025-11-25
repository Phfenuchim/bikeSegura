import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Construction, ShieldAlert, Lightbulb, X, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const incidentTypes = {
  assalto: { label: "Assalto", color: "bg-red-500", icon: ShieldAlert },
  obra: { label: "Obra", color: "bg-orange-500", icon: Construction },
  buraco: { label: "Buraco", color: "bg-orange-500", icon: AlertTriangle },
  iluminacao_precaria: { label: "Iluminação", color: "bg-purple-500", icon: Lightbulb },
  outro: { label: "Outro", color: "bg-gray-500", icon: AlertTriangle }
};

const severityStyles = {
  baixa: "bg-yellow-100 text-yellow-800 border-yellow-300",
  media: "bg-orange-100 text-orange-800 border-orange-300",
  alta: "bg-red-100 text-red-800 border-red-300"
};

export default function IncidentFeed({ incidents, onClose, userLocation, onFocusIncident }) {
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [maxDistance, setMaxDistance] = useState(10);

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

  const filteredIncidents = incidents
    .map(incident => ({
      ...incident,
      distance: calculateDistance(
        userLocation[0], userLocation[1],
        incident.latitude, incident.longitude
      )
    }))
    .filter(incident => {
      if (filterType !== "all" && incident.type !== filterType) return false;
      if (filterSeverity !== "all" && incident.severity !== filterSeverity) return false;
      if (incident.distance > maxDistance) return false;
      return true;
    })
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="fixed top-20 left-2 right-2 sm:left-4 sm:right-auto sm:w-96 z-[800]">
      <Card className="shadow-2xl border-2 border-orange-200">
        <CardHeader className="pb-3 p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Incidentes Próximos
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(incidentTypes).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Gravidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[50vh]">
            <div className="space-y-2 pr-4">
              {filteredIncidents.map((incident) => {
                const config = incidentTypes[incident.type] || incidentTypes.outro;
                const Icon = config.icon;

                return (
                  <div
                    key={incident.id}
                    onClick={() => onFocusIncident(incident)}
                    className="p-3 bg-white border rounded-lg hover:border-orange-400 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className={`w-8 h-8 ${config.color} rounded-full flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900">{config.label}</p>
                        <Badge className={`${severityStyles[incident.severity]} text-xs mt-1`}>
                          {incident.severity}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {incident.distance < 1 
                          ? `${(incident.distance * 1000).toFixed(0)}m`
                          : `${incident.distance.toFixed(1)}km`
                        }
                      </Badge>
                    </div>
                    {incident.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{incident.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{incident.created_by?.split('@')[0]}</span>
                      <span>{format(new Date(incident.created_date), "dd/MM HH:mm", { locale: ptBR })}</span>
                    </div>
                  </div>
                );
              })}
              {filteredIncidents.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500">
                  Nenhum incidente encontrado nos filtros selecionados
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
