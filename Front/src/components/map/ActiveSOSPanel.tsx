import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

export default function ActiveSOSPanel({ sosAlerts, userLocation }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  if (isClosed || !sosAlerts || sosAlerts.length === 0) {
    return null;
  }

  const alertsWithDistance = sosAlerts.map(alert => ({
    ...alert,
    distance: calculateDistance(
      userLocation[0], userLocation[1],
      alert.latitude, alert.longitude
    )
  })).sort((a, b) => a.distance - b.distance);

  const closestAlerts = alertsWithDistance.slice(0, 3);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-[350]">
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-red-600 hover:bg-red-700 shadow-2xl h-12 px-4 rounded-full"
        >
          <AlertCircle className="w-5 h-5 mr-2 animate-pulse" />
          <span className="font-bold">{sosAlerts.length} SOS Ativo{sosAlerts.length > 1 ? 's' : ''}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:w-96 z-[350]">
      <Card className="shadow-2xl border-2 border-red-400 bg-gradient-to-br from-red-50 to-white">
        <CardHeader className="pb-3 p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5 animate-pulse" />
              SOS Ativos ({sosAlerts.length})
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(true)}
                className="h-8 w-8 text-gray-600 hover:text-gray-900"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsClosed(true)}
                className="h-8 w-8 text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2 max-h-[40vh] overflow-y-auto">
          {closestAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3 bg-white border-2 border-red-200 rounded-lg hover:border-red-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">
                    {alert.user_name || alert.created_by?.split('@')[0]}
                  </p>
                  {alert.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{alert.description}</p>
                  )}
                </div>
                <Badge className="bg-red-500 text-white text-xs shrink-0 ml-2">
                  {formatDistance(alert.distance)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{format(new Date(alert.created_date), "HH:mm", { locale: ptBR })}</span>
                {alert.responders && alert.responders.length > 0 && (
                  <span className="text-blue-600 font-semibold">
                    {alert.responders.length} respondeu
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
