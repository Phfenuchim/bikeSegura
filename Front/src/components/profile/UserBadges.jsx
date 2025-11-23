import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Award, Shield, Star, Target, Zap, Crown, Heart } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const iconMap = {
  Award, Shield, Star, Target, Zap, Crown, Heart
};

const rarityStyles = {
  comum: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  raro: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  epico: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
  lendario: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" }
};

export default function UserBadges({ userBadges, allBadges, userStats, points, level }) {
  const checkBadgeUnlocked = (badge) => {
    if (userBadges.includes(badge.id)) return true;

    const stat = userStats[badge.requirement_type] || 0;
    
    switch (badge.requirement_type) {
      case 'points':
        return points >= badge.requirement_value;
      case 'level':
        return level >= badge.requirement_value;
      case 'incidents_reported':
        return stat >= badge.requirement_value;
      case 'sos_responses':
        return stat >= badge.requirement_value;
      case 'routes_completed':
        return stat >= badge.requirement_value;
      default:
        return false;
    }
  };

  const getBadgeProgress = (badge) => {
    const stat = userStats[badge.requirement_type] || 0;
    let currentValue = stat;
    
    if (badge.requirement_type === 'points') currentValue = points;
    if (badge.requirement_type === 'level') currentValue = level;
    
    return Math.min((currentValue / badge.requirement_value) * 100, 100);
  };

  const unlockedBadges = allBadges.filter(checkBadgeUnlocked);
  const lockedBadges = allBadges.filter(b => !checkBadgeUnlocked(b));

  return (
    <div className="space-y-6">
      {/* Unlocked Badges */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            Badges Conquistados ({unlockedBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unlockedBadges.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Você ainda não conquistou nenhum badge</p>
              <p className="text-sm text-gray-400 mt-1">Continue ajudando a comunidade!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unlockedBadges.map((badge) => {
                const Icon = iconMap[badge.icon] || Award;
                const rarity = rarityStyles[badge.rarity] || rarityStyles.comum;
                
                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-xl border-2 ${rarity.border} ${rarity.bg} transform hover:scale-105 transition-all duration-200 cursor-pointer`}
                  >
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-white shadow-lg flex items-center justify-center`}>
                      <Icon className={`w-8 h-8 ${rarity.text}`} />
                    </div>
                    <h3 className={`font-bold text-center mb-1 ${rarity.text}`}>
                      {badge.name}
                    </h3>
                    <p className="text-xs text-gray-600 text-center">
                      {badge.description}
                    </p>
                    <div className="mt-2">
                      <Badge variant="outline" className={`w-full justify-center text-xs ${rarity.text}`}>
                        {badge.rarity}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-400" />
              Badges a Desbloquear ({lockedBadges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lockedBadges.map((badge) => {
                const Icon = iconMap[badge.icon] || Award;
                const rarity = rarityStyles[badge.rarity] || rarityStyles.comum;
                const progress = getBadgeProgress(badge);
                
                return (
                  <div
                    key={badge.id}
                    className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 opacity-75"
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 flex-shrink-0 rounded-full bg-gray-300 flex items-center justify-center relative">
                        <Icon className="w-8 h-8 text-gray-500" />
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-full">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-700 mb-1">
                          {badge.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2">
                          {badge.description}
                        </p>
                        <div className="space-y-1">
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-gray-500">
                            {progress.toFixed(0)}% completo
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}