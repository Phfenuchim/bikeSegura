import { useState } from "react";
import { Alert } from "react-native";

type MarkerType = "incident" | "sos" | "supportPoint";

type SelectedMarker = {
    type: MarkerType;
    data: any;
} | null;

type MarkerDetailsHandlers = {
    onAddToRoute: (lat: number, lng: number, name: string) => void;
    onNavigate: (lat: number, lng: number) => void;
    onAttendSOS?: (sosId: number) => Promise<void>;
};

export function useMarkerDetails(handlers: MarkerDetailsHandlers) {
    const [selectedMarker, setSelectedMarker] = useState<SelectedMarker>(null);

    const openMarkerDetails = (type: MarkerType, data: any) => {
        setSelectedMarker({ type, data });
    };

    const closeMarkerDetails = () => {
        setSelectedMarker(null);
    };

    const handleIncidentPress = (incident: any) => {
        openMarkerDetails("incident", incident);
    };

    const handleSOSPress = (sos: any) => {
        openMarkerDetails("sos", sos);
    };

    const handleSupportPointPress = (supportPoint: any) => {
        openMarkerDetails("supportPoint", supportPoint);
    };

    const handleAddToRoute = (lat: number, lng: number, name: string) => {
        handlers.onAddToRoute(lat, lng, name);
        closeMarkerDetails();
        Alert.alert("Adicionado", `${name} foi adicionado ao trajeto`);
    };

    const handleNavigate = (lat: number, lng: number) => {
        handlers.onNavigate(lat, lng);
        closeMarkerDetails();
    };

    const handleAttendSOS = async (sosId: number) => {
        if (handlers.onAttendSOS) {
            try {
                await handlers.onAttendSOS(sosId);
                closeMarkerDetails();
                Alert.alert(
                    "Atender SOS",
                    "Você está indo ajudar. Rota criada!",
                    [{ text: "OK" }]
                );
            } catch (err) {
                Alert.alert("Erro", "Falha ao atender SOS");
            }
        }
    };

    return {
        selectedMarker,
        openMarkerDetails,
        closeMarkerDetails,
        handleIncidentPress,
        handleSOSPress,
        handleSupportPointPress,
        handleAddToRoute,
        handleNavigate,
        handleAttendSOS,
    };
}
