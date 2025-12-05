import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "../../api/httpClient";

export type FeedPost = {
    id: number;
    content: string;
    created_at: string;
    user_id: number | null;
};

export function useFeed() {
    const queryClient = useQueryClient();

    // Get all posts
    const { data: posts = [], isLoading, error, refetch } = useQuery<FeedPost[]>({
        queryKey: ["feed"],
        queryFn: async () => {
            const response = await httpClient.get("/feed");
            return response.data;
        },
    });

    // Create post
    const createPostMutation = useMutation({
        mutationFn: async (content: string) => {
            const response = await httpClient.post("/feed", { content });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feed"] });
        },
    });

    return {
        posts,
        isLoading,
        error,
        refresh: refetch,
        createPost: (content: string) => createPostMutation.mutateAsync(content),
        isCreating: createPostMutation.isPending,
    };
}
