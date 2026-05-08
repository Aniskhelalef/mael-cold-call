"use client";

import { useGame } from "@/lib/gameContext";
import { WEEKLY_MISSIONS, getWeekNumber, getDaysUntilNextMonday } from "@/lib/gameData";

function getTierStyle(tier: string): { color: string; borderColor: string; bg: string; label: string } {
  switch (tier) {
    case "gold":
      return { color: "#ffd700", borderColor: "#ffd700", bg: "rgba(26,20,0,0.8)", label: "OR" };
    case "silver":
      return { color: "#c8d0e0", borderColor: "#808090", bg: "rgba(20,20,32,0.8)", label: "ARGENT" };
    default:
      return { color: "#cd7f32", borderColor: "#cd7f32", bg: "rgba(26,13,0,0.8)", label: "BRONZE" };
  }
}

export default function MissionsTab() {
  const { state } = useGame();

  const weeklyCalls = state.totalCalls - state.weeklyCallsAtStart;
  const weeklyBookings = state.totalBookings - state.weeklyBookingsAtStart;
  const weeklyDays = state.weeklyDaysActive;
  const weekNum = getWeekNumber();
  const daysLeft = getDaysUntilNextMonday();

  function getMissionProgress(mission: typeof WEEKLY_MISSIONS[0]): number {
    if (mission.type === "calls") return weeklyCalls;
    if (mission.type === "bookings") return weeklyBookings;
    if (mission.type === "days") return weeklyDays;
    return 0;
  }

  const totalMissions = WEEKLY_MISSIONS.length;
  const completedCount = state.weeklyMissionsCompleted.length;

  return (
    <div className="space-y-4">
      {/* Operation header */}
      <div className="bg-game-card border border-game-border rounded-xl p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5"
          style={{ background: "radial-gradient(circle, #f6ad55 0%, transparent 70%)" }} />

        <div className="relative">
          <div className="font-game text-xs tracking-widest text-yellow-500 mb-1">CS:GO OPERATIONS</div>
          <h2 className="font-game text-2xl text-white mb-1">OPÉRATION COLD CALL</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">
              <span className="text-yellow-400 font-game">Semaine {weekNum}</span>
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400">
              Reset dans <span className="text-orange-400 font-game">{daysLeft} jour{daysLeft > 1 ? "s" : ""}</span>
            </span>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-game text-xs text-gray-500 tracking-wider">PROGRESSION OPÉRATION</span>
            <span className="font-game text-sm text-yellow-400">{completedCount}/{totalMissions}</span>
          </div>
          <div className="h-2 bg-game-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full progress-bar"
              style={{
                width: `${Math.round((completedCount / totalMissions) * 100)}%`,
                background: "linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)",
                boxShadow: "0 0 8px rgba(245,158,11,0.4)"
              }}
            />
          </div>
        </div>
      </div>

      {/* Weekly stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Calls cette semaine", value: weeklyCalls, icon: "📞", color: "#3b82f6" },
          { label: "Bookings", value: weeklyBookings, icon: "🎯", color: "#22c55e" },
          { label: "Jours actifs", value: weeklyDays, icon: "📅", color: "#f97316" },
        ].map((stat) => (
          <div key={stat.label} className="bg-game-card border border-game-border rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className="font-game text-xl" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Mission cards */}
      <div className="space-y-3">
        {WEEKLY_MISSIONS.map((mission) => {
          const tierStyle = getTierStyle(mission.tier);
          const progress = getMissionProgress(mission);
          const isCompleted = state.weeklyMissionsCompleted.includes(mission.id);
          const progressPercent = Math.min(100, Math.round((progress / mission.target) * 100));

          return (
            <div
              key={mission.id}
              className="rounded-xl border p-4 transition-all duration-200 relative overflow-hidden"
              style={{
                background: isCompleted
                  ? "rgba(21,128,61,0.15)"
                  : tierStyle.bg,
                borderColor: isCompleted
                  ? "#16a34a"
                  : tierStyle.borderColor + "50",
                boxShadow: isCompleted
                  ? "0 0 15px rgba(22,163,74,0.2)"
                  : "none",
              }}
            >
              {/* Completion glow */}
              {isCompleted && (
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10"
                  style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)" }} />
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Tier badge */}
                    <div className="inline-flex items-center rounded px-1.5 py-0.5"
                      style={{
                        background: tierStyle.color + "20",
                        border: `1px solid ${tierStyle.color}40`
                      }}>
                      <span className="font-game text-[10px] tracking-widest" style={{ color: tierStyle.color }}>
                        {tierStyle.label}
                      </span>
                    </div>

                    {isCompleted && (
                      <div className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-green-900/40 border border-green-700">
                        <span className="text-[10px] text-green-400">✅ COMPLÉTÉ</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-game text-base text-white mb-0.5">{mission.title}</h3>
                  <p className="text-xs text-gray-500">{mission.description}</p>
                </div>

                <div className="text-right ml-3 flex-shrink-0">
                  <div className="font-game text-sm text-yellow-400">+{mission.xpReward} XP</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {progress}/{mission.target}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-game-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full progress-bar ${isCompleted ? "mission-progress-complete" : "mission-progress-bar"}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-600">{progressPercent}%</span>
                {!isCompleted && progress > 0 && (
                  <span className="text-xs text-gray-600">
                    {mission.target - progress} restant{mission.target - progress > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {completedCount === totalMissions && (
        <div className="bg-game-card border border-yellow-600/50 rounded-xl p-4 text-center"
          style={{ background: "rgba(113,63,18,0.2)" }}>
          <div className="text-4xl mb-2">🏆</div>
          <div className="font-game text-lg text-yellow-400">OPÉRATION COMPLÉTÉE !</div>
          <div className="text-sm text-gray-400 mt-1">Toutes les missions de la semaine sont terminées.</div>
          <div className="text-xs text-gray-500 mt-1">Nouvelles missions dans {daysLeft} jour{daysLeft > 1 ? "s" : ""}.</div>
        </div>
      )}
    </div>
  );
}
