import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const locationTypes = [
  { value: "bicicletaria", label: "Bicicletaria" },
  { value: "bebedouro", label: "Bebedouro" },
  { value: "banheiro_publico", label: "Banheiro Público" },
  { value: "estacionamento_bike", label: "Bicicletário" },
  { value: "posto_apoio", label: "Posto de Apoio" },
  { value: "loja_conveniencia", label: "Loja de Conveniência" }
];

export default function AddSupportLocation({ position, onClose }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState("");
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const locationMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.SupportLocation.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-locations'] });
      onClose();
    },
  });

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  };

  const removeService = (service) => {
    setServices(services.filter(s => s !== service));
  };

  const handleSubmit = () => {
    if (!name || !type) {
      alert("Por favor, preencha nome e tipo do local");
      return;
    }

    setIsSubmitting(true);

    locationMutation.mutate({
      name,
      type,
      description,
      latitude: position[0],
      longitude: position[1],
      address,
      phone,
      hours,
      services,
      status: "pendente",
      votes: 0
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sugerir Local de Apoio</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Ajude a comunidade sugerindo locais úteis para ciclistas! Outros usuários poderão validar sua sugestão.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Local *</Label>
            <Input
              id="name"
              placeholder="Ex: Bike Shop Centro"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {locationTypes.map((lt) => (
                  <SelectItem key={lt.value} value={lt.value}>
                    {lt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              placeholder="Ex: Rua das Flores, 123"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 9999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Horário</Label>
              <Input
                id="hours"
                placeholder="8h-18h"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Informações adicionais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Serviços Oferecidos</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Reparo de pneus"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addService()}
              />
              <Button type="button" onClick={addService} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {services.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {services.map((service, idx) => (
                  <Badge key={idx} variant="secondary" className="cursor-pointer">
                    {service}
                    <X
                      className="w-3 h-3 ml-1"
                      onClick={() => removeService(service)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
            <strong>Localização:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Enviando..." : "Enviar Sugestão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}