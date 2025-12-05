import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, Square } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function LiveLocationSharing({ eventId = null, sosAlertId = null, isActive = false, onToggle }) {
  const [isSharing, setIsSharing] = useState(isActive);
  const [locationId, setLocationId] = useState(null);
  const watchIdRef = useRef(null);
  const queryClient = useQueryClient();

  const createLiveLocationMutation = useMutation({
    mutationFn: async (locationData) => {
      return base44.entities.LiveLocation.create(locationData);
    },
  });

  const updateLiveLocationMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.LiveLocation.update(id, data);
    },
  });

  const stopSharingMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.LiveLocation.update(id, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-locations'] });
    },
  });

  useEffect(() => {
    if (isSharing) {
      startSharing();
    } else {
      stopSharing();
    }

    return () => {
      stopSharing();
    };
  }, [isSharing]);

  const startSharing = async () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não disponível");
      return;
    }

    const user = await base44.auth.me();

    const updateLocation = async (position) => {
      const locationData = {
        user_email: user.email,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed ? (position.coords.speed * 3.6) : 0,
        heading: position.coords.heading || 0,
        is_active: true,
        ...(eventId && { event_id: eventId }),
        ...(sosAlertId && { sos_alert_id: sosAlertId })
      };

      if (!locationId) {
        const created = await createLiveLocationMutation.mutateAsync(locationData);
        setLocationId(created.id);
      } else {
        await updateLiveLocationMutation.mutateAsync({
          id: locationId,
          data: locationData
        });
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => console.error("Location error:", error),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (locationId) {
      stopSharingMutation.mutate(locationId);
      setLocationId(null);
    }
  };

  const handleToggle = () => {
    const newState = !isSharing;
    setIsSharing(newState);
    if (onToggle) onToggle(newState);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border-2 border-blue-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Navigation className={`w-5 h-5 ${isSharing ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`} />
          <span className="text-sm font-bold text-gray-900">Localização ao Vivo</span>
        </div>
        {isSharing && (
          <Badge className="bg-blue-600 text-white animate-pulse">
            🔴 AO VIVO
          </Badge>
        )}
      </div>
      <Button
        onClick={handleToggle}
        className={`w-full ${isSharing ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        size="sm"
      >
        {isSharing ? (
          <>
            <Square className="w-4 h-4 mr-2" />
            Parar Compartilhamento
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4 mr-2" />
            Compartilhar Localização
          </>
        )}
      </Button>
    </div>
  );
}
