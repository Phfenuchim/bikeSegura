import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, LifeBuoy, Route, TrendingUp } from "lucide-react";

export default function UserStatistics({ stats }) {
  const statistics = [
    {
      icon: MapPin,
      label: "Incidentes Reportados",
      value: stats.incidents_reported || 0,
      color: "text-orange-600",
      bg: "bg-orange-100"
    },
    {
      icon: LifeBuoy,
      label: "Respostas SOS",
      value: stats.sos_responses || 0,
      color: "text-red-600",
      bg: "bg-red-100"
    },
    {
      icon: Route,
      label: "Rotas Completadas",
      value: stats.routes_completed || 0,
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      icon: TrendingUp,
      label: "Distância Total",
      value: `${(stats.total_distance_km || 0).toFixed(1)} km`,
      color: "text-emerald-600",
      bg: "bg-emerald-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {statistics.map((stat, index) => (
        <Card key={index} className="border-none shadow-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-none shadow-xl md:col-span-2 bg-gradient-to-r from-emerald-50 to-blue-50">
        <CardHeader>
          <CardTitle>Impacto na Comunidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-600 mb-2">
                {((stats.incidents_reported || 0) + (stats.sos_responses || 0))}
              </p>
              <p className="text-sm text-gray-600">Contribuições Totais</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">
                {((stats.incidents_reported || 0) * 5)}
              </p>
              <p className="text-sm text-gray-600">Ciclistas Ajudados</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-600 mb-2">
                {stats.sos_responses || 0}
              </p>
              <p className="text-sm text-gray-600">Emergências Atendidas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}