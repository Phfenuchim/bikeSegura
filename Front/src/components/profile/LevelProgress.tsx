import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

export default function LevelProgress({ level, total_xp }) {
  const xpForNextLevel = level * 100;
  const xpInCurrentLevel = total_xp % 100;
  const progress = (xpInCurrentLevel / xpForNextLevel) * 100;

  return (
    <div className="bg-gradient-to-r from-emerald-100 to-blue-100 rounded-xl p-4 border border-emerald-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-emerald-900">Nível {level}</span>
        </div>
        <span className="text-sm text-gray-600">
          {xpInCurrentLevel}/{xpForNextLevel} XP
        </span>
      </div>
      <Progress value={progress} className="h-3 bg-white" />
      <p className="text-xs text-gray-600 mt-1">
        {xpForNextLevel - xpInCurrentLevel} XP até o próximo nível
      </p>
    </div>
  );
}
