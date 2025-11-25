import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, ThumbsUp, ThumbsUp as ThumbsUpFilled } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function RouteCommentsSection({ routeId }) {
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['route-comments', routeId],
    queryFn: () => base44.entities.RouteComment.filter({ route_id: routeId }, '-created_date'),
    enabled: !!routeId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      return base44.entities.RouteComment.create(commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-comments'] });
      setNewComment("");
      setNewRating(5);
    },
  });

  const markHelpfulMutation = useMutation({
    mutationFn: async (comment) => {
      const hasMarked = comment.helpful_by?.includes(user.email);
      const newCount = hasMarked ? comment.helpful_count - 1 : comment.helpful_count + 1;
      const newHelpfulBy = hasMarked
        ? comment.helpful_by.filter(email => email !== user.email)
        : [...(comment.helpful_by || []), user.email];

      return base44.entities.RouteComment.update(comment.id, {
        helpful_count: newCount,
        helpful_by: newHelpfulBy
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-comments'] });
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim() || !routeId) return;

    addCommentMutation.mutate({
      route_id: routeId,
      user_email: user.email,
      comment: newComment,
      rating: newRating
    });
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Comentários ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Avaliação:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewRating(star)}
                    className={`text-xl ${star <= newRating ? 'text-amber-500' : 'text-gray-300'}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Compartilhe sua experiência com esta rota..."
              rows={3}
              className="text-sm"
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addCommentMutation.isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 h-10"
            >
              <Send className="w-4 h-4 mr-2" />
              Comentar
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[45vh]">
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">Seja o primeiro a comentar!</p>
            ) : (
              comments.map((comment) => {
                const hasMarkedHelpful = comment.helpful_by?.includes(user?.email);
                return (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">
                          {comment.user_email?.split('@')[0]}
                        </p>
                        {comment.rating && (
                          <div className="flex gap-0.5 my-1">
                            {[...Array(comment.rating)].map((_, i) => (
                              <span key={i} className="text-amber-500 text-xs">⭐</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.created_date), "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{comment.comment}</p>
                    <Button
                      onClick={() => markHelpfulMutation.mutate(comment)}
                      variant={hasMarkedHelpful ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                    >
                      {hasMarkedHelpful ? <ThumbsUpFilled className="w-3 h-3 mr-1" /> : <ThumbsUp className="w-3 h-3 mr-1" />}
                      Útil ({comment.helpful_count || 0})
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
