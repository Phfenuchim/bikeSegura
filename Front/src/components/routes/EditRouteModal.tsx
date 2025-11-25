import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, RefreshCw, MapPin, Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AddressAutocomplete from "../map/AddressAutocomplete";

export default function EditRouteModal({ route, onClose, onRecalculate }) {
  const [name, setName] = useState(route.name);
  const [description, setDescription] = useState(route.description || "");
  const [startAddress, setStartAddress] = useState(route.start_address);
  const [endAddress, setEndAddress] = useState(route.end_address);
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);

  const queryClient = useQueryClient();

  const updateRouteMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedRoute.update(route.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routes'] });
      onClose();
    },
  });

  const handleSave = () => {
    updateRouteMutation.mutate({
      name,
      description,
      start_address: startAddress,
      end_address: endAddress
    });
  };

  const handleRecalculate = () => {
    if (!startCoords || !endCoords) {
      alert("Selecione novos endereços de origem e destino");
      return;
    }
    
    onRecalculate({
      routeId: route.id,
      startCoords,
      endCoords,
      startAddress,
      endAddress
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Rota</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name" className="font-semibold">Nome da Rota</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Casa → Trabalho"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description" className="font-semibold">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione notas sobre esta rota..."
              className="mt-1 h-24"
            />
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-bold text-gray-900 mb-3">🔄 Recalcular Rota</h4>
            <p className="text-sm text-gray-600 mb-4">
              Altere os endereços para encontrar uma nova rota entre esses pontos
            </p>

            <div className="space-y-3">
              <div>
                <Label className="flex items-center gap-2 font-semibold">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Nova Origem
                </Label>
                <AddressAutocomplete
                  id="edit-origin"
                  value={startAddress}
                  onChange={setStartAddress}
                  onSelect={(s) => setStartCoords({ lat: s.lat, lon: s.lon })}
                  placeholder="Digite novo endereço de origem"
                  referencePoint={null}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 font-semibold">
                  <Target className="w-4 h-4 text-blue-600" />
                  Novo Destino
                </Label>
                <AddressAutocomplete
                  id="edit-destination"
                  value={endAddress}
                  onChange={setEndAddress}
                  onSelect={(s) => setEndCoords({ lat: s.lat, lon: s.lon })}
                  placeholder="Digite novo endereço de destino"
                  referencePoint={startCoords}
                />
              </div>

              <Button
                onClick={handleRecalculate}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!startCoords || !endCoords}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recalcular Rota
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateRouteMutation.isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
