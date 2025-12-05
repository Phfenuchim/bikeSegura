import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AchievementNotification from "./AchievementNotification";

export default function AchievementChecker() {
  const [newAchievement, setNewAchievement] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['all-achievements'],
    queryFn: () => base44.entities.Achievement.list(),
  });

  useEffect(() => {
    if (user && achievements.length > 0) {
      checkAchievements();
    }
  }, [user?.routes_completed, user?.total_distance_km, user?.sos_responses, user?.incidents_reported]);

  const checkAchievements = async () => {
    if (!user) return;

    const userAchievements = user.achievements || [];
    const earnedIds = userAchievements.map(a => a.id);

    for (const achievement of achievements) {
      if (earnedIds.includes(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.type) {
        case 'first_route':
          shouldUnlock = user.routes_completed >= achievement.requirement_value;
          break;
        case 'distance_milestone':
          shouldUnlock = user.total_distance_km >= achievement.requirement_value;
          break;
        case 'sos_helper':
          shouldUnlock = user.sos_responses >= achievement.requirement_value;
          break;
        case 'incident_reporter':
          shouldUnlock = user.incidents_reported >= achievement.requirement_value;
          break;
        case 'event_participant':
          // Check events participated
          const userEvents = await base44.entities.RouteEvent.list();
          const participated = userEvents.filter(e => 
            e.participants?.some(p => p.user_email === user.email)
          ).length;
          shouldUnlock = participated >= achievement.requirement_value;
          break;
      }

      if (shouldUnlock) {
        const newAchievements = [
          ...userAchievements,
          {
            id: achievement.id,
            name: achievement.name,
            earned_at: new Date().toISOString()
          }
        ];

        await base44.auth.updateMe({
          achievements: newAchievements,
          points: (user.points || 0) + achievement.points_reward
        });

        setNewAchievement(achievement);
        queryClient.invalidateQueries({ queryKey: ['current-user'] });
        
        await base44.entities.Notification.create({
          user_email: user.email,
          type: 'badge_earned',
          title: '🏆 Nova Conquista!',
          message: `Você desbloqueou: ${achievement.name}`,
          priority: 'alta'
        });

        break;
      }
    }
  };

  if (!newAchievement) return null;

  return (
    <AchievementNotification
      achievement={newAchievement}
      onClose={() => setNewAchievement(null)}
    />
  );
}
