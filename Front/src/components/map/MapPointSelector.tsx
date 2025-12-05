import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Target, AlertCircle, X, Check } from "lucide-react";

export default function MapPointSelector({ mode, onCancel, onConfirm, coordinates }) {
  const config = {
    origin: {
      icon: MapPin,
      title: "📍 Origem",
      color: "emerald"
    },
    destination: {
      icon: Target,
      title: "🎯 Destino",
      color: "blue"
    },
    incident: {
      icon: AlertCircle,
      title: "⚠️ Incidente",
      color: "red"
    }
  };

  const current = config[mode] || config.origin;
  const Icon = current.icon;

  return (
    <>
      {/* Card compacto na parte inferior */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[999] w-full max-w-md px-4">
        <Card className={`shadow-2xl border-4 ${
          coordinates ? 'border-green-500 bg-green-50' : `border-${current.color}-500 bg-white`
        } animate-in slide-in-from-bottom`}>
          <CardContent className="p-4">
            {coordinates ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                      <Check className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900">Ponto Selecionado!</h3>
                      <p className="text-xs text-green-700">
                        {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={onConfirm}
                    className="bg-green-600 hover:bg-green-700 text-white h-12 px-6"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Confirmar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-${current.color}-500 rounded-full flex items-center justify-center animate-pulse`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{current.title}</h3>
                    <p className="text-sm text-gray-600">👆 Toque no mapa</p>
                  </div>
                </div>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="h-12"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Indicadores laterais sutis */}
      <div className="fixed top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-transparent via-blue-400 to-transparent z-[998] pointer-events-none opacity-40" />
      <div className="fixed top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-transparent via-blue-400 to-transparent z-[998] pointer-events-none opacity-40" />
    </>
  );
}
