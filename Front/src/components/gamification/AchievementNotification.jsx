import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AchievementNotification({ achievement, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const rarityColors = {
    comum: "from-gray-400 to-gray-600",
    raro: "from-blue-400 to-blue-600",
    epico: "from-purple-400 to-purple-600",
    lendario: "from-amber-400 to-amber-600"
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-full mx-4"
        >
          <div className={`bg-gradient-to-r ${rarityColors[achievement.rarity || 'comum']} p-1 rounded-2xl shadow-2xl`}>
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-2xl">{achievement.icon || '🏆'}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                      Conquista Desbloqueada!
                    </p>
                    <h3 className="text-lg font-bold text-gray-900">{achievement.name}</h3>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 500);
                  }}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-700 mb-2">{achievement.description}</p>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-700">+{achievement.points_reward} pontos</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}