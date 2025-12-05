import { useState, useCallback } from "react";

type RouteStatus = "active" | "paused" | "planned" | "completed";

type ManagedRoute = {
    id: string;
    name: string;
    status: RouteStatus;
    origin: { latitude: number; longitude: number; name: string };
    destination: { latitude: number; longitude: number; name: string };
    waypoints: Array<{ latitude: number; longitude: number; name: string }>;
    distance?: number;
    duration?: number;
    calculatedRoute?: any;
};

export function useRouteManager() {
    const [routes, setRoutes] = useState<ManagedRoute[]>([]);
    const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
    const [temporaryDetour, setTemporaryDetour] = useState<{
        waypoint: { latitude: number; longitude: number; name: string };
        returnToMainRoute: boolean;
    } | null>(null);

    const activeRoute = routes.find(r => r.id === activeRouteId);

    // Add new route
    const addRoute = useCallback((route: Omit<ManagedRoute, "id" | "status">) => {
        const newRoute: ManagedRoute = {
            ...route,
            id: Date.now().toString(),
            status: "planned",
        };
        setRoutes(prev => [...prev, newRoute]);
        return newRoute.id;
    }, []);

    // Activate a route
    const activateRoute = useCallback((routeId: string) => {
        setRoutes(prev =>
            prev.map(r => ({
                ...r,
                status: r.id === routeId ? "active" : r.status === "active" ? "paused" : r.status,
            }))
        );
        setActiveRouteId(routeId);
    }, []);

    // Pause active route
    const pauseActiveRoute = useCallback(() => {
        setRoutes(prev =>
            prev.map(r => ({
                ...r,
                status: r.status === "active" ? "paused" : r.status,
            }))
        );
        setActiveRouteId(null);
    }, []);

    // Resume paused route
    const resumeRoute = useCallback((routeId: string) => {
        activateRoute(routeId);
    }, [activateRoute]);

    // Complete active route
    const completeActiveRoute = useCallback(() => {
        setRoutes(prev =>
            prev.map(r => ({
                ...r,
                status: r.status === "active" ? "completed" : r.status,
            }))
        );
        setActiveRouteId(null);
    }, []);

    // Add waypoint to active route
    const addWaypointToActiveRoute = useCallback(
        (waypoint: { latitude: number; longitude: number; name: string }, insertAtIndex?: number) => {
            if (!activeRouteId) return false;

            setRoutes(prev =>
                prev.map(r => {
                    if (r.id !== activeRouteId) return r;

                    const newWaypoints = [...r.waypoints];
                    if (insertAtIndex !== undefined) {
                        newWaypoints.splice(insertAtIndex, 0, waypoint);
                    } else {
                        newWaypoints.push(waypoint);
                    }

                    return { ...r, waypoints: newWaypoints };
                })
            );
            return true;
        },
        [activeRouteId]
    );

    // Remove waypoint from active route
    const removeWaypointFromActiveRoute = useCallback(
        (index: number) => {
            if (!activeRouteId) return false;

            setRoutes(prev =>
                prev.map(r => {
                    if (r.id !== activeRouteId) return r;
                    return {
                        ...r,
                        waypoints: r.waypoints.filter((_, i) => i !== index),
                    };
                })
            );
            return true;
        },
        [activeRouteId]
    );

    // Reorder waypoints in active route
    const reorderWaypoints = useCallback(
        (fromIndex: number, toIndex: number) => {
            if (!activeRouteId) return false;

            setRoutes(prev =>
                prev.map(r => {
                    if (r.id !== activeRouteId) return r;

                    const newWaypoints = [...r.waypoints];
                    const [removed] = newWaypoints.splice(fromIndex, 1);
                    newWaypoints.splice(toIndex, 0, removed);

                    return { ...r, waypoints: newWaypoints };
                })
            );
            return true;
        },
        [activeRouteId]
    );

    // Swap origin and destination
    const reverseActiveRoute = useCallback(() => {
        if (!activeRouteId) return false;

        setRoutes(prev =>
            prev.map(r => {
                if (r.id !== activeRouteId) return r;

                return {
                    ...r,
                    origin: r.destination,
                    destination: r.origin,
                    waypoints: [...r.waypoints].reverse(),
                };
            })
        );
        return true;
    }, [activeRouteId]);

    // Add temporary detour (e.g., for SOS)
    const addTemporaryDetour = useCallback(
        (waypoint: { latitude: number; longitude: number; name: string }) => {
            if (!activeRouteId) return false;

            // Insert waypoint at the beginning
            setTemporaryDetour({ waypoint, returnToMainRoute: true });
            addWaypointToActiveRoute(waypoint, 0);
            return true;
        },
        [activeRouteId, addWaypointToActiveRoute]
    );

    // Clear temporary detour (when reached)
    const clearTemporaryDetour = useCallback(() => {
        setTemporaryDetour(null);
    }, []);

    // Update route data (distance, duration, calculated route)
    const updateRouteData = useCallback(
        (routeId: string, data: Partial<Pick<ManagedRoute, "distance" | "duration" | "calculatedRoute">>) => {
            setRoutes(prev =>
                prev.map(r => (r.id === routeId ? { ...r, ...data } : r))
            );
        },
        []
    );

    // Delete route
    const deleteRoute = useCallback((routeId: string) => {
        setRoutes(prev => prev.filter(r => r.id !== routeId));
        if (activeRouteId === routeId) {
            setActiveRouteId(null);
        }
    }, [activeRouteId]);

    return {
        routes,
        activeRoute,
        activeRouteId,
        temporaryDetour,
        addRoute,
        activateRoute,
        pauseActiveRoute,
        resumeRoute,
        completeActiveRoute,
        addWaypointToActiveRoute,
        removeWaypointFromActiveRoute,
        reorderWaypoints,
        reverseActiveRoute,
        addTemporaryDetour,
        clearTemporaryDetour,
        updateRouteData,
        deleteRoute,
    };
}
