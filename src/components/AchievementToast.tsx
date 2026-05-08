"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/gameContext";
import { ACHIEVEMENTS, ACHIEVEMENT_MONEY_REWARDS } from "@/lib/gameData";

function getTierStyle(tier: string) {
  switch (tier) {
    case "gold":
      return {
        bg: "rgba(44,32,0,0.98)",
        border: "#ffd700",
        glow: "0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.2)",
        titleColor: "#ffd700",
        label: "OR",
        labelBg: "rgba(255,215,0,0.18)",
      };
    case "silver":
      return {
        bg: "rgba(26,28,50,0.98)",
        border: "#9098aa",
        glow: "0 0 15px rgba(200,208,224,0.35), 0 0 30px rgba(200,208,224,0.12)",
        titleColor: "#c8d0e0",
        label: "ARGENT",
        labelBg: "rgba(200,208,224,0.12)",
      };
    default:
      return {
        bg: "rgba(44,22,0,0.98)",
        border: "#cd7f32",
        glow: "0 0 20px rgba(205,127,50,0.4), 0 0 40px rgba(205,127,50,0.15)",
        titleColor: "#cd7f32",
        label: "BRONZE",
        labelBg: "rgba(205,127,50,0.15)",
      };
  }
}

interface ToastItemProps {
  achievementId: string;
  onDismiss: () => void;
  index: number;
}

function ToastItem({ achievementId, onDismiss, index }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);

  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);

  useEffect(() => {
    const dismissTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 350);
    }, 4000);

    return () => clearTimeout(dismissTimer);
  }, [onDismiss]);

  const handleClick = () => {
    setExiting(true);
    setTimeout(onDismiss, 350);
  };

  if (!achievement) return null;

  const tierStyle = getTierStyle(achievement.tier);

  return (
    <div
      className={`${exiting ? "toast-exit" : "toast-enter"} cursor-pointer`}
      style={{ marginBottom: index > 0 ? "8px" : 0 }}
      onClick={handleClick}
    >
      <div
        className="rounded-xl border p-4 min-w-[280px] max-w-[320px]"
        style={{
          background: tierStyle.bg,
          borderColor: tierStyle.border,
          boxShadow: tierStyle.glow,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full" style={{ background: tierStyle.titleColor }} />
          <span className="font-game text-xs tracking-widest text-gray-400">
            HAUT FAIT DÉBLOQUÉ
          </span>
          <span
            className="ml-auto font-game text-[10px] tracking-widest px-1.5 py-0.5 rounded"
            style={{ color: tierStyle.titleColor, background: tierStyle.labelBg }}
          >
            {tierStyle.label}
          </span>
        </div>

        {/* Content */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
            style={{
              background: tierStyle.labelBg,
              border: `1px solid ${tierStyle.border}40`,
            }}
          >
            {achievement.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-game text-base" style={{ color: tierStyle.titleColor }}>
              {achievement.title}
            </div>
            <div className="text-xs text-gray-400 truncate">{achievement.description}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="font-game text-xs text-yellow-400">+{achievement.xpReward} XP</div>
              {ACHIEVEMENT_MONEY_REWARDS[achievement.id] && (
                <div className="font-game text-xs text-green-400">
                  +{ACHIEVEMENT_MONEY_REWARDS[achievement.id]}€ 💶
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar (auto dismiss) */}
        <div className="mt-3 h-0.5 rounded-full overflow-hidden" style={{ background: tierStyle.border + "20" }}>
          <div
            className="h-full rounded-full"
            style={{
              background: tierStyle.titleColor,
              animation: "shrink 4s linear forwards",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export default function AchievementToast() {
  const { state, dispatch } = useGame();

  if (state.pendingToasts.length === 0) return null;

  // Show only first toast at a time
  const currentToastId = state.pendingToasts[0];

  const handleDismiss = () => {
    dispatch({ type: "DISMISS_TOAST", id: currentToastId });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse">
      <ToastItem
        key={currentToastId}
        achievementId={currentToastId}
        onDismiss={handleDismiss}
        index={0}
      />
    </div>
  );
}
