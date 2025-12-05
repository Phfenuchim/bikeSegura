import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Navigation, 
  MapPin, 
  Target, 
  TrendingUp, 
  Users, 
  ThumbsUp, 
  Star,
  Info,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RouteDetailsModal({ route, onClose, onNavigate, avgRating, ratingCount }) {
  const difficultyColors = {
    facil: { bg: 'bg-green-100', text: 'text-green-800', label: 'Fácil' },
    moderada: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Moderada' },
    dificil: { bg: 'bg-red-100', text: 'text-red-800', label: 'Difícil' }
  };

  const difficulty = difficultyColors[route.difficulty] || difficultyColors.moderada;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            {route.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {/* Avaliação */}
            {avgRating > 0 && (
              <Card className="border-2 border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-6 h-6 text-amber-500 fill-current" />
                      <div>
                        <p className="text-2xl font-bold text-amber-900">{avgRating}</p>
                        <p className="text-xs text-amber-700">{ratingCount} {ratingCount === 1 ? 'avaliação' : 'avaliações'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(avgRating) ? 'text-amber-500 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Descrição */}
            {route.description && (
              <Card className="border-2 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p className="font-semibold text-blue-900">Descrição</p>
                  </div>
                  <p className="text-sm text-gray-700">{route.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Informações Principais */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-2 border-emerald-200">
                <CardContent className="p-4 text-center">
                  <MapPin className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 mb-1">Distância</p>
                  <p className="text-xl font-bold text-emerald-900">{route.distance_km?.toFixed(1)} km</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 mb-1">Dificuldade</p>
                  <Badge className={`${difficulty.bg} ${difficulty.text} text-sm`}>
                    {difficulty.label}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Endereços */}
            <Card className="border-2 border-gray-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Ponto de Partida</p>
                    <p className="text-sm text-gray-900">{route.start_address || "Não especificado"}</p>
                  </div>
                </div>
                <div className="border-t"></div>
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Destino</p>
                    <p className="text-sm text-gray-900">{route.end_address || "Não especificado"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card className="border-2 border-indigo-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <ThumbsUp className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-indigo-900">{route.votes || 0}</p>
                    <p className="text-xs text-gray-600">Votos Positivos</p>
                  </div>
                  <div>
                    <Users className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-indigo-900">{route.voted_by?.length || 0}</p>
                    <p className="text-xs text-gray-600">Pessoas Votaram</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {route.tags && route.tags.length > 0 && (
              <Card className="border-2 border-purple-200">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Características</p>
                  <div className="flex flex-wrap gap-2">
                    {route.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações Adicionais */}
            <Card className="border-2 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar className="w-3 h-3" />
                  <span>Criada em {format(new Date(route.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
                {route.created_by && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <Users className="w-3 h-3" />
                    <span>Por {route.created_by.split('@')[0]}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Fechar
          </Button>
          <Button
            onClick={() => {
              onNavigate();
              onClose();
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Usar Esta Rota
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
