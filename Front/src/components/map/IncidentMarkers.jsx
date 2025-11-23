
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { AlertTriangle, Construction, ShieldAlert, Lightbulb, MapPin, MessageSquare, Languages } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { base44 } from "@/api/base44Client";

const isValidCoordinate = (coord) => {
  return coord !== null && coord !== undefined && !isNaN(coord) && isFinite(coord);
};

const getIncidentIcon = (type, severity) => {
  const colors = {
    assalto: '#ef4444',
    obra: '#f97316',
    buraco: '#f59e0b',
    iluminacao_precaria: '#a855f7',
    outro: '#6b7280'
  };

  const color = colors[type] || colors.outro;
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    `,
    className: 'custom-incident-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const typeLabels = {
  assalto: 'Assalto',
  obra: 'Obra',
  buraco: 'Buraco',
  iluminacao_precaria: 'Iluminação Precária',
  outro: 'Outro'
};

const severityLabels = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta'
};

const severityColors = {
  baixa: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  media: 'bg-orange-100 text-orange-800 border-orange-200',
  alta: 'bg-red-100 text-red-800 border-red-200'
};

export default function IncidentMarkers({ incidents, onValidate }) {
  const [translatedTexts, setTranslatedTexts] = useState({});
  const [translatingId, setTranslatingId] = useState(null);

  const translateText = async (text, incidentId) => {
    if (!text) return;
    
    setTranslatingId(incidentId);
    try {
      const currentLang = localStorage.getItem('app_language') || 'pt';
      const targetLang = currentLang === 'pt' ? 'en' : 'pt';
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate this ${currentLang === 'pt' ? 'Portuguese' : 'English'} text to ${targetLang === 'en' ? 'English' : 'Portuguese'}. Return ONLY the translation, nothing else: "${text}"`,
        response_json_schema: null
      });

      setTranslatedTexts(prev => ({
        ...prev,
        [incidentId]: result
      }));
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setTranslatingId(null);
    }
  };

  return (
    <>
      {incidents.filter(incident => 
        incident && 
        isValidCoordinate(incident.latitude) && 
        isValidCoordinate(incident.longitude)
      ).map((incident) => {
        const displayText = translatedTexts[incident.id] || incident.description;

        return (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
            icon={getIncidentIcon(incident.type, incident.severity)}
          >
            <Popup maxWidth={280}>
              <div className="p-2">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 text-sm">
                    {typeLabels[incident.type] || incident.type}
                  </h3>
                  <Badge className={`text-xs ${severityColors[incident.severity]}`}>
                    {severityLabels[incident.severity]}
                  </Badge>
                </div>
                
                {incident.description && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Descrição:</span>
                      <button
                        onClick={() => translateText(incident.description, incident.id)}
                        disabled={translatingId === incident.id}
                        className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"
                      >
                        <Languages className="w-3 h-3" />
                        {translatingId === incident.id ? '...' : 'Traduzir'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {displayText}
                    </p>
                  </div>
                )}
                
                {incident.validation_score !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mb-2">
                    ✓ {incident.validation_score} validações
                  </div>
                )}
                
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <span>{incident.created_by?.split('@')[0]}</span>
                </div>
                
                <div className="text-xs text-gray-400 mb-3">
                  {format(new Date(incident.created_date), "dd/MM HH:mm", { locale: ptBR })}
                </div>

                {onValidate && (
                  <Button
                    size="sm"
                    onClick={() => onValidate(incident)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm py-2"
                  >
                    <MessageSquare className="w-3 h-3 mr-2" />
                    Validar
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
