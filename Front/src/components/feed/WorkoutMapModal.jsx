import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";

export default function WorkoutMapModal({ post, onClose }) {
  if (!post.route_coordinates || post.route_coordinates.length === 0) {
    return null;
  }

  const coords = post.route_coordinates
    .filter(c => c && typeof c.lat === 'number' && typeof c.lng === 'number')
    .map(c => [c.lat, c.lng]);

  if (coords.length < 2) {
    return null;
  }

  const center = coords[Math.floor(coords.length / 2)];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{post.route_name || "Trajeto do Treino"}</span>
            <div className="flex gap-2">
              <Badge className="bg-emerald-600 text-white">
                📏 {post.distance_km.toFixed(1)} km
              </Badge>
              <Badge className="bg-blue-600 text-white">
                ⏱️ {post.duration_minutes} min
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="h-[70vh] w-full rounded-lg overflow-hidden">
          <MapContainer
            center={center}
            zoom={14}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Polyline
              positions={coords}
              pathOptions={{
                color: "#10b981",
                weight: 6,
                opacity: 0.8,
                lineCap: "round",
                lineJoin: "round"
              }}
            />

            {coords[0] && (
              <Marker position={coords[0]}>
                <Popup>
                  <div className="text-center text-sm">
                    <p className="font-bold text-emerald-600">🚴 Início</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {coords[coords.length - 1] && (
              <Marker position={coords[coords.length - 1]}>
                <Popup>
                  <div className="text-center text-sm">
                    <p className="font-bold text-blue-600">🎯 Chegada</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}