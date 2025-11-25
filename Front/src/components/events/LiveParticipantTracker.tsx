import React, { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

const createLiveUserIcon = (avatar, color = "#3b82f6") => {
  return L.divIcon({
    html: `
      <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="16" fill="${color}" opacity="0.3">
            <animate attributeName="r" values="16;20;16" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="20" cy="20" r="12" fill="${color}"/>
          <circle cx="20" cy="20" r="10" fill="white" opacity="0.9"/>
        </svg>
        <div style="position: absolute; font-size: 18px; top: 50%; left: 50%; transform: translate(-50%, -50%);">
          ${avatar || '🚴'}
        </div>
      </div>
    `,
    className: 'live-user-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export default function LiveParticipantTracker({ eventId, allUsers }) {
  const { data: liveLocations = [] } = useQuery({
    queryKey: ['live-locations', eventId],
    queryFn: () => base44.entities.LiveLocation.filter({ 
      event_id: eventId, 
      is_active: true 
    }),
    refetchInterval: 5000,
    enabled: !!eventId,
  });

  return (
    <>
      {liveLocations.map((location) => {
        const user = allUsers?.find(u => u.email === location.user_email);
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
        const colorIndex = liveLocations.findIndex(l => l.id === location.id);
        const color = colors[colorIndex % colors.length];
        
        return (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={createLiveUserIcon(user?.avatar, color)}
          >
            <Popup>
              <div className="text-center p-2">
                <p className="font-bold text-sm">{user?.full_name || location.user_email.split('@')[0]}</p>
                <Badge className="mt-1 text-xs">🚴 Ao Vivo</Badge>
                {location.speed && (
                  <p className="text-xs text-gray-600 mt-1">
                    {location.speed.toFixed(1)} km/h
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
