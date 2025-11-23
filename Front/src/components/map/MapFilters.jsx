import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, MapPin, Route, LifeBuoy, Plus, X } from "lucide-react";

export default function MapFilters({ filters, setFilters, onClose, onAddRoute, onAddLocation }) {
  const handleToggle = (key) => {
    setFilters({ ...filters, [key]: !filters[key] });
  };

  return (
    <div className="fixed bottom-20 left-2 right-2 sm:left-auto sm:right-4 sm:w-80 z-[800]">
      <Card className="shadow-xl border-2 border-emerald-200">
        <CardHeader className="pb-3 p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">Filtros do Mapa</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <Label className="text-sm font-medium cursor-pointer" htmlFor="incidents">
                Incidentes
              </Label>
            </div>
            <Switch
              id="incidents"
              checked={filters.incidents}
              onCheckedChange={() => handleToggle("incidents")}
            />
          </div>

          <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <Label className="text-sm font-medium cursor-pointer" htmlFor="sos">
                Alertas SOS
              </Label>
            </div>
            <Switch
              id="sos"
              checked={filters.sos}
              onCheckedChange={() => handleToggle("sos")}
            />
          </div>

          <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-emerald-600" />
              <Label className="text-sm font-medium cursor-pointer" htmlFor="routes">
                Rotas da Comunidade
              </Label>
            </div>
            <Switch
              id="routes"
              checked={filters.preferredRoutes}
              onCheckedChange={() => handleToggle("preferredRoutes")}
            />
          </div>

          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-blue-600" />
              <Label className="text-sm font-medium cursor-pointer" htmlFor="support">
                Locais de Apoio
              </Label>
            </div>
            <Switch
              id="support"
              checked={filters.supportLocations}
              onCheckedChange={() => handleToggle("supportLocations")}
            />
          </div>

          <div className="pt-3 border-t space-y-2">
            <Button
              onClick={onAddRoute}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Rota
            </Button>
            <Button
              onClick={onAddLocation}
              variant="outline"
              className="w-full h-10 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Sugerir Local de Apoio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}