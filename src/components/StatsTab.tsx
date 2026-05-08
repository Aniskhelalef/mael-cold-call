"use client";

import { useGame } from "@/lib/gameContext";
import { getRank, getNextRank, getLevel, getNextLevel, getLevelProgress, formatDate } from "@/lib/gameData";

export default function StatsTab() {
  const { state } = useGame();
  const rank = getRank(state.totalBookings);
  const nextRank = getNextRank(state.totalBookings);
  const level = getLevel(state.totalXP);
  const nextLevel = getNextLevel(state.totalXP);
  const lvlProgress = getLevelProgress(state.totalXP);

  const conversionRate = state.totalCalls > 0
    ? ((state.totalBookings / state.totalCalls) * 100).toFixed(1)
    : "0.0";

  // Best day calculation
  const allDays = [
    ...state.history,
    // Add current day if has activity
    ...(state.dailyCalls > 0 || state.dailyBookings > 0
      ? [{ date: state.lastResetDate, calls: state.dailyCalls, bookings: state.dailyBookings }]
      : []),
  ];

  const bestDay = allDays.reduce(
    (best, day) =>
      day.calls > (best?.calls ?? -1) ? day : best,
    null as { date: string; calls: number; bookings: number } | null
  );

  // Last 7 days data
  const last7Dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Dates.push(d.toISOString().split("T")[0]);
  }

  const last7Data = last7Dates.map((date) => {
    if (date === state.lastResetDate) {
      return { date, calls: state.dailyCalls, bookings: state.dailyBookings };
    }
    const found = state.history.find((h) => h.date === date);
    return found ?? { date, calls: 0, bookings: 0 };
  });

  const maxCalls = Math.max(...last7Data.map((d) => d.calls), 1);

  const rankColor = rank.color;
  const rankGroupClass =
    rank.group === "global" ? "rank-global" :
    rank.group === "supreme" ? "rank-supreme" :
    rank.group === "eagle" ? "rank-eagle" :
    rank.group === "guardian" ? "rank-guardian" :
    rank.group === "gold" ? "rank-gold" : "";

  return (
    <div className="space-y-4">
      {/* Big 3 numbers */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Calls", value: state.totalCalls.toLocaleString(), icon: "📞", color: "#3b82f6" },
          { label: "Total Bookings", value: state.totalBookings.toLocaleString(), icon: "🎯", color: "#22c55e" },
          { label: "Taux Conversion", value: `${conversionRate}%`, icon: "📈", color: "#f6ad55" },
        ].map((s) => (
          <div key={s.label} className="bg-game-card border border-game-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-game text-2xl sm:text-3xl stat-value" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* CS:GO Rank panel */}
      <div className="bg-game-card border border-game-border rounded-xl p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ background: `radial-gradient(circle at 80% 50%, ${rankColor} 0%, transparent 60%)` }} />

        <div className="relative">
          <div className="font-game text-xs tracking-widest text-gray-500 mb-3">RANG CS:GO</div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`font-game text-2xl sm:text-3xl ${rankGroupClass}`}
                style={{ color: rankGroupClass ? undefined : rankColor }}>
                {rank.name}
              </div>
              <div className="text-sm text-gray-500 mt-1">{state.totalBookings} bookings au total</div>
            </div>
            {/* Rank icon */}
            <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: rankColor,
                background: `radial-gradient(circle, ${rankColor}20 0%, transparent 70%)`,
                boxShadow: `0 0 20px ${rankColor}30`
              }}>
              <span className="text-3xl">
                {rank.group === "global" ? "👑" :
                  rank.group === "supreme" ? "⭐" :
                  rank.group === "eagle" ? "🦅" :
                  rank.group === "guardian" ? "🛡️" :
                  rank.group === "gold" ? "🏅" : "🥈"}
              </span>
            </div>
          </div>

          {nextRank ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Prochain rang: </span>
                <span className="font-game text-xs" style={{ color: nextRank.color }}>{nextRank.name}</span>
              </div>
              <div className="h-2 bg-game-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full progress-bar"
                  style={{
                    width: `${Math.round(((state.totalBookings - rank.minBookings) / (nextRank.minBookings - rank.minBookings)) * 100)}%`,
                    background: `linear-gradient(90deg, ${rankColor}80, ${rankColor})`,
                    boxShadow: `0 0 6px ${rankColor}40`,
                  }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {nextRank.minBookings - state.totalBookings} bookings pour {nextRank.name}
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="font-game text-sm text-green-400 glow-green">
                🏆 RANG MAXIMUM ATTEINT — GLOBAL ELITE
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Level panel */}
      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="font-game text-xs tracking-widest text-gray-500 mb-3">NIVEAU & XP</div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg border border-blue-500/40 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)" }}>
              <span className="font-game text-blue-300 text-lg">{level.level}</span>
            </div>
            <div>
              <div className="font-game text-base text-blue-400">{level.title}</div>
              <div className="text-xs text-gray-500">Niveau {level.level}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-game text-xl text-yellow-400">{state.totalXP.toLocaleString()}</div>
            <div className="text-xs text-gray-500">XP total</div>
          </div>
        </div>

        {nextLevel && (
          <>
            <div className="h-2 bg-game-border rounded-full overflow-hidden mb-1">
              <div
                className="xp-bar-fill h-full rounded-full"
                style={{ width: `${lvlProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Niveau {level.level}</span>
              <span>{lvlProgress}%</span>
              <span>Niveau {nextLevel.level} — {nextLevel.title}</span>
            </div>
          </>
        )}
      </div>

      {/* Best day */}
      {bestDay && (
        <div className="bg-game-card border border-game-border rounded-xl p-4">
          <div className="font-game text-xs tracking-widest text-gray-500 mb-3">MEILLEUR JOUR</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <div className="font-game text-base text-white">{formatDate(bestDay.date)}</div>
                <div className="text-xs text-gray-500">Meilleure performance</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="font-game text-xl text-blue-400">{bestDay.calls}</div>
                <div className="text-xs text-gray-600">calls</div>
              </div>
              <div className="text-center">
                <div className="font-game text-xl text-green-400">{bestDay.bookings}</div>
                <div className="text-xs text-gray-600">bookings</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last 7 days chart */}
      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="font-game text-xs tracking-widest text-gray-500 mb-4">7 DERNIERS JOURS</div>

        <div className="flex items-end gap-2 h-32">
          {last7Data.map((day) => {
            const barHeight = maxCalls > 0 ? Math.round((day.calls / maxCalls) * 100) : 0;
            const isToday = day.date === state.lastResetDate;
            const dayName = new Date(day.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" });

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                {/* Bar container */}
                <div className="flex-1 w-full flex items-end justify-center">
                  <div className="w-full relative group">
                    {/* Booking indicator */}
                    {day.bookings > 0 && (
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${barHeight > 0 ? Math.max(4, Math.round((day.bookings / Math.max(day.calls, 1)) * barHeight * (100 / 100))): 4}%`,
                          minHeight: "4px",
                          background: "linear-gradient(180deg, #22c55e, #16a34a)",
                          boxShadow: "0 0 6px rgba(34,197,94,0.4)",
                        }}
                      />
                    )}
                    {/* Call bar */}
                    <div
                      className="bar-chart-bar w-full rounded"
                      style={{
                        height: `${Math.max(barHeight > 0 ? barHeight : 0, day.calls > 0 ? 4 : 0)}px`,
                        minHeight: day.calls > 0 ? "4px" : "2px",
                        background: isToday
                          ? "linear-gradient(180deg, #60a5fa, #2563eb)"
                          : "linear-gradient(180deg, #334155, #1e293b)",
                        boxShadow: isToday ? "0 0 8px rgba(59,130,246,0.4)" : "none",
                      }}
                    />

                    {/* Tooltip on hover */}
                    {day.calls > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10
                        bg-game-bg border border-game-border rounded px-2 py-1 whitespace-nowrap text-xs">
                        <div className="text-blue-400">{day.calls} calls</div>
                        {day.bookings > 0 && <div className="text-green-400">{day.bookings} bookings</div>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Day label */}
                <div className={`text-[10px] font-game capitalize ${isToday ? "text-blue-400" : "text-gray-600"}`}>
                  {dayName}
                </div>

                {/* Count */}
                <div className={`text-[10px] ${day.calls > 0 ? "text-gray-400" : "text-gray-700"}`}>
                  {day.calls > 0 ? day.calls : "-"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 justify-end">
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded" style={{ background: "#2563eb" }} />
            <span className="text-xs text-gray-600">Calls</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded" style={{ background: "#22c55e" }} />
            <span className="text-xs text-gray-600">Bookings</span>
          </div>
        </div>
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Streak actuel", value: `${state.currentStreak}j`, icon: "🔥", color: "#f97316" },
          { label: "Record streak", value: `${state.longestStreak}j`, icon: "🏅", color: "#ffd700" },
          { label: "Énergie utilisée", value: `${state.fullEnergyCount}x`, icon: "⚡", color: "#fbbf24", sub: "full energy" },
          { label: "Hauts faits", value: `${state.unlockedAchievements.length}/31`, icon: "🏆", color: "#c084fc" },
        ].map((s) => (
          <div key={s.label} className="bg-game-card border border-game-border rounded-xl p-4">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="font-game text-xl" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
            {s.sub && <div className="text-xs text-gray-700">{s.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
