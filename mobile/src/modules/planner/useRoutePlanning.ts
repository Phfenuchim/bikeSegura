import { useState, useEffect } from "react";
import { Alert, Linking } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { routingService, NavigationRoute } from "../../services/routing";

type Coordinate = { latitude: number; longitude: number; name?: string };

export function useRoutePlanning() {
    const queryClient = useQueryClient();
    const [isPlanning, setIsPlanning] = useState(false);
    const [origin, setOrigin] = useState<Coordinate | null>(null);
    const [destination, setDestination] = useState<Coordinate | null>(null);
    const [waypoints, setWaypoints] = useState<Array<Coordinate & { name: string }>>([]);
    const [planningStep, setPlanningStep] = useState<"origin" | "destination" | "waypoint" | "confirm">("origin");
    const [currentRouteId, setCurrentRouteId] = useState<number | null>(null);
    const [calculatedRoute, setCalculatedRoute] = useState<NavigationRoute | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const startPlanning = (currentLocation?: { lat: number; lng: number }) => {
        setIsPlanning(true);
        setPlanningStep("origin");
        setOrigin(null);
        setDestination(null);
        setWaypoints([]);

        if (currentLocation) {
            setOrigin({ latitude: currentLocation.lat, longitude: currentLocation.lng, name: "Minha Localização" });
            setPlanningStep("destination");
            Alert.alert("Planejamento", "Sua localização definida como origem. Toque no mapa para definir o destino.");
        } else {
            Alert.alert("Planejamento", "Toque no mapa para definir a origem.");
        }
    };

    const cancelPlanning = () => {
        setIsPlanning(false);
        setOrigin(null);
        setDestination(null);
        setWaypoints([]);
        setPlanningStep("origin");
        setCurrentRouteId(null);
        setCalculatedRoute(null); // Clear calculated route
        setIsCalculating(false);
    };

    // Clear all route data completely
    const clearAllRouteData = () => {
        setIsPlanning(false);
        setOrigin(null);
        setDestination(null);
        setWaypoints([]);
        setPlanningStep("origin");
        setCurrentRouteId(null);
        setCalculatedRoute(null);
        setIsCalculating(false);
    };

    const handleMapPress = (latitude: number, longitude: number) => {
        if (!isPlanning) return false;

        if (planningStep === "origin") {
            setOrigin({ latitude, longitude, name: "Origem" });
            setPlanningStep("destination");
        } else if (planningStep === "destination") {
            const destCoord = { latitude, longitude, name: "Destino" };
            setDestination(destCoord);
            setPlanningStep("waypoint");
        } else if (planningStep === "waypoint") {
            setWaypoints([...waypoints, { latitude, longitude, name: `Parada ${waypoints.length + 1}` }]);
        }
        return true;
    };

    // Auto-calculate route when destination is set
    useEffect(() => {
        if (origin && destination && !calculatedRoute && !isCalculating) {
            const timer = setTimeout(() => {
                calculateRoute();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [origin, destination]); // eslint-disable-line react-hooks/exhaustive-deps

    // Calculate route when origin and destination are set
    const calculateRoute = async () => {
        console.log('[PLANNING] calculateRoute called', { origin, destination, waypoints });

        if (!origin || !destination) {
            console.log('[PLANNING] Missing origin or destination, aborting');
            return;
        }

        setIsCalculating(true);
        try {
            console.log('[PLANNING] Calling routing service...');
            const route = await routingService.getRoute(origin, destination, waypoints);
            console.log('[PLANNING] Route received:', route);

            setCalculatedRoute(route);

            if (route) {
                console.log('[PLANNING] Route calculated successfully');
                Alert.alert(
                    "Rota Calculada",
                    `Distância: ${routingService.formatDistance(route.distance)}\nTempo estimado: ${routingService.formatDuration(route.duration)}`
                );
            }
        } catch (error) {
            console.error("[PLANNING] Route calculation error:", error);
            Alert.alert("Erro", "Falha ao calcular rota");
        } finally {
            setIsCalculating(false);
            console.log('[PLANNING] Calculation finished');
        }
    };

    const saveRoute = async (toggleSave: (id: number, save: boolean) => Promise<void>) => {
        if (!origin || !destination) {
            return Alert.alert("Erro", "Defina origem e destino");
        }

        try {
            const route = await api.createRoute({
                name: `Rota ${new Date().toLocaleDateString()}`,
                start_lat: origin.latitude,
                start_lng: origin.longitude,
                end_lat: destination.latitude,
                end_lng: destination.longitude,
            });
            // TODO: Update route with calculated data (distance, duration, geometry, steps)

            if (waypoints.length > 0) {
                await api.setWaypoints(route.id, waypoints);
            }

            await toggleSave(route.id, true);
            setCurrentRouteId(route.id);
            Alert.alert("Sucesso", "Rota salva!");
            queryClient.invalidateQueries({ queryKey: ["routes"] });
            queryClient.invalidateQueries({ queryKey: ["saved-routes"] });
            return true;
        } catch (err) {
            Alert.alert("Erro", "Falha ao salvar rota");
            return false;
        }
    };

    const addWaypoint = (point: Coordinate & { name: string }) => {
        setWaypoints([...waypoints, point]);
        // Auto-recalculate will happen in useEffect
    };

    const removeWaypoint = (index: number) => {
        setWaypoints(waypoints.filter((_, i) => i !== index));
        // Auto-recalculate will happen in useEffect
    };

    // Auto-recalculate route when waypoints change (if origin and destination are set)
    useEffect(() => {
        if (origin && destination && !isCalculating) {
            // Debounce: only recalculate after 500ms of no changes
            const timer = setTimeout(() => {
                calculateRoute();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [waypoints.length]); // Only trigger when waypoints count changes

    const loadRoute = async (routeId: number, routes: any[], savedRoutes: any[]) => {
        try {
            const route = routes.find(r => r.id === routeId) || savedRoutes.find(r => r.id === routeId);
            if (!route) return null;

            setOrigin({ latitude: route.start_lat, longitude: route.start_lng, name: "Origem" });
            setDestination({ latitude: route.end_lat, longitude: route.end_lng, name: "Destino" });

            const wps = await api.listWaypoints(routeId);
            setWaypoints(wps.map((w: any) => ({ latitude: w.latitude, longitude: w.longitude, name: w.name || "Parada" })));
            setCurrentRouteId(routeId);
            setIsPlanning(true);
            setPlanningStep("waypoint");

            return route;
        } catch (err) {
            Alert.alert("Erro", "Falha ao carregar rota");
            return null;
        }
    };

    // Use calculated route coordinates if available, otherwise straight line
    const allPoints = calculatedRoute
        ? calculatedRoute.coordinates
        : [origin, ...waypoints, destination].filter(Boolean) as Coordinate[];

    const searchAddress = async (query: string): Promise<Coordinate | null> => {
        try {
            // Using OpenStreetMap Nominatim for geocoding (free, no API key needed)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                return {
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon),
                    name: data[0].display_name || query
                };
            }
            return null;
        } catch (error) {
            Alert.alert("Erro", "Falha ao buscar endereço");
            return null;
        }
    };

    const startNavigation = () => {
        if (!origin || !destination) {
            Alert.alert("Erro", "Defina origem e destino primeiro");
            return;
        }

        // Open external navigation app
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${waypoints.length > 0
            ? `&waypoints=${waypoints.map(w => `${w.latitude},${w.longitude}`).join('|')}`
            : ''
            }`;

        Alert.alert(
            "Navegação",
            "Abrir no Google Maps?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Abrir",
                    onPress: () => Linking.openURL(url)
                }
            ]
        );
    };

    return {
        isPlanning,
        origin,
        destination,
        waypoints,
        planningStep,
        currentRouteId,
        allPoints,
        calculatedRoute,
        isCalculating,
        startPlanning,
        cancelPlanning,
        clearAllRouteData,
        handleMapPress,
        saveRoute,
        loadRoute,
        searchAddress,
        startNavigation,
        setOrigin,
        setDestination,
        calculateRoute,
        addWaypoint,
        removeWaypoint,
        setCalculatedRoute,
    };
}
