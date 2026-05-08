"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/gameContext";
import { getRank, getNextRank } from "@/lib/gameData";

const MAX_ENERGY = 100;

function fmt(ms: number): string {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const CARD_BG   = "#232323";
const BORDER    = "#383838";

export default function HomeTab() {
  const { state, dispatch } = useGame();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const energyPct   = Math.round((state.dailyEnergyUsed / MAX_ENERGY) * 100);
  const energyLeft  = MAX_ENERGY - state.dailyEnergyUsed;
  const callsLeft   = Math.floor(energyLeft / 2);
  const depleted    = state.dailyEnergyUsed >= MAX_ENERGY;

  const energyClass =
    energyPct > 60 ? "energy-bar-high" :
    energyPct > 30 ? "energy-bar-medium" :
    "energy-bar-low";

  const energyColor =
    energyPct > 60 ? "#22c55e" :
    energyPct > 30 ? "#eab308" : "#ef4444";

  // Session
  let sessionMsLeft = 0, sessionPct = 0, sessionExpired = false;
  if (state.sessionActive && state.sessionStart) {
    const dur     = state.sessionTargetMinutes * 60_000;
    const elapsed = now - state.sessionStart;
    sessionMsLeft = Math.max(0, dur - elapsed);
    sessionPct    = Math.min(100, Math.round((elapsed / dur) * 100));
    sessionExpired = elapsed >= dur;
  }

  const rank     = getRank(state.totalBookings);
  const nextRank = getNextRank(state.totalBookings);

  const goalPct  = Math.min(100, Math.round((state.dailyCalls / 20) * 100));
  const goalMet  = state.dailyCalls >= 20;

  return (
    <div className="space-y-3 max-w-3xl mx-auto">

      {/* ── KPI row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {([
          { label: "Calls",   value: state.dailyCalls,          sub: `Total: ${state.totalCalls}`,      color: "#FF5500", icon: "📞" },
          { label: "RDV",     value: state.dailyBookings,        sub: `Total: ${state.totalBookings}`,   color: "#1CE400", icon: "🎯" },
          { label: "Streak",  value: `${state.currentStreak}J`,  sub: `Record: ${state.longestStreak}j`, color: "#5DC7E5", icon: "🔥" },
          { label: "Rang",    value: rank.name.split(" ").slice(-2).join(" "), sub: nextRank ? `→ ${nextRank.name}` : "MAX", color: rank.color, icon: rank.group === "global" ? "👑" : rank.group === "guardian" ? "🛡️" : rank.group === "gold" ? "🏅" : "🥈" },
        ] as const).map((c) => (
          <div
            key={c.label}
            className="rounded-sm p-3 flex flex-col gap-1"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>
                {c.label.toUpperCase()}
              </span>
              <span style={{ fontSize: "0.75rem" }}>{c.icon}</span>
            </div>
            <div className="font-game text-2xl sm:text-3xl stat-value leading-none" style={{ color: c.color }}>
              {c.value}
            </div>
            <div style={{ color: "#848484", fontSize: "0.68rem" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Daily goal ───────────────────────────────────────────────────── */}
      <div
        className="rounded-sm px-4 py-3"
        style={{
          background: CARD_BG,
          border: `1px solid ${goalMet ? "rgba(28,228,0,0.4)" : BORDER}`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>
            OBJECTIF JOURNALIER
          </span>
          <span className="font-game text-xs" style={{ color: goalMet ? "#1CE400" : "#C0C0C0" }}>
            {goalMet ? "✅ +100 XP" : `${state.dailyCalls} / 20 CALLS`}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#383838" }}>
          <div
            className="h-full rounded-full progress-bar"
            style={{
              width: `${goalPct}%`,
              background: goalMet
                ? "linear-gradient(90deg,#15803d,#22c55e)"
                : "linear-gradient(90deg,#CC4400,#FF5500)",
              boxShadow: goalMet
                ? "0 0 6px rgba(34,197,94,0.5)"
                : "0 0 6px rgba(255,85,0,0.4)",
            }}
          />
        </div>
      </div>

      {/* ── Action buttons ───────────────────────────────────────────────── */}
      <div
        className="rounded-sm p-4"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <div className="font-game text-[10px] tracking-widest mb-3" style={{ color: "#848484" }}>
          ACTIONS RAPIDES
        </div>

        {/* LOG CALL — primary orange */}
        <button
          onClick={() => dispatch({ type: "LOG_CALL" })}
          disabled={depleted}
          className="w-full py-4 rounded-sm font-game text-sm tracking-wide transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed mb-3 btn-pulse"
          style={{
            background: depleted ? "#232323" : "#FF5500",
            border: `1px solid ${depleted ? "#383838" : "#FF5500"}`,
            color: depleted ? "#848484" : "#FFF",
          }}
          onMouseEnter={(e) => { if (!depleted) { e.currentTarget.style.background = "#FF6B1A"; e.currentTarget.style.borderColor = "#FF6B1A"; } }}
          onMouseLeave={(e) => { if (!depleted) { e.currentTarget.style.background = "#FF5500"; e.currentTarget.style.borderColor = "#FF5500"; } }}
        >
          <span style={{ fontSize: "1.2rem" }}>📞</span>
          {"  "}LOG CALL
          <span style={{ opacity: 0.7, fontSize: "0.7rem", marginLeft: "8px" }}>-2⚡</span>
        </button>

        <div className="mb-3">
          <button
            onClick={() => dispatch({ type: "LOG_BOOKING" })}
            className="w-full py-4 rounded-sm font-game text-sm tracking-wide transition-all duration-150 active:scale-95"
            style={{ background: "rgba(28,228,0,0.1)", border: "1px solid rgba(28,228,0,0.4)", color: "#1CE400" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(28,228,0,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(28,228,0,0.1)"; }}
          >
            <div style={{ fontSize: "1.1rem" }}>🎯</div>
            LOG RDV
          </button>
        </div>

        <button
          onClick={() => dispatch({ type: "UNDO_CALL" })}
          disabled={state.dailyCalls === 0}
          className="w-full text-center text-xs transition-colors py-1 disabled:opacity-20 disabled:cursor-not-allowed"
          style={{ color: "#848484" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#C0C0C0"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#848484"; }}
        >
          ↩ Annuler le dernier call
        </button>
      </div>

      {/* ── Energy + Session (side by side on sm+) ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Energy */}
        <div
          className="rounded-sm p-4"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>ÉNERGIE</span>
            <span className="font-game text-sm" style={{ color: energyColor }}>
              {energyLeft} / {MAX_ENERGY}
              <span style={{ color: "#848484", fontSize: "0.65rem", marginLeft: "4px" }}>
                ({callsLeft} calls)
              </span>
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden relative" style={{ background: "#383838" }}>
            <div className={`${energyClass} h-full rounded-full progress-bar`} style={{ width: `${energyPct}%` }} />
            {[25, 50, 75].map((p) => (
              <div key={p} className="absolute top-0 bottom-0 w-px opacity-20"
                style={{ left: `${p}%`, background: "#111" }} />
            ))}
          </div>
          <div className="flex justify-between mt-1" style={{ fontSize: "0.6rem", color: "#686868" }}>
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
          {depleted && (
            <div
              className="mt-2 font-game text-[10px] text-center py-1.5 rounded-sm tracking-widest"
              style={{ background: "rgba(255,85,0,0.08)", border: "1px solid rgba(255,85,0,0.25)", color: "#FF5500" }}
            >
              ⚡ ÉPUISÉE — RESET À MINUIT
            </div>
          )}
        </div>

        {/* Session */}
        <div
          className="rounded-sm p-4"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="font-game text-[10px] tracking-widest mb-3" style={{ color: "#848484" }}>
            SESSION DE TRAVAIL
          </div>

          {!state.sessionActive ? (
            <div>
              <p style={{ color: "#848484", fontSize: "0.75rem", marginBottom: "0.6rem" }}>
                Reste focus pendant la session — timer visible pour tenir le rythme.
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { minutes: 30,  label: "30 MIN" },
                  { minutes: 60,  label: "1H" },
                  { minutes: 120, label: "2H" },
                ].map((opt) => (
                  <button
                    key={opt.minutes}
                    onClick={() => dispatch({ type: "START_SESSION", minutes: opt.minutes })}
                    className="py-3 rounded-sm font-game text-xs tracking-wider transition-all duration-150 active:scale-95"
                    style={{ background: "#2D2D2D", border: "1px solid #383838", color: "#C0C0C0" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#FF5500";
                      e.currentTarget.style.color = "#FF5500";
                      e.currentTarget.style.background = "rgba(255,85,0,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#383838";
                      e.currentTarget.style.color = "#C0C0C0";
                      e.currentTarget.style.background = "#2D2D2D";
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div
                    className={`font-game text-3xl leading-none ${sessionExpired ? "session-expired" : "text-white"}`}
                  >
                    {sessionExpired ? "TERMINÉ!" : fmt(sessionMsLeft)}
                  </div>
                  <div style={{ color: "#848484", fontSize: "0.65rem", marginTop: "3px" }}>
                    {state.sessionTargetMinutes}min · {state.sessionCalls} calls · {state.sessionBookings} RDV
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: "END_SESSION" })}
                  className="px-3 py-1.5 rounded-sm font-game text-xs tracking-wider transition-all active:scale-95"
                  style={{
                    background: sessionExpired ? "rgba(28,228,0,0.1)" : "rgba(255,85,0,0.1)",
                    border:     sessionExpired ? "1px solid rgba(28,228,0,0.4)" : "1px solid rgba(255,85,0,0.4)",
                    color:      sessionExpired ? "#1CE400" : "#FF5500",
                  }}
                >
                  {sessionExpired ? "✅ CLORE" : "⏹ STOP"}
                </button>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#383838" }}>
                <div
                  className="h-full rounded-full progress-bar"
                  style={{
                    width: `${sessionPct}%`,
                    background: sessionExpired
                      ? "linear-gradient(90deg,#15803d,#22c55e)"
                      : "linear-gradient(90deg,#7c3aed,#8b5cf6)",
                  }}
                />
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
