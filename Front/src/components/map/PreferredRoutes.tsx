import { Polyline, Popup } from "react-leaflet";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MapPin } from "lucide-react";

const difficultyColors = {
  facil: { color: "#10b981", label: "Fácil" },
  moderada: { color: "#f59e0b", label: "Moderada" },
  dificil: { color: "#ef4444", label: "Difícil" }
};

const isValidCoordinate = (coord) => {
  return coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' && 
         !isNaN(coord.lat) && !isNaN(coord.lng) && isFinite(coord.lat) && isFinite(coord.lng);
};

export default function PreferredRoutes({ routes }) {
  return (
    <>
      {routes.filter(route => 
        route && 
        Array.isArray(route.coordinates) && 
        route.coordinates.length > 1 &&
        route.coordinates.every(isValidCoordinate)
      ).map((route) => {
        const coords = route.coordinates.map(c => [c.lat, c.lng]);
        const difficulty = difficultyColors[route.difficulty] || difficultyColors.moderada;
        
        return (
          <Polyline
            key={route.id}
            positions={coords}
            pathOptions={{
              color: difficulty.color,
              weight: 5,
              opacity: 0.7,
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-emerald-700 mb-2">{route.name}</h3>
                
                {route.description && (
                  <p className="text-sm text-gray-600 mb-2">{route.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge className="bg-emerald-100 text-emerald-800">
                    {difficulty.label}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {route.votes} votos
                  </Badge>
                </div>

                {route.tags && route.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {route.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  {route.distance_km && `${route.distance_km.toFixed(1)} km`}
                </div>
                
                <p className="text-xs text-gray-400 mt-2">
                  Sugerido por {route.created_by?.split('@')[0]}
                </p>
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
}
