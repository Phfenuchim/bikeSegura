import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Zap, CheckCircle } from "lucide-react";

export default function ChallengeProgressTracker({ challengeId }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: challenge } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => base44.entities.Challenge.filter({ id: challengeId }).then(res => res[0]),
    enabled: !!challengeId,
  });

  const { data: userChallenge } = useQuery({
    queryKey: ['user-challenge', user?.email, challengeId],
    queryFn: async () => {
      const challenges = await base44.entities.UserChallenge.filter({
        user_email: user.email,
        challenge_id: challengeId
      });
      return challenges[0];
    },
    enabled: !!user && !!challengeId,
  });

  const claimRewardMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.UserChallenge.update(userChallenge.id, {
        reward_claimed: true
      });

      await base44.auth.updateMe({
        points: (user.points || 0) + challenge.reward_points,
        xp: (user.xp || 0) + (challenge.reward_points * 2)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-challenge'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      alert(`🎉 Você ganhou ${challenge.reward_points} pontos e ${challenge.reward_points * 2} XP!`);
    },
  });

  if (!challenge || !userChallenge) return null;

  const progressPercentage = Math.min((userChallenge.current_progress / challenge.target_value) * 100, 100);
  const isCompleted = userChallenge.is_completed;
  const canClaim = isCompleted && !userChallenge.reward_claimed;

  return (
    <Card className={`border-2 ${isCompleted ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{challenge.icon}</span>
            <div>
              <h3 className="font-bold text-gray-900">{challenge.name}</h3>
              <p className="text-xs text-gray-600">{challenge.description}</p>
            </div>
          </div>
          {isCompleted && (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progresso</span>
            <span className="font-bold text-gray-900">
              {userChallenge.current_progress} / {challenge.target_value}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="flex items-center justify-between mt-4">
          <Badge className="bg-purple-100 text-purple-800">
            <Trophy className="w-3 h-3 mr-1" />
            {challenge.reward_points} pontos
          </Badge>
          
          {canClaim && (
            <Button
              onClick={() => claimRewardMutation.mutate()}
              disabled={claimRewardMutation.isLoading}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Zap className="w-4 h-4 mr-1" />
              Coletar Recompensa
            </Button>
          )}
          
          {userChallenge.reward_claimed && (
            <Badge className="bg-gray-200 text-gray-700">
              ✓ Recompensa coletada
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}