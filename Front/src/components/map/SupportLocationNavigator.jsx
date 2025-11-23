import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Phone, Clock, X, Wrench } from "lucide-react";

const locationTypeLabels = {
  bicicletaria: "🔧 Bicicletaria",
  bebedouro: "💧 Bebedouro",
  banheiro_publico: "🚻 Banheiro Público",
  estacionamento_bike: "🅿️ Estacionamento de Bikes",
  posto_apoio: "🏪 Posto de Apoio",
  loja_conveniencia: "🏪 Loja de Conveniência"
};

export default function SupportLocationNavigator({ location, onNavigate, onClose }) {
  const handleNavigate = () => {
    // Passa a localização de apoio para o navegador
    onNavigate(location);
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[999] w-full max-w-md px-4">
      <Card className="shadow-2xl border-4 border-blue-400 animate-in slide-in-from-bottom-4">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <Badge className="mb-2 bg-blue-100 text-blue-800">
                {locationTypeLabels[location.type] || location.type}
              </Badge>
              <h3 className="font-bold text-xl text-gray-900">{location.name}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {location.description && (
            <p className="text-gray-700 text-sm mb-4">{location.description}</p>
          )}

          <div className="space-y-3 mb-4">
            {location.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{location.address}</span>
              </div>
            )}

            {location.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <a href={`tel:${location.phone}`} className="text-blue-600 hover:underline">
                  {location.phone}
                </a>
              </div>
            )}

            {location.hours && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="text-gray-700">{location.hours}</span>
              </div>
            )}

            {location.services && location.services.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <Wrench className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {location.services.map((service, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleNavigate}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-6"
          >
            <Navigation className="w-5 h-5 mr-2" />
            Navegar até aqui
          </Button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Criado por {location.created_by?.split('@')[0] || 'Anônimo'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}