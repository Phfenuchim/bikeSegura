import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Navigation, Flag } from "lucide-react";

export default function RouteQueue({ routes, currentRouteIndex, currentRouteProgress }) {
  if (!routes || routes.length === 0) return null;

  return (
    <Card className="absolute top-20 right-4 w-72 z-[1000] shadow-2xl border-2 border-indigo-400">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Navigation className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-sm">Navegação Multi-Rota</h3>
        </div>

        <div className="space-y-3">
          {routes.map((route, index) => {
            const isCompleted = index < currentRouteIndex;
            const isCurrent = index === currentRouteIndex;
            const isPending = index > currentRouteIndex;

            return (
              <div
                key={index}
                className={`relative pl-6 pb-3 ${
                  index < routes.length - 1 ? 'border-l-2' : ''
                } ${
                  isCompleted ? 'border-green-400' :
                  isCurrent ? 'border-indigo-500' : 'border-gray-300'
                }`}
              >
                <div className={`absolute left-0 top-0 -translate-x-1/2 ${
                  isCompleted ? 'text-green-500' :
                  isCurrent ? 'text-indigo-600' : 'text-gray-400'
                }`}>
                  {index === 0 ? (
                    <Navigation className="w-5 h-5 bg-white rounded-full" />
                  ) : index === routes.length - 1 ? (
                    <Flag className="w-5 h-5 bg-white rounded-full" />
                  ) : (
                    isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 bg-white rounded-full" />
                    ) : (
                      <Circle className="w-5 h-5 bg-white rounded-full" />
                    )
                  )}
                </div>

                <div className={`rounded-lg p-2 ${
                  isCompleted ? 'bg-green-50' :
                  isCurrent ? 'bg-indigo-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-bold ${
                      isCompleted ? 'text-green-900' :
                      isCurrent ? 'text-indigo-900' : 'text-gray-600'
                    }`}>
                      {index === 0 && routes.length > 1 ? '🚴 Acesso' : route.name || `Rota ${index + 1}`}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {route.distance_km?.toFixed(1)}km
                    </Badge>
                  </div>

                  {isCurrent && currentRouteProgress !== null && (
                    <div className="mt-2">
                      <Progress value={currentRouteProgress} className="h-1.5" />
                      <p className="text-xs text-indigo-600 mt-1 text-right">
                        {currentRouteProgress}%
                      </p>
                    </div>
                  )}

                  {isCompleted && (
                    <Badge className="bg-green-500 text-white text-xs mt-1">
                      ✓ Concluída
                    </Badge>
                  )}

                  {isPending && (
                    <p className="text-xs text-gray-500 mt-1">Aguardando...</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progresso Total</span>
            <span className="font-bold text-indigo-600">
              {currentRouteIndex + 1} / {routes.length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
