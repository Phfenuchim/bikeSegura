import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Mountain, Camera, Zap, Loader2, Navigation } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AISuggestions({ userLevel, userLocation, onSelectSuggestion, onUseAsDestination }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    region: "proxima",
    view: "qualquer",
    focus: "equilibrada"
  });

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const regionText = {
        proxima: "próximas à localização atual",
        centro: "na região central da cidade",
        parques: "em parques e áreas verdes",
        ciclovia: "com ciclovias estruturadas",
        litoral: "próximas ao litoral ou praias"
      }[preferences.region];

      const viewText = {
        qualquer: "variadas",
        natureza: "com muita natureza e vegetação",
        urbana: "urbanas e movimentadas",
        historica: "com pontos históricos e culturais",
        moderna: "em áreas modernas e comerciais"
      }[preferences.view];

      const focusText = {
        equilibrada: "equilibradas entre desafio e prazer",
        treino: "focadas em treino e performance",
        lazer: "relaxantes e para lazer",
        turismo: "turísticas com pontos de interesse"
      }[preferences.focus];

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente de ciclismo. Baseado no nível ${userLevel} do ciclista (1-20), sugira 3 rotas ${focusText} ${regionText} nas coordenadas [${userLocation[0]}, ${userLocation[1]}].
        
        As rotas devem ter vistas ${viewText}.
        
        Para cada rota, retorne:
        - name: nome atrativo e específico da rota (ex: "Parque Ibirapuera ao MASP")
        - description: descrição breve e motivadora (máx 100 caracteres)
        - destination_address: endereço completo e específico do destino final (rua, número, bairro, cidade)
        - type: "scenic" (cênica), "challenging" (desafiadora) ou "relaxing" (relaxante)
        - estimated_distance: distância estimada realista em km
        - difficulty: baseado no nível do usuário (facil, moderada, dificil)
        - highlights: array de 2-3 destaques específicos da rota
        
        IMPORTANTE: O destination_address deve ser um endereço real, completo e específico que possa ser encontrado no Google Maps.
        Nível 1-5 = rotas fáceis, 6-12 = moderadas, 13+ = difíceis.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            routes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  destination_address: { type: "string" },
                  type: { type: "string" },
                  estimated_distance: { type: "number" },
                  difficulty: { type: "string" },
                  highlights: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setSuggestions(result.routes || []);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      alert("Erro ao gerar sugestões. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const typeIcons = {
    scenic: { icon: Camera, color: "bg-blue-500", label: "Cênica" },
    challenging: { icon: Mountain, color: "bg-red-500", label: "Desafiadora" },
    relaxing: { icon: Zap, color: "bg-green-500", label: "Relaxante" }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Sugestões com IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Região</label>
              <Select value={preferences.region} onValueChange={(v) => setPreferences({...preferences, region: v})}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proxima">📍 Próxima à mim</SelectItem>
                  <SelectItem value="centro">🏛️ Centro da cidade</SelectItem>
                  <SelectItem value="parques">🌳 Parques e áreas verdes</SelectItem>
                  <SelectItem value="ciclovia">🚴 Com ciclovias</SelectItem>
                  <SelectItem value="litoral">🌊 Litoral e praias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Vista</label>
              <Select value={preferences.view} onValueChange={(v) => setPreferences({...preferences, view: v})}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualquer">✨ Qualquer</SelectItem>
                  <SelectItem value="natureza">🌿 Natureza</SelectItem>
                  <SelectItem value="urbana">🏙️ Urbana</SelectItem>
                  <SelectItem value="historica">🏛️ Histórica</SelectItem>
                  <SelectItem value="moderna">🏢 Moderna</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Foco</label>
              <Select value={preferences.focus} onValueChange={(v) => setPreferences({...preferences, focus: v})}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equilibrada">⚖️ Equilibrada</SelectItem>
                  <SelectItem value="treino">💪 Treino</SelectItem>
                  <SelectItem value="lazer">😊 Lazer</SelectItem>
                  <SelectItem value="turismo">📸 Turismo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-center py-3 border-t">
              <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-2" />
              <p className="text-xs text-gray-600 mb-3">
                IA personalizada para seu nível!
              </p>
              <Button
                onClick={generateSuggestions}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 w-full h-10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Sugestões
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, idx) => {
              const typeConfig = typeIcons[suggestion.type] || typeIcons.relaxing;
              const Icon = typeConfig.icon;
              
              return (
                <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`w-10 h-10 ${typeConfig.color} rounded-full flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm mb-1">{suggestion.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                        {suggestion.destination_address && (
                          <p className="text-xs text-gray-500 mb-2">📍 {suggestion.destination_address}</p>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            📏 ~{suggestion.estimated_distance}km
                          </Badge>
                          <Badge className={`text-xs ${
                            suggestion.difficulty === 'facil' ? 'bg-green-100 text-green-800' :
                            suggestion.difficulty === 'moderada' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {suggestion.difficulty}
                          </Badge>
                        </div>
                        {suggestion.highlights && suggestion.highlights.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {suggestion.highlights.map((h, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">✨ {h}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => onUseAsDestination?.(suggestion.destination_address, suggestion.name)}
                      className="w-full h-9 bg-emerald-600 hover:bg-emerald-700"
                      size="sm"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Usar como Destino
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            <Button
              onClick={generateSuggestions}
              disabled={isLoading}
              variant="outline"
              className="w-full h-9"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Novas Sugestões
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
