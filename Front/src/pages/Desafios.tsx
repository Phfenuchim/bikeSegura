import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  Trophy, 
  Zap, 
  Calendar, 
  TrendingUp,
  CheckCircle,
  Clock,
  Award
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DesafiosPage() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.filter({ is_active: true }, '-created_date'),
  });

  const { data: userChallenges = [] } = useQuery({
    queryKey: ['user-challenges', user?.email],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.UserChallenge.filter({ user_email: user.email });
    },
    enabled: !!user,
  });

  const updateChallengeMutation = useMutation({
    mutationFn: async ({ challengeId, progress }) => {
      const user = await base44.auth.me();
      const userChallenge = userChallenges.find(uc => uc.challenge_id === challengeId);
      const challenge = challenges.find(c => c.id === challengeId);
      
      if (!userChallenge) {
        return base44.entities.UserChallenge.create({
          user_email: user.email,
          challenge_id: challengeId,
          current_progress: progress,
          is_completed: progress >= challenge.target_value,
          completed_at: progress >= challenge.target_value ? new Date().toISOString() : null
        });
      } else {
        const newProgress = userChallenge.current_progress + progress;
        return base44.entities.UserChallenge.update(userChallenge.id, {
          current_progress: newProgress,
          is_completed: newProgress >= challenge.target_value,
          completed_at: newProgress >= challenge.target_value ? new Date().toISOString() : userChallenge.completed_at
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
    },
  });

  const claimRewardMutation = useMutation({
    mutationFn: async (userChallengeId) => {
      const userChallenge = userChallenges.find(uc => uc.id === userChallengeId);
      const challenge = challenges.find(c => c.id === userChallenge.challenge_id);
      
      await base44.entities.UserChallenge.update(userChallengeId, {
        reward_claimed: true
      });

      await base44.auth.updateMe({
        points: (user.points || 0) + challenge.reward_points,
        xp: (user.xp || 0) + (challenge.reward_points * 2)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      alert("🎉 Recompensa coletada!");
    },
  });

  const dailyChallenges = challenges.filter(c => c.period === 'daily');
  const weeklyChallenges = challenges.filter(c => c.period === 'weekly');
  const monthlyChallenges = challenges.filter(c => c.period === 'monthly');

  const getChallengeProgress = (challengeId) => {
    const userChallenge = userChallenges.find(uc => uc.challenge_id === challengeId);
    return userChallenge || { current_progress: 0, is_completed: false, reward_claimed: false };
  };

  const ChallengeCard = ({ challenge }) => {
    const progress = getChallengeProgress(challenge.id);
    const progressPercentage = Math.min((progress.current_progress / challenge.target_value) * 100, 100);
    const canClaim = progress.is_completed && !progress.reward_claimed;

    return (
      <Card className={`border-2 ${progress.is_completed ? 'border-green-400 bg-green-50' : 'border-gray-200'} hover:shadow-lg transition-shadow`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{challenge.icon}</div>
              <div>
                <CardTitle className="text-lg">{challenge.name}</CardTitle>
                <p className="text-sm text-gray-600">{challenge.description}</p>
              </div>
            </div>
            {progress.is_completed && (
              <CheckCircle className="w-6 h-6 text-green-600" />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progresso</span>
              <span className="font-bold text-gray-900">
                {progress.current_progress} / {challenge.target_value}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge className="bg-purple-100 text-purple-800">
                <Trophy className="w-3 h-3 mr-1" />
                {challenge.reward_points} pts
              </Badge>
              <Badge className="bg-indigo-100 text-indigo-800">
                <Zap className="w-3 h-3 mr-1" />
                {challenge.reward_points * 2} XP
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {challenge.period === 'daily' ? 'Diário' : challenge.period === 'weekly' ? 'Semanal' : 'Mensal'}
              </Badge>
            </div>
          </div>

          {progress.completed_at && (
            <p className="text-xs text-gray-600">
              Completado em {format(new Date(progress.completed_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}

          {canClaim && (
            <Button
              onClick={() => claimRewardMutation.mutate(progress.id)}
              disabled={claimRewardMutation.isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Coletar Recompensa
            </Button>
          )}

          {progress.reward_claimed && (
            <Badge className="w-full justify-center py-2 bg-gray-200 text-gray-700">
              ✓ Recompensa coletada
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎯 Desafios
            </h1>
            <p className="text-gray-600">
              Complete desafios e ganhe pontos e experiência
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-600 text-white px-4 py-2 text-lg">
              <Award className="w-5 h-5 mr-2" />
              {user?.points || 0} pts
            </Badge>
            <Badge className="bg-indigo-600 text-white px-4 py-2 text-lg">
              <Zap className="w-5 h-5 mr-2" />
              {user?.xp || 0} XP
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Desafios Diários</p>
              <p className="text-2xl font-bold text-blue-900">{dailyChallenges.length}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Desafios Semanais</p>
              <p className="text-2xl font-bold text-purple-900">{weeklyChallenges.length}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Desafios Mensais</p>
              <p className="text-2xl font-bold text-amber-900">{monthlyChallenges.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
            <TabsTrigger value="daily">Diários</TabsTrigger>
            <TabsTrigger value="weekly">Semanais</TabsTrigger>
            <TabsTrigger value="monthly">Mensais</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dailyChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="weekly">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {weeklyChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monthly">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {monthlyChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
