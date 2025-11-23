
import React, { useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

const isValidCoordinate = (coord) => {
  return coord !== null && coord !== undefined && !isNaN(coord) && isFinite(coord);
};

const isValidPosition = (position) => {
  if (!position || !Array.isArray(position) || position.length !== 2) return false;
  return isValidCoordinate(position[0]) && isValidCoordinate(position[1]);
};

const createMiniUserIcon = () => {
  return L.divIcon({
    html: `
      <div style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8" fill="#3b82f6" opacity="0.3">
            <animate attributeName="r" values="8;10;8" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="10" cy="10" r="5" fill="#3b82f6"/>
          <circle cx="10" cy="10" r="2" fill="white"/>
        </svg>
      </div>
    `,
    className: 'mini-user-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

function MapViewController({ center, bounds }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (bounds && bounds.length > 0) {
      const validBounds = bounds.filter(isValidPosition);
      if (validBounds.length > 0) {
        map.fitBounds(validBounds, { padding: [20, 20] });
      }
    } else if (center && isValidPosition(center)) {
      map.setView(center, 13);
    }
  }, [center, bounds, map]);
  
  return null;
}

export default function MiniMap({ route, userPosition, isNavigating, onExpand, isExpanded, onClose }) {
  if (!isNavigating || !route) return null;

  const validRouteCoords = route.coordinates && Array.isArray(route.coordinates) 
    ? route.coordinates.filter(isValidPosition) 
    : [];

  const bounds = validRouteCoords.length > 0 
    ? validRouteCoords
    : null;

  const center = isValidPosition(userPosition) 
    ? userPosition 
    : (validRouteCoords.length > 0 ? validRouteCoords[0] : [-23.5505, -46.6333]);

  if (!isValidPosition(center)) {
    return null;
  }

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Visão Geral da Rota</h3>
              <p className="text-xs text-indigo-100">
                📏 {route.distance_km?.toFixed(1)} km • ⏱️ {route.duration_minutes} min
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-indigo-700 rounded-full"
              >
                <Minimize2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-indigo-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 relative">
            <MapContainer
              center={center}
              zoom={13}
              className="h-full w-full"
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapViewController center={center} bounds={bounds} />
              
              {validRouteCoords.length > 0 && (
                <Polyline
                  positions={validRouteCoords}
                  pathOptions={{
                    color: "#6366f1",
                    weight: 5,
                    opacity: 0.8,
                  }}
                />
              )}
              
              {isValidPosition(userPosition) && (
                <Marker position={userPosition} icon={createMiniUserIcon()} />
              )}
            </MapContainer>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-indigo-50 p-3 border-t text-center">
            <p className="text-sm text-gray-600">
              🔵 Posição atual • 🛣️ Rota planejada
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className="absolute top-4 right-4 z-[900] w-56 h-56 overflow-hidden shadow-2xl border-4 border-indigo-400 cursor-pointer hover:scale-105 transition-all group"
      onClick={onExpand}
    >
      <div className="relative h-full">
        <MapContainer
          center={center}
          zoom={12}
          className="h-full w-full"
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapViewController center={center} bounds={bounds} />
          
          {validRouteCoords.length > 0 && (
            <Polyline
              positions={validRouteCoords}
              pathOptions={{
                color: "#6366f1",
                weight: 4,
                opacity: 0.8,
              }}
            />
          )}
          
          {isValidPosition(userPosition) && (
            <Marker position={userPosition} icon={createMiniUserIcon()} />
          )}
        </MapContainer>

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold">
            Mini-Mapa
          </div>
          <div className="bg-indigo-600 text-white p-1.5 rounded-full group-hover:bg-indigo-700 transition-colors">
            <Maximize2 className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Card>
  );
}
