"use client";

import { useState } from "react";
import { useGame } from "@/lib/gameContext";
import { ACHIEVEMENTS } from "@/lib/gameData";
import { Achievement } from "@/lib/types";

const CATEGORIES = ["Tous", "Premiers Pas", "Calls", "Bookings", "Streaks", "Énergie", "Ratio", "Spécial"];

const CARD_BG = "#1C1C1C";
const BORDER  = "#2A2A2A";

function getTier(tier: string) {
  switch (tier) {
    case "gold":   return { color: "#ffd700", label: "OR"     };
    case "silver": return { color: "#c0c8d8", label: "ARGENT" };
    default:       return { color: "#cd7f32", label: "BRONZE" };
  }
}

function AchievementCard({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  const { color, label } = getTier(achievement.tier);

  return (
    <div
      className="achievement-card rounded-sm p-3 relative flex flex-col gap-1.5"
      style={{
        background: CARD_BG,
        border:     `1px solid ${unlocked ? `${color}35` : BORDER}`,
        borderLeft: `3px solid ${unlocked ? color : "#2A2A2A"}`,
        opacity:    unlocked ? 1 : 0.45,
      }}
    >
      {/* Status icon */}
      <div className="absolute top-2.5 right-2.5">
        {unlocked
          ? <span style={{ fontSize: "0.65rem", color, border: `1px solid ${color}`, borderRadius: "50%", padding: "1px 4px" }}>✓</span>
          : <span style={{ fontSize: "0.75rem", color: "#3A3A3A" }}>🔒</span>
        }
      </div>

      {/* Icon */}
      <div style={{ fontSize: "1.6rem", lineHeight: 1 }}>
        {unlocked ? achievement.icon : "❓"}
      </div>

      {/* Tier badge */}
      <div
        className="inline-flex self-start rounded-sm px-1.5 py-0.5"
        style={{ background: `${color}14`, border: `1px solid ${color}28` }}
      >
        <span className="font-game text-[9px] tracking-widest" style={{ color }}>
          {label}
        </span>
      </div>

      {/* Title */}
      <div className="font-game text-xs leading-tight" style={{ color: unlocked ? "#FFFFFF" : "#5A5A5A" }}>
        {unlocked ? achievement.title : "???"}
      </div>

      {/* Description / hint */}
      <div style={{ color: unlocked ? "#9A9A9A" : "#5A5A5A", fontSize: "0.7rem", lineHeight: 1.5 }}>
        {unlocked ? achievement.description : achievement.hint}
      </div>

      {/* XP */}
      <div className="font-game text-[10px] mt-auto pt-1" style={{ color: unlocked ? "#FF9500" : "#3A3A3A" }}>
        +{achievement.xpReward} XP
      </div>
    </div>
  );
}

export default function AchievementsTab() {
  const { state } = useGame();
  const [cat, setCat] = useState("Tous");

  const visible = ACHIEVEMENTS.filter((a) => a.category !== "Ventes");

  const filtered = visible
    .filter((a) => cat === "Tous" || a.category === cat)
    .sort((a, b) => {
      const aU = state.unlockedAchievements.includes(a.id);
      const bU = state.unlockedAchievements.includes(b.id);
      if (aU && !bU) return -1;
      if (!aU && bU) return 1;
      return 0;
    });

  const total    = visible.length;
  const unlocked = state.unlockedAchievements.filter((id) =>
    visible.some((a) => a.id === id)
  ).length;
  const pct = Math.round((unlocked / total) * 100);

  return (
    <div className="space-y-3 max-w-3xl mx-auto">

      {/* Header */}
      <div className="rounded-sm p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-game text-lg text-white">HAUTS FAITS</h2>
            <p style={{ color: "#5A5A5A", fontSize: "0.72rem" }}>Accomplis des objectifs pour débloquer des récompenses XP</p>
          </div>
          <div className="text-right">
            <div className="font-game text-2xl" style={{ color: "#FF9500" }}>
              {unlocked}<span style={{ color: "#5A5A5A", fontSize: "0.9rem" }}>/{total}</span>
            </div>
            <div style={{ color: "#5A5A5A", fontSize: "0.65rem" }}>débloqués</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2A2A2A" }}>
          <div
            className="h-full rounded-full progress-bar"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg,#CC7700,#FF9500)",
              boxShadow: "0 0 5px rgba(255,149,0,0.4)",
            }}
          />
        </div>
        <div style={{ color: "#5A5A5A", fontSize: "0.63rem", marginTop: "4px" }}>{pct}% complété</div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="flex-shrink-0 px-3 py-1.5 rounded-sm font-game text-[10px] tracking-wider transition-all duration-100"
            style={{
              background: cat === c ? "#FF5500" : CARD_BG,
              border:     `1px solid ${cat === c ? "#FF5500" : BORDER}`,
              color:      cat === c ? "#FFF" : "#9A9A9A",
            }}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filtered.map((a) => (
          <AchievementCard
            key={a.id}
            achievement={a}
            unlocked={state.unlockedAchievements.includes(a.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12" style={{ color: "#5A5A5A" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔍</div>
          <p className="font-game text-xs">Aucun haut fait dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}
