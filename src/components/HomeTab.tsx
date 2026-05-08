"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/gameContext";
import { ACHIEVEMENTS } from "@/lib/gameData";

const MAX_ENERGY = 100;

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function HomeTab() {
  const { state, dispatch } = useGame();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const energyPercent = Math.round((state.dailyEnergyUsed / MAX_ENERGY) * 100);
  const energyRemaining = MAX_ENERGY - state.dailyEnergyUsed;
  const callsRemaining = Math.floor(energyRemaining / 2);

  const energyBarClass =
    energyPercent > 60 ? "energy-bar-high" :
    energyPercent > 30 ? "energy-bar-medium" :
    "energy-bar-low";

  const energyColor =
    energyPercent > 60 ? "#22c55e" :
    energyPercent > 30 ? "#eab308" :
    "#ef4444";

  // Session countdown
  let sessionMsLeft = 0;
  let sessionPercent = 0;
  let sessionExpired = false;
  if (state.sessionActive && state.sessionStart) {
    const sessionDurationMs = state.sessionTargetMinutes * 60 * 1000;
    const elapsed = now - state.sessionStart;
    sessionMsLeft = Math.max(0, sessionDurationMs - elapsed);
    sessionPercent = Math.min(100, Math.round((elapsed / sessionDurationMs) * 100));
    sessionExpired = elapsed >= sessionDurationMs;
  }

  // XP Buff countdown
  let buffMsLeft = 0;
  if (state.xpBuffActive && state.xpBuffEnd) {
    buffMsLeft = Math.max(0, state.xpBuffEnd - now);
  }

  // Recent achievements (last 3)
  const recentAchievements = state.unlockedAchievements
    .slice(-3)
    .reverse()
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
    .filter(Boolean);

  const dailyGoalProgress = Math.min(100, Math.round((state.dailyCalls / 20) * 100));
  const dailyGoalMet = state.dailyCalls >= 20;

  return (
    <div className="space-y-4">

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Calls Aujourd'hui",
            value: state.dailyCalls,
            icon: "📞",
            color: "#3b82f6",
            sub: `/${state.dailyCalls >= 20 ? "✅ Objectif atteint" : "20 objectif"}`,
          },
          {
            label: "Bookings Today",
            value: state.dailyBookings,
            icon: "🎯",
            color: "#22c55e",
            sub: `Total: ${state.totalBookings}`,
          },
          {
            label: "Streak Actuel",
            value: state.currentStreak,
            icon: "🔥",
            color: "#f97316",
            sub: `Record: ${state.longestStreak}j`,
          },
          {
            label: "XP Total",
            value: state.totalXP.toLocaleString(),
            icon: "⭐",
            color: "#ffd700",
            sub: `Lvl ${Math.floor(state.totalXP / 100) > 19 ? 20 : "→"}`,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-game-card border border-game-border rounded-xl p-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10 flex items-end justify-end p-1">
              <span className="text-3xl">{card.icon}</span>
            </div>
            <div className="text-xs text-gray-500 font-game tracking-wider mb-1">{card.label.toUpperCase()}</div>
            <div className="font-game text-2xl sm:text-3xl stat-value" style={{ color: card.color }}>
              {card.value}
            </div>
            <div className="text-xs text-gray-600 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Daily goal progress */}
      <div className={`bg-game-card border rounded-xl p-4 ${dailyGoalMet ? "border-green-700" : "border-game-border"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-game text-xs tracking-wider text-gray-400">OBJECTIF JOURNALIER — 20 CALLS</span>
          <span className={`font-game text-sm ${dailyGoalMet ? "text-green-400" : "text-gray-400"}`}>
            {dailyGoalMet ? "✅ COMPLÉTÉ +100 XP" : `${state.dailyCalls}/20`}
          </span>
        </div>
        <div className="h-2 bg-game-border rounded-full overflow-hidden">
          <div
            className="progress-bar h-full rounded-full"
            style={{
              width: `${dailyGoalProgress}%`,
              background: dailyGoalMet
                ? "linear-gradient(90deg, #15803d, #22c55e)"
                : "linear-gradient(90deg, #1d4ed8, #3b82f6)",
              boxShadow: dailyGoalMet
                ? "0 0 8px rgba(34,197,94,0.5)"
                : "0 0 8px rgba(59,130,246,0.4)",
            }}
          />
        </div>
      </div>

      {/* Energy panel */}
      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-game text-xs tracking-widest text-gray-400">ÉNERGIE JOURNALIÈRE</div>
          <div className="flex items-center gap-2">
            <span className="font-game text-sm" style={{ color: energyColor }}>
              {energyRemaining}/{MAX_ENERGY}
            </span>
            <span className="text-gray-600 text-xs">({callsRemaining} calls restants)</span>
          </div>
        </div>

        {/* Energy bar */}
        <div className="h-4 bg-game-border rounded-full overflow-hidden mb-2 relative">
          <div
            className={`${energyBarClass} h-full rounded-full progress-bar`}
            style={{ width: `${energyPercent}%` }}
          />
          {/* Markers */}
          <div className="absolute inset-0 flex">
            {[25, 50, 75].map((pct) => (
              <div key={pct} className="absolute top-0 bottom-0 w-px bg-game-bg opacity-30"
                style={{ left: `${pct}%` }} />
            ))}
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-600">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>

        {state.dailyEnergyUsed >= MAX_ENERGY && (
          <div className="mt-2 text-center font-game text-xs text-orange-400 border border-orange-800 rounded-lg py-1"
            style={{ background: "rgba(124,45,18,0.2)" }}>
            ⚡ ÉNERGIE ÉPUISÉE — Réinitialisation à minuit
          </div>
        )}
      </div>

      {/* Session panel */}
      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="font-game text-xs tracking-widest text-gray-400 mb-3">SESSION DE TRAVAIL</div>

        {!state.sessionActive ? (
          <div>
            <p className="text-sm text-gray-500 mb-3">Démarre une session pour activer le buff XP ×1.5 à la fin.</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { minutes: 30, label: "30 MIN", icon: "⚡" },
                { minutes: 60, label: "1 HEURE", icon: "🔥" },
                { minutes: 120, label: "2 HEURES", icon: "💪" },
              ].map((opt) => (
                <button
                  key={opt.minutes}
                  onClick={() => dispatch({ type: "START_SESSION", minutes: opt.minutes })}
                  className="py-3 rounded-lg border border-game-border-light text-center transition-all duration-150 hover:border-blue-500 active:scale-95"
                  style={{ background: "rgba(14,14,26,0.8)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(30,58,138,0.3)";
                    e.currentTarget.style.boxShadow = "0 0 15px rgba(59,130,246,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(14,14,26,0.8)";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <div className="text-xl mb-1">{opt.icon}</div>
                  <div className="font-game text-sm text-blue-400">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className={`font-game text-4xl ${sessionExpired ? "session-expired" : "text-white"}`}>
                  {sessionExpired ? "TERMINÉ!" : formatCountdown(sessionMsLeft)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Objectif: {state.sessionTargetMinutes} min • {state.sessionCalls} calls • {state.sessionBookings} bookings
                </div>
              </div>
              <button
                onClick={() => dispatch({ type: "END_SESSION" })}
                className="px-4 py-2 rounded-lg font-game text-sm border transition-all active:scale-95"
                style={{
                  background: sessionExpired ? "rgba(21,128,61,0.3)" : "rgba(30,58,138,0.3)",
                  borderColor: sessionExpired ? "#22c55e" : "#3b82f6",
                  color: sessionExpired ? "#22c55e" : "#60a5fa",
                }}
              >
                {sessionExpired ? "✅ Terminer" : "⏹ Terminer"}
              </button>
            </div>

            {/* Session progress bar */}
            <div className="h-2 bg-game-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full progress-bar"
                style={{
                  width: `${sessionPercent}%`,
                  background: sessionExpired
                    ? "linear-gradient(90deg, #15803d, #22c55e)"
                    : "linear-gradient(90deg, #7c3aed, #8b5cf6)",
                }}
              />
            </div>
          </div>
        )}

        {/* XP Buff indicator */}
        {state.xpBuffActive && buffMsLeft > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-yellow-600/50 px-3 py-2"
            style={{ background: "rgba(113,63,18,0.3)" }}>
            <span className="text-yellow-400 animate-pulse">⚡</span>
            <span className="font-game text-sm text-yellow-300">BUFF XP ×1.5 ACTIF</span>
            <span className="ml-auto font-game text-yellow-400">{formatCountdown(buffMsLeft)}</span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="font-game text-xs tracking-widest text-gray-400 mb-3">ACTIONS RAPIDES</div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Log Call */}
          <button
            onClick={() => dispatch({ type: "LOG_CALL" })}
            disabled={state.dailyEnergyUsed >= MAX_ENERGY}
            className="py-5 rounded-xl font-game text-base tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: state.dailyEnergyUsed >= MAX_ENERGY
                ? "rgba(30,41,59,0.5)"
                : "linear-gradient(135deg, #1d4ed8, #2563eb)",
              border: "1px solid",
              borderColor: state.dailyEnergyUsed >= MAX_ENERGY ? "#334155" : "#3b82f6",
              boxShadow: state.dailyEnergyUsed >= MAX_ENERGY ? "none" : "0 0 20px rgba(59,130,246,0.3)",
              color: state.dailyEnergyUsed >= MAX_ENERGY ? "#64748b" : "#fff",
            }}
            onMouseEnter={(e) => {
              if (state.dailyEnergyUsed < MAX_ENERGY) {
                e.currentTarget.style.boxShadow = "0 0 30px rgba(59,130,246,0.6)";
              }
            }}
            onMouseLeave={(e) => {
              if (state.dailyEnergyUsed < MAX_ENERGY) {
                e.currentTarget.style.boxShadow = "0 0 20px rgba(59,130,246,0.3)";
              }
            }}
          >
            <div className="text-2xl mb-1">📞</div>
            <div>LOG CALL</div>
            <div className="text-xs opacity-70 mt-0.5">+10 XP • -2 ⚡</div>
          </button>

          {/* Log Booking */}
          <button
            onClick={() => dispatch({ type: "LOG_BOOKING" })}
            className="py-5 rounded-xl font-game text-base tracking-wide transition-all duration-150 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #15803d, #16a34a)",
              border: "1px solid #22c55e",
              boxShadow: "0 0 20px rgba(34,197,94,0.3)",
              color: "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 30px rgba(34,197,94,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 20px rgba(34,197,94,0.3)";
            }}
          >
            <div className="text-2xl mb-1">🎯</div>
            <div>LOG BOOKING</div>
            <div className="text-xs opacity-70 mt-0.5">+50 XP</div>
          </button>
        </div>

        {/* Undo */}
        <button
          onClick={() => dispatch({ type: "UNDO_CALL" })}
          disabled={state.dailyCalls === 0}
          className="w-full text-center text-xs text-gray-600 hover:text-gray-400 transition-colors py-1 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ↩ Annuler le dernier call
        </button>
      </div>

      {/* Recent achievements */}
      {recentAchievements.length > 0 && (
        <div className="bg-game-card border border-game-border rounded-xl p-4">
          <div className="font-game text-xs tracking-widest text-gray-400 mb-3">
            HAUTS FAITS RÉCENTS
          </div>
          <div className="space-y-2">
            {recentAchievements.map((ach) => {
              if (!ach) return null;
              const tierColor =
                ach.tier === "gold" ? "#ffd700" :
                ach.tier === "silver" ? "#c8d0e0" :
                "#cd7f32";
              const tierBg =
                ach.tier === "gold" ? "rgba(26,20,0,0.8)" :
                ach.tier === "silver" ? "rgba(20,20,32,0.8)" :
                "rgba(26,13,0,0.8)";

              return (
                <div
                  key={ach.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2"
                  style={{ background: tierBg, borderColor: tierColor + "40" }}
                >
                  <span className="text-xl">{ach.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-game text-sm" style={{ color: tierColor }}>
                      {ach.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{ach.description}</div>
                  </div>
                  <div className="font-game text-xs" style={{ color: tierColor }}>
                    +{ach.xpReward} XP
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
