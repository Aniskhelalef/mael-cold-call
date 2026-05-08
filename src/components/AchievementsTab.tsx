"use client";

import { useState } from "react";
import { useGame } from "@/lib/gameContext";
import { ACHIEVEMENTS, ACHIEVEMENT_MONEY_REWARDS } from "@/lib/gameData";
import { Achievement } from "@/lib/types";

const CATEGORIES = ["Tous", "Premiers Pas", "Calls", "Bookings", "Streaks", "Énergie", "Ratio", "Spécial"];

function getTierStyle(tier: string): { color: string; borderColor: string; bg: string; label: string; glowClass: string } {
  switch (tier) {
    case "gold":
      return { color: "#ffd700", borderColor: "#ffd700", bg: "rgba(42,32,0,0.95)", label: "OR", glowClass: "glow-gold" };
    case "silver":
      return { color: "#c8d0e0", borderColor: "#808090", bg: "rgba(28,30,56,0.95)", label: "ARGENT", glowClass: "glow-silver" };
    default:
      return { color: "#cd7f32", borderColor: "#cd7f32", bg: "rgba(42,22,0,0.95)", label: "BRONZE", glowClass: "glow-bronze" };
  }
}

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
}

function AchievementCard({ achievement, unlocked }: AchievementCardProps) {
  const tierStyle = getTierStyle(achievement.tier);

  if (unlocked) {
    return (
      <div
        className={`achievement-card rounded-xl border p-4 relative overflow-hidden ${tierStyle.glowClass}`}
        style={{ background: tierStyle.bg, borderColor: tierStyle.borderColor + "60" }}
      >
        {/* Glow overlay */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-5"
          style={{
            background: `radial-gradient(circle, ${tierStyle.color} 0%, transparent 70%)`
          }} />

        {/* Checkmark */}
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: tierStyle.color + "20", border: `1px solid ${tierStyle.color}` }}>
          <span className="text-[10px]" style={{ color: tierStyle.color }}>✓</span>
        </div>

        {/* Icon */}
        <div className="text-3xl mb-2">{achievement.icon}</div>

        {/* Tier badge */}
        <div className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 mb-2"
          style={{ background: tierStyle.color + "20", border: `1px solid ${tierStyle.color}40` }}>
          <span className="font-game text-[10px] tracking-widest" style={{ color: tierStyle.color }}>
            {tierStyle.label}
          </span>
        </div>

        {/* Title */}
        <div className="font-game text-sm mb-1" style={{ color: tierStyle.color }}>
          {achievement.title}
        </div>

        {/* Description */}
        <div className="text-xs text-gray-400 leading-relaxed mb-2">{achievement.description}</div>

        {/* Rewards */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-game text-xs text-yellow-400">+{achievement.xpReward} XP</div>
          {ACHIEVEMENT_MONEY_REWARDS[achievement.id] && (
            <div className="font-game text-xs text-green-400">
              +{ACHIEVEMENT_MONEY_REWARDS[achievement.id]}€ 💶
            </div>
          )}
        </div>
      </div>
    );
  }

  // Locked card
  return (
    <div
      className="achievement-card rounded-xl border p-4 relative overflow-hidden opacity-50"
      style={{
        background: "rgba(22,24,40,0.9)",
        borderColor: tierStyle.borderColor + "30",
        borderStyle: "dashed"
      }}
    >
      {/* Padlock */}
      <div className="text-3xl mb-2 opacity-40">🔒</div>

      {/* Tier badge */}
      <div className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 mb-2"
        style={{ background: tierStyle.borderColor + "10", border: `1px solid ${tierStyle.borderColor}20` }}>
        <span className="font-game text-[10px] tracking-widest" style={{ color: tierStyle.borderColor + "80" }}>
          {tierStyle.label}
        </span>
      </div>

      {/* Title */}
      <div className="font-game text-sm text-gray-600 mb-1">???</div>

      {/* Hint */}
      <div className="text-xs text-gray-600 leading-relaxed mb-2">{achievement.hint}</div>

      {/* Rewards (hidden) */}
      <div className="flex items-center gap-2">
        <div className="font-game text-xs text-gray-700">+{achievement.xpReward} XP</div>
        {ACHIEVEMENT_MONEY_REWARDS[achievement.id] && (
          <div className="font-game text-xs text-gray-700">
            +{ACHIEVEMENT_MONEY_REWARDS[achievement.id]}€
          </div>
        )}
      </div>
    </div>
  );
}

export default function AchievementsTab() {
  const { state } = useGame();
  const [activeCategory, setActiveCategory] = useState("Tous");

  const filteredAchievements = ACHIEVEMENTS.filter(
    (a) => activeCategory === "Tous" || a.category === activeCategory
  );

  // Sort: unlocked first
  const sorted = [...filteredAchievements].sort((a, b) => {
    const aUnlocked = state.unlockedAchievements.includes(a.id);
    const bUnlocked = state.unlockedAchievements.includes(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });

  const unlockedCount = state.unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-game text-lg text-white">HAUTS FAITS</h2>
            <p className="text-xs text-gray-500">WoW-style achievement system</p>
          </div>
          <div className="text-right">
            <div className="font-game text-2xl text-yellow-400">{unlockedCount}/{totalCount}</div>
            <div className="text-xs text-gray-500">débloqués</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-game-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full progress-bar"
            style={{
              width: `${Math.round((unlockedCount / totalCount) * 100)}%`,
              background: "linear-gradient(90deg, #d97706, #fbbf24, #ffd700)",
              boxShadow: "0 0 8px rgba(255,215,0,0.4)"
            }}
          />
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {Math.round((unlockedCount / totalCount) * 100)}% complété
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg font-game text-xs tracking-wider transition-all duration-150"
            style={{
              background: activeCategory === cat
                ? "rgba(30,58,138,0.6)"
                : "rgba(16,16,28,0.8)",
              border: `1px solid ${activeCategory === cat ? "#3b82f6" : "#1a1a2e"}`,
              color: activeCategory === cat ? "#60a5fa" : "#6b7280",
              boxShadow: activeCategory === cat ? "0 0 10px rgba(59,130,246,0.3)" : "none",
            }}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sorted.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            unlocked={state.unlockedAchievements.includes(achievement.id)}
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-game text-sm">Aucun haut fait dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}
