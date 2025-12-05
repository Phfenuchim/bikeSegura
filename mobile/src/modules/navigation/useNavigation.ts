import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { Alert } from "react-native";
import { NavigationRoute, RouteStep, routingService } from "../../services/routing";

type Coordinate = { latitude: number; longitude: number };

export function useNavigation() {
    const [isNavigating, setIsNavigating] = useState(false);
    const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [distanceToNext, setDistanceToNext] = useState<number | null>(null);
    const [routeData, setRouteData] = useState<NavigationRoute | null>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (point1: Coordinate, point2: Coordinate): number => {
        const R = 6371e3;
        const φ1 = (point1.latitude * Math.PI) / 180;
        const φ2 = (point2.latitude * Math.PI) / 180;
        const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
        const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    // Calculate bearing between two points
    const calculateBearing = (point1: Coordinate, point2: Coordinate): number => {
        const φ1 = (point1.latitude * Math.PI) / 180;
        const φ2 = (point2.latitude * Math.PI) / 180;
        const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        const θ = Math.atan2(y, x);

        return ((θ * 180) / Math.PI + 360) % 360;
    };

    const startNavigation = async (route: NavigationRoute) => {
        if (!route || route.coordinates.length < 2) {
            Alert.alert("Erro", "Rota inválida");
            return;
        }

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Erro", "Permissão de localização necessária");
                return;
            }

            setRouteData(route);
            setCurrentStepIndex(0);
            setIsNavigating(true);

            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                    distanceInterval: 5,
                },
                (location) => {
                    const currentPos = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    };
                    setUserLocation(currentPos);

                    // Find current step
                    if (route.steps && route.steps.length > 0) {
                        const currentStep = route.steps[currentStepIndex] || route.steps[route.steps.length - 1];
                        const distance = calculateDistance(currentPos, currentStep.coordinate);
                        setDistanceToNext(distance);

                        // If close to next step (within 30m), move to next
                        if (distance < 30 && currentStepIndex < route.steps.length - 1) {
                            setCurrentStepIndex(prev => prev + 1);
                        }

                        // Arriv ed at destination
                        if (currentStepIndex === route.steps.length - 1 && distance < 20) {
                            stopNavigation();
                            Alert.alert("Chegada!", "Você chegou ao destino! 🎯");
                        }
                    }
                }
            );
        } catch (error) {
            Alert.alert("Erro", "Falha ao iniciar navegação");
            console.error(error);
        }
    };

    const stopNavigation = () => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
        setIsNavigating(false);
        setCurrentStepIndex(0);
        setDistanceToNext(null);
        setUserLocation(null);
        setRouteData(null);
    };

    useEffect(() => {
        return () => {
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
        };
    }, []);

    const getNextInstruction = (): string => {
        if (!isNavigating || !routeData || !routeData.steps) {
            return "";
        }

        const currentStep = routeData.steps[currentStepIndex];
        if (!currentStep) return "";

        const distanceText = distanceToNext
            ? routingService.formatDistance(distanceToNext)
            : "";

        return `${currentStep.instruction} ${distanceText && `em ${distanceText}`}`;
    };

    const getBearing = (): number | null => {
        if (!userLocation || !routeData || !routeData.steps[currentStepIndex]) {
            return null;
        }
        return calculateBearing(userLocation, routeData.steps[currentStepIndex].coordinate);
    };

    const getRemainingDistance = (): string => {
        if (!routeData || !isNavigating) return "";

        // Sum distance of remaining steps
        let remaining = 0;
        for (let i = currentStepIndex; i < (routeData.steps?.length || 0); i++) {
            remaining += routeData.steps![i].distance;
        }

        return routingService.formatDistance(remaining);
    };

    const getETA = (): string => {
        if (!routeData || !isNavigating) return "";

        // Sum duration of remaining steps
        let remaining = 0;
        for (let i = currentStepIndex; i < (routeData.steps?.length || 0); i++) {
            remaining += routeData.steps![i].duration;
        }

        return routingService.formatDuration(remaining);
    };

    // Calculate real progress along the route polyline
    const getRouteProgress = (): number => {
        if (!routeData || !userLocation || !routeData.coordinates || routeData.coordinates.length === 0) {
            return 0;
        }

        // Find closest point on route to user location
        let minDistance = Infinity;
        let closestIndex = 0;

        for (let i = 0; i < routeData.coordinates.length; i++) {
            const distance = calculateDistance(userLocation, routeData.coordinates[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }

        // Calculate progress as percentage along the polyline
        const progress = (closestIndex / (routeData.coordinates.length - 1)) * 100;
        return Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
    };

    return {
        isNavigating,
        userLocation,
        currentStepIndex,
        distanceToNext,
        routeData,
        startNavigation,
        stopNavigation,
        getNextInstruction,
        getBearing,
        getRemainingDistance,
        getETA,
        getRouteProgress,
    };
}
