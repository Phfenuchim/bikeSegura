import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function VoiceNavigation({ currentInstruction, distance, enabled, onToggle }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    setSpeechSupported('speechSynthesis' in window);
  }, []);

  useEffect(() => {
    if (!enabled || !speechSupported || !currentInstruction) return;

    const shouldSpeak = distance && parseFloat(distance) < 0.05; // Fala quando < 50m

    if (shouldSpeak && currentInstruction.text) {
      speakInstruction(currentInstruction.text);
    }
  }, [currentInstruction, distance, enabled, speechSupported]);

  const speakInstruction = (text) => {
    if (!speechSupported || isSpeaking) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const testVoice = () => {
    if (currentInstruction?.text) {
      speakInstruction(currentInstruction.text);
    } else {
      speakInstruction("Navegação por voz ativada. Você receberá instruções em tempo real.");
    }
  };

  if (!speechSupported) {
    return null;
  }

  return (
    <Card className="absolute bottom-24 right-4 z-[1001] p-3 bg-white/95 backdrop-blur-sm border-2 border-purple-300">
      <div className="flex items-center gap-3">
        <Button
          onClick={onToggle}
          size="sm"
          className={`${
            enabled 
              ? 'bg-purple-600 hover:bg-purple-700' 
              : 'bg-gray-400 hover:bg-gray-500'
          }`}
        >
          {enabled ? (
            <>
              <Volume2 className="w-4 h-4 mr-2" />
              {isSpeaking ? 'Falando...' : 'Voz ON'}
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 mr-2" />
              Voz OFF
            </>
          )}
        </Button>
        
        {enabled && (
          <Button
            onClick={testVoice}
            variant="outline"
            size="sm"
          >
            🔊 Testar
          </Button>
        )}
      </div>
    </Card>
  );
}
