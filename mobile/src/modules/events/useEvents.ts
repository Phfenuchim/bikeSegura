import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "../../api/httpClient";

export type RouteEvent = {
    id: number;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    start_lat: number;
    start_lng: number;
    end_lat: number;
    end_lng: number;
    status: string;
    created_at: string;
    user_id: number | null;
};

export function useEvents() {
    const queryClient = useQueryClient();

    // Get all events
    const { data: events = [], isLoading, error, refetch } = useQuery<RouteEvent[]>({
        queryKey: ["events"],
        queryFn: async () => {
            const response = await httpClient.get("/events");
            return response.data;
        },
    });

    // Create event
    const createEventMutation = useMutation({
        mutationFn: async (eventData: Partial<RouteEvent>) => {
            const response = await httpClient.post("/events", eventData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
        },
    });

    return {
        events,
        isLoading,
        error,
        refresh: refetch,
        createEvent: (eventData: Partial<RouteEvent>) => createEventMutation.mutateAsync(eventData),
        isCreating: createEventMutation.isPending,
    };
}
