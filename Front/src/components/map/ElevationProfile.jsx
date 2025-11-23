import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mountain, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { base44 } from "@/api/base44Client";

export default function ElevationProfile({ route }) {
  const [elevationData, setElevationData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (route?.coordinates && route.coordinates.length > 0) {
      fetchElevationData();
    }
  }, [route]);

  const fetchElevationData = async () => {
    setIsLoading(true);
    try {
      const samples = Math.min(route.coordinates.length, 50);
      const step = Math.floor(route.coordinates.length / samples);
      const sampledCoords = [];
      
      for (let i = 0; i < route.coordinates.length; i += step) {
        sampledCoords.push(route.coordinates[i]);
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Gere dados de elevação simulados realistas para uma rota de ciclismo em São Paulo com ${sampledCoords.length} pontos. 
        A rota tem ${route.distance_km.toFixed(1)}km.
        Retorne elevações em metros variando entre 700m e 850m (típico de São Paulo), com variações realistas.
        Crie subidas e descidas graduais, não mudanças abruptas.`,
        response_json_schema: {
          type: "object",
          properties: {
            elevations: {
              type: "array",
              items: { type: "number" }
            }
          }
        }
      });

      const elevations = result.elevations || [];
      const chartData = elevations.map((elevation, idx) => ({
        distance: ((idx / elevations.length) * route.distance_km).toFixed(1),
        elevation: Math.round(elevation)
      }));

      const maxElevation = Math.max(...elevations);
      const minElevation = Math.min(...elevations);
      const totalGain = elevations.reduce((gain, curr, idx) => {
        if (idx === 0) return 0;
        const diff = curr - elevations[idx - 1];
        return gain + (diff > 0 ? diff : 0);
      }, 0);

      setElevationData(chartData);
      setStats({
        max: Math.round(maxElevation),
        min: Math.round(minElevation),
        gain: Math.round(totalGain)
      });
    } catch (error) {
      console.error("Error fetching elevation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!route) return null;

  return (
    <Card className="border-2 border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mountain className="w-5 h-5 text-amber-600" />
          Perfil de Elevação
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Calculando elevação...</p>
          </div>
        ) : elevationData.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
                <TrendingUp className="w-4 h-4 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Ganho</p>
                <p className="text-sm font-bold text-green-900">{stats?.gain}m</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-200">
                <Mountain className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Máxima</p>
                <p className="text-sm font-bold text-amber-900">{stats?.max}m</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-200">
                <TrendingDown className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Mínima</p>
                <p className="text-sm font-bold text-blue-900">{stats?.min}m</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={elevationData}>
                <defs>
                  <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="distance" 
                  label={{ value: 'Distância (km)', position: 'insideBottom', offset: -5 }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  label={{ value: 'Elevação (m)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={(value) => `${value} km`}
                  formatter={(value) => [`${value}m`, 'Elevação']}
                />
                <Area 
                  type="monotone" 
                  dataKey="elevation" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fill="url(#elevationGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        ) : (
          <p className="text-center text-gray-500 text-sm py-4">
            Calcule uma rota para ver o perfil de elevação
          </p>
        )}
      </CardContent>
    </Card>
  );
}