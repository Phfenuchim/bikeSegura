import { Alert } from "react-native";

type Coordinate = { latitude: number; longitude: number };

export type RouteStep = {
    instruction: string;
    distance: number; // meters
    duration: number; // seconds
    coordinate: Coordinate;
    type: string; // "turn-left", "turn-right", "straight", etc.
};

export type NavigationRoute = {
    coordinates: Array<{ latitude: number; longitude: number }>;
    distance: number; // meters
    duration: number; // seconds
    steps: RouteStep[];
    geometry?: string; // Encoded polyline
    profile?: string; // Route profile used
    safetyScore?: number; // 1-5 rating
    elevation?: number; // Total elevation gain in meters
};

export type RoutePreferences = {
    routeType: "cycleway" | "bike-lane" | "shared" | "fastest";
    avoidSteepHills: boolean;
    avoidIncidents: boolean;
    avoidHighTraffic: boolean;
    priority: "shortest" | "fastest" | "safest" | "with-support";
};

export type AlternativeRoute = NavigationRoute & {
    name: string; // "Rápida", "Segura", "Curta"
    description: string;
    incidentsNearby?: number;
    supportPointsCount?: number;
};

class RoutingService {
    private baseUrl = "https://router.project-osrm.org";

    // Map preferences to OSRM profile
    private getOSRMProfile(preferences: RoutePreferences): string {
        switch (preferences.routeType) {
            case "cycleway":
                return "bike"; // OSRM bike profile prefers bike paths
            case "fastest":
                return "bike"; // Fastest route
            case "bike-lane":
            case "shared":
            default:
                return "bike";
        }
    }

    // Calculate single optimized route with preferences
    async calculateRoute(
        coordinates: Array<{ latitude: number; longitude: number }>,
        preferences?: RoutePreferences
    ): Promise<NavigationRoute | null> {
        try {
            const profile = preferences ? this.getOSRMProfile(preferences) : "bike";
            const coords = coordinates.map(c => `${c.longitude},${c.latitude}`).join(";");

            const url = `${this.baseUrl}/route/v1/${profile}/${coords}?overview=full&steps=true&geometries=geojson`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
                console.error("OSRM error:", data);
                return null;
            }

            const route = data.routes[0];
            return this.parseOSRMRoute(route, profile);
        } catch (error) {
            console.error("Route calculation error:", error);
            return null;
        }
    }

    // Calculate multiple alternative routes
    async calculateAlternativeRoutes(
        coordinates: Array<{ latitude: number; longitude: number }>,
        preferences: RoutePreferences,
        alternatives: number = 3
    ): Promise<AlternativeRoute[]> {
        try {
            const routes: AlternativeRoute[] = [];

            // Profile 1: Fastest (based on user preference)
            const fastestRoute = await this.calculateRouteVariant(
                coordinates,
                { ...preferences, priority: "fastest" },
                "Rápida",
                "Caminho mais rápido"
            );
            if (fastestRoute) routes.push(fastestRoute);

            // Profile 2: Safest (prefer bike paths)
            const safestRoute = await this.calculateRouteVariant(
                coordinates,
                { ...preferences, routeType: "cycleway", priority: "safest" },
                "Segura",
                "Prefere ciclovias"
            );
            if (safestRoute) routes.push(safestRoute);

            // Profile 3: Shortest
            const shortestRoute = await this.calculateRouteVariant(
                coordinates,
                { ...preferences, priority: "shortest" },
                "Curta",
                "Menor distância"
            );
            if (shortestRoute) routes.push(shortestRoute);

            // Remove duplicates (routes that are too similar)
            return this.deduplicateRoutes(routes);
        } catch (error) {
            console.error("Alternative routes error:", error);
            return [];
        }
    }

    // Calculate a specific route variant
    private async calculateRouteVariant(
        coordinates: Array<{ latitude: number; longitude: number }>,
        preferences: RoutePreferences,
        name: string,
        description: string
    ): Promise<AlternativeRoute | null> {
        const route = await this.calculateRoute(coordinates, preferences);
        if (!route) return null;

        return {
            ...route,
            name,
            description,
            safetyScore: this.calculateSafetyScore(route, preferences),
        };
    }

    // Remove routes that are too similar
    private deduplicateRoutes(routes: AlternativeRoute[]): AlternativeRoute[] {
        const unique: AlternativeRoute[] = [];

        for (const route of routes) {
            const isDuplicate = unique.some(existing =>
                Math.abs(existing.distance - route.distance) < 50 && // Less than 50m difference (was 200m)
                Math.abs(existing.duration - route.duration) < 30    // Less than 30s difference (was 60s)
            );

            if (!isDuplicate) {
                unique.push(route);
            }
        }

        return unique;
    }

    // Calculate safety score (1-5 stars)
    private calculateSafetyScore(route: NavigationRoute, preferences: RoutePreferences): number {
        let score = 3; // Base score

        // Bonus for bike-focused routes
        if (preferences.routeType === "cycleway") score += 1;
        if (preferences.routeType === "bike-lane") score += 0.5;

        // Bonus for avoiding hills
        if (preferences.avoidSteepHills) score += 0.5;

        // Bonus for avoiding high traffic
        if (preferences.avoidHighTraffic) score += 0.5;

        // Cap at 5
        return Math.min(5, Math.max(1, score));
    }

    // Parse OSRM response into our format
    private parseOSRMRoute(osrmRoute: any, profile: string): NavigationRoute {
        // Extract coordinates from geometry
        const coordinates: Coordinate[] = osrmRoute.geometry.coordinates.map((coord: [number, number]) => ({
            longitude: coord[0],
            latitude: coord[1]
        }));

        // Extract steps with instructions
        const steps: RouteStep[] = [];

        for (const leg of osrmRoute.legs) {
            for (const step of leg.steps) {
                const instruction = this.formatInstruction(step.maneuver);

                steps.push({
                    instruction,
                    distance: step.distance,
                    duration: step.duration,
                    coordinate: {
                        latitude: step.maneuver.location[1],
                        longitude: step.maneuver.location[0]
                    },
                    type: step.maneuver.type
                });
            }
        }

        return {
            coordinates,
            steps,
            distance: osrmRoute.distance,
            duration: osrmRoute.duration,
            profile: profile,
        };
    }

    // Using OpenRouteService (free, no API key needed for basic usage)
    // For production, get a free API key at https://openrouteservice.org/dev/#/signup
    // private readonly baseUrl = "https://api.openrouteservice.org/v2/directions"; // Old baseUrl, now using OSRM

    async getRoute(
        origin: Coordinate,
        destination: Coordinate,
        waypoints: Coordinate[] = []
    ): Promise<NavigationRoute | null> {
        try {
            console.log('[ROUTING] Starting route calculation...', { origin, destination, waypoints });

            // Build coordinates array: [origin, ...waypoints, destination]
            const coords = [
                [origin.longitude, origin.latitude],
                ...waypoints.map(w => [w.longitude, w.latitude]),
                [destination.longitude, destination.latitude]
            ];

            console.log('[ROUTING] Coordinates:', coords);

            // OSRM (free, no API key) - good alternative
            const osrmUrl = `https://router.project-osrm.org/route/v1/bike/${coords.map(c => c.join(',')).join(';')}?overview=full&steps=true&geometries=geojson`;

            console.log('[ROUTING] Fetching from URL:', osrmUrl);

            const response = await fetch(osrmUrl);
            const data = await response.json();

            console.log('[ROUTING] Response received:', { code: data.code, routesCount: data.routes?.length });

            if (!data.routes || data.routes.length === 0) {
                console.error('[ROUTING] No routes found');
                throw new Error("No route found");
            }

            const route = data.routes[0];

            console.log('[ROUTING] Route data:', {
                distance: route.distance,
                duration: route.duration,
                geometryPoints: route.geometry?.coordinates?.length,
                legs: route.legs?.length
            });

            // Extract coordinates from geometry
            const coordinates: Coordinate[] = route.geometry.coordinates.map((coord: [number, number]) => ({
                longitude: coord[0],
                latitude: coord[1]
            }));

            console.log('[ROUTING] Converted coordinates:', coordinates.length);

            // Extract steps with instructions
            const steps: RouteStep[] = [];

            for (const leg of route.legs) {
                for (const step of leg.steps) {
                    const instruction = this.formatInstruction(step.maneuver);

                    steps.push({
                        instruction,
                        distance: step.distance,
                        duration: step.duration,
                        coordinate: {
                            latitude: step.maneuver.location[1],
                            longitude: step.maneuver.location[0]
                        },
                        type: step.maneuver.type
                    });
                }
            }

            console.log('[ROUTING] Steps created:', steps.length);

            const result: NavigationRoute = {
                coordinates,
                steps,
                distance: route.distance,
                duration: route.duration
            };

            console.log('[ROUTING] Success! Returning route');
            return result;
        } catch (error) {
            console.error("[ROUTING] Error:", error);
            Alert.alert("Erro de Roteamento", `Falha ao calcular rota: ${error}`);

            // Fallback to straight line
            console.log('[ROUTING] Falling back to straight line');
            return {
                coordinates: [origin, ...waypoints, destination],
                steps: [{
                    instruction: "Siga em frente até o destino",
                    distance: this.calculateDistance(origin, destination),
                    duration: 0,
                    coordinate: origin,
                    type: "straight"
                }],
                distance: this.calculateDistance(origin, destination),
                duration: 0
            };
        }
    }

    private formatInstruction(maneuver: any): string {
        const type = maneuver.type;
        const modifier = maneuver.modifier || "";

        const instructions: Record<string, string> = {
            "turn-sharp-left": "Vire acentuadamente à esquerda",
            "turn-left": "Vire à esquerda",
            "turn-slight-left": "Vire levemente à esquerda",
            "turn-sharp-right": "Vire acentuadamente à direita",
            "turn-right": "Vire à direita",
            "turn-slight-right": "Vire levemente à direita",
            "straight": "Continue em frente",
            "uturn": "Faça retorno",
            "roundabout": "Entre na rotatória",
            "arrive": "Você chegou ao destino",
            "depart": "Siga em frente"
        };

        const key = modifier ? `${type}-${modifier}` : type;
        return instructions[key] || instructions[type] || "Continue";
    }

    private calculateDistance(point1: Coordinate, point2: Coordinate): number {
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
    }

    formatDistance(meters: number): string {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)} km`;
        }
        return `${Math.round(meters)} m`;
    }

    formatDuration(seconds: number): string {
        const minutes = Math.round(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}min`;
        }
        return `${mins} min`;
    }
}

export const routingService = new RoutingService();
