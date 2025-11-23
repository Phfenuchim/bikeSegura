
import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Star, ThumbsUp, Navigation } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const isValidCoordinate = (coord) => {
  return coord !== null && coord !== undefined && !isNaN(coord) && isFinite(coord);
};

const locationTypeConfig = {
  bicicletaria: { icon: '🔧', color: '#f59e0b', label: 'Bicicletaria' },
  bebedouro: { icon: '💧', color: '#3b82f6', label: 'Bebedouro' },
  banheiro_publico: { icon: '🚻', color: '#8b5cf6', label: 'Banheiro' },
  estacionamento_bike: { icon: '🅿️', color: '#10b981', label: 'Estacionamento' },
  posto_apoio: { icon: '🏥', color: '#ef4444', label: 'Posto de Apoio' },
  loja_conveniencia: { icon: '🏪', color: '#f97316', label: 'Conveniência' }
};

const getSupportLocationIcon = (type) => {
  const config = locationTypeConfig[type] || { icon: '📍', color: '#6b7280' };
  
  return L.divIcon({
    html: `
      <div style="
        background: ${config.color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 18px;
      ">
        ${config.icon}
      </div>
    `,
    className: 'support-location-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export default function SupportLocations({ locations, onSelectLocation }) {
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: async ({ locationId, location }) => {
      const user = await base44.auth.me();
      const votedBy = location.voted_by || [];
      
      if (votedBy.includes(user.email)) {
        throw new Error("Você já votou neste local");
      }

      return base44.entities.SupportLocation.update(locationId, {
        votes: (location.votes || 0) + 1,
        voted_by: [...votedBy, user.email]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-locations'] });
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const handleVote = (location) => {
    voteMutation.mutate({ locationId: location.id, location });
  };

  const handleNavigate = (location) => {
    if (onSelectLocation) {
      onSelectLocation(location);
    }
  };

  return (
    <>
      {locations.filter(location => 
        location && 
        isValidCoordinate(location.latitude) && 
        isValidCoordinate(location.longitude)
      ).map((location) => {
        const config = locationTypeConfig[location.type] || { label: location.type };
        
        return (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={getSupportLocationIcon(location.type)}
          >
            <Popup>
              <div className="p-2 min-w-[250px]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-lg mb-1">{config.icon}</div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {location.name}
                    </h3>
                    <p className="text-xs text-gray-500">{config.label}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    <Star className="w-3 h-3 mr-1" />
                    {location.votes || 0}
                  </Badge>
                </div>

                {location.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {location.description}
                  </p>
                )}

                <div className="space-y-1 text-xs mb-3">
                  {location.address && (
                    <div className="flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{location.address}</span>
                    </div>
                  )}
                  
                  {location.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">{location.phone}</span>
                    </div>
                  )}
                  
                  {location.hours && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">{location.hours}</span>
                    </div>
                  )}
                </div>

                {location.services && location.services.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Serviços:</p>
                    <div className="flex flex-wrap gap-1">
                      {location.services.map((service, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-blue-50">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleNavigate(location)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Navegar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVote(location)}
                    disabled={voteMutation.isLoading}
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    Útil
                  </Button>
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Por: {location.created_by?.split('@')[0]}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
