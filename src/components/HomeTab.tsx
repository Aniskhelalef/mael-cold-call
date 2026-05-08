"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/gameContext";
import { getRank, getNextRank, RANK_MONEY_REWARDS } from "@/lib/gameData";
import { fetchLeaderboard, LeaderboardEntry } from "@/lib/supabase";

const MEDAL = ["🥇", "🥈", "🥉"];

function getInitials(name: string): string {
  return name.split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmt(ms: number): string {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const CARD_BG = "#232323";
const BORDER  = "#383838";

export default function HomeTab() {
  const { state, dispatch } = useGame();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Session
  let sessionMsLeft = 0, sessionPct = 0, sessionExpired = false;
  if (state.sessionActive && state.sessionStart) {
    const dur      = state.sessionTargetMinutes * 60_000;
    const elapsed  = now - state.sessionStart;
    sessionMsLeft  = Math.max(0, dur - elapsed);
    sessionPct     = Math.min(100, Math.round((elapsed / dur) * 100));
    sessionExpired = elapsed >= dur;
  }

  const rank     = getRank(state.totalBookings);
  const nextRank = getNextRank(state.totalBookings);

  const goalPct = Math.min(100, Math.round((state.dailyCalls / 20) * 100));
  const goalMet = state.dailyCalls >= 20;

  const rankGroupIcon =
    rank.group === "global"   ? "👑" :
    rank.group === "guardian" ? "🛡️" :
    rank.group === "gold"     ? "🏅" : "🥈";

  const rankPct = nextRank
    ? Math.round(((state.totalBookings - rank.minBookings) / (nextRank.minBookings - rank.minBookings)) * 100)
    : 100;

  const nextRankReward = nextRank ? RANK_MONEY_REWARDS[nextRank.name] : null;

  const totalCallsYes = state.totalCallsYes ?? 0;
  const tauxReponse    = state.totalCalls > 0 ? Math.round((totalCallsYes / state.totalCalls) * 100) : 0;
  const tauxConversion = state.totalCalls > 0 ? Math.round((state.totalBookings / state.totalCalls) * 100) : 0;

  const [lbEntries, setLbEntries] = useState<LeaderboardEntry[]>([]);
  useEffect(() => {
    fetchLeaderboard().then(setLbEntries).catch(() => {});
  }, []);

  const myEmail = state.playerEmail;
  const myOnLb  = lbEntries.some((e) => e.email === myEmail || e.name === state.playerName);
  const localEntry: LeaderboardEntry | null = !myOnLb && state.playerName
    ? { email: myEmail, name: state.playerName, totalXP: 0, totalCalls: state.totalCalls, totalBookings: state.totalBookings, currentStreak: state.currentStreak, totalSales: state.totalSales, updatedAt: new Date().toISOString() }
    : null;
  const lbSorted = [...lbEntries, ...(localEntry ? [localEntry] : [])]
    .sort((a, b) => b.totalBookings - a.totalBookings);
  const myLbPos = lbSorted.findIndex((e) => e.email === myEmail || e.name === state.playerName) + 1;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="lg:grid lg:gap-4" style={{ gridTemplateColumns: "1fr 260px" } as React.CSSProperties}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="space-y-3">

          {/* ── KPI row ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2">
            {([
              { label: "Calls",  value: state.dailyCalls,         sub: `Total: ${state.totalCalls}`,      color: "#FF5500", icon: "📞" },
              { label: "RDV",    value: state.dailyBookings,       sub: `Total: ${state.totalBookings}`,   color: "#1CE400", icon: "🎯" },
              { label: "Streak", value: `${state.currentStreak}J`, sub: `Record: ${state.longestStreak}j`, color: "#5DC7E5", icon: "🔥" },
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

          {/* ── Daily goal ──────────────────────────────────────────────── */}
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
                {goalMet ? "✅ OBJECTIF ATTEINT" : `${state.dailyCalls} / 20 CALLS`}
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

          {/* ── Action buttons ──────────────────────────────────────────── */}
          <div
            className="rounded-sm p-4"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            <div className="font-game text-[10px] tracking-widest mb-3" style={{ color: "#848484" }}>
              ACTIONS RAPIDES
            </div>

            {/* NON / OUI side by side */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* NON */}
              <button
                onClick={() => dispatch({ type: "LOG_CALL" })}
                className="py-5 rounded-sm font-game text-sm tracking-wide transition-all duration-150 active:scale-95 btn-pulse"
                style={{
                  background: "#FF5500",
                  border: "1px solid #FF5500",
                  color: "#FFF",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#FF6B1A"; e.currentTarget.style.borderColor = "#FF6B1A"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#FF5500"; e.currentTarget.style.borderColor = "#FF5500"; }}
              >
                <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>👎</div>
                <div>A RÉPONDU NON</div>
              </button>

              {/* OUI */}
              <button
                onClick={() => dispatch({ type: "LOG_CALL_YES" })}
                className="py-5 rounded-sm font-game text-sm tracking-wide transition-all duration-150 active:scale-95"
                style={{
                  background: "rgba(93,199,229,0.1)",
                  border: "1px solid rgba(93,199,229,0.4)",
                  color: "#5DC7E5",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.18)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.1)"; }}
              >
                <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>👍</div>
                <div>A RÉPONDU OUI</div>
              </button>
            </div>

            {/* CALL BOOKÉ — full width, only enabled after a OUI */}
            {(() => {
              const pendingOui = state.pendingOuiCount ?? 0;
              return (
                <button
                  onClick={() => dispatch({ type: "LOG_BOOKING" })}
                  disabled={pendingOui === 0}
                  className="w-full py-3 rounded-sm font-game text-sm tracking-wide transition-all duration-150 active:scale-95 mb-3 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: pendingOui > 0 ? "rgba(28,228,0,0.08)" : "#232323",
                    border: pendingOui > 0 ? "1px solid rgba(28,228,0,0.35)" : "1px solid #383838",
                    color: pendingOui > 0 ? "#1CE400" : "#848484",
                  }}
                  onMouseEnter={(e) => { if (pendingOui > 0) e.currentTarget.style.background = "rgba(28,228,0,0.16)"; }}
                  onMouseLeave={(e) => { if (pendingOui > 0) e.currentTarget.style.background = "rgba(28,228,0,0.08)"; }}
                >
                  <span style={{ marginRight: "8px" }}>🎯</span>
                  CALL BOOKÉ
                  {pendingOui > 0 && (
                    <span style={{ opacity: 0.7, fontSize: "0.65rem", marginLeft: "8px" }}>
                      {pendingOui} OUI en attente
                    </span>
                  )}
                </button>
              );
            })()}

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

          {/* ── Session ─────────────────────────────────────────────────── */}
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
                    <div className={`font-game text-3xl leading-none ${sessionExpired ? "session-expired" : "text-white"}`}>
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

        {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
        <div className="mt-3 lg:mt-0 space-y-3">

          {/* Rank card */}
          <div
            className="rounded-sm p-4 relative overflow-hidden"
            style={{ background: CARD_BG, border: `1px solid ${rank.color}40` }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top right, ${rank.color}0d 0%, transparent 65%)` }}
            />

            <div className="relative z-10">
              <div className="font-game text-[10px] tracking-widest mb-3" style={{ color: "#848484" }}>
                RANG ACTUEL
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-sm flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${rank.color}18`, border: `1px solid ${rank.color}50` }}
                >
                  {rankGroupIcon}
                </div>
                <div>
                  <div className="font-game text-base leading-tight" style={{ color: rank.color }}>
                    {rank.name}
                  </div>
                  <div style={{ color: "#848484", fontSize: "0.68rem", marginTop: "2px" }}>
                    {state.totalBookings} RDV au total
                  </div>
                </div>
              </div>

              {nextRank ? (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ color: "#848484", fontSize: "0.65rem" }}>
                      Prochain : <span style={{ color: nextRank.color }}>{nextRank.name}</span>
                    </span>
                    <span className="font-game text-xs" style={{ color: rank.color }}>
                      {rankPct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "#383838" }}>
                    <div
                      className="h-full rounded-full progress-bar"
                      style={{ width: `${rankPct}%`, background: rank.color }}
                    />
                  </div>
                  <div style={{ color: "#686868", fontSize: "0.6rem" }}>
                    encore {nextRank.minBookings - state.totalBookings} RDV
                  </div>

                  {(nextRankReward || nextRank.group === "global") && (
                    <div
                      className="mt-3 px-3 py-2 rounded-sm"
                      style={{ background: `${nextRank.color}0d`, border: `1px solid ${nextRank.color}30` }}
                    >
                      <div className="font-game text-[9px] tracking-widest mb-0.5" style={{ color: "#848484" }}>
                        RÉCOMPENSE AU RANG SUIVANT
                      </div>
                      <div className="font-game text-sm" style={{ color: nextRank.group === "global" ? "#f6ad55" : nextRank.color }}>
                        {nextRank.group === "global" ? "🎁 MacBook Pro" : `💶 +${nextRankReward}€`}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="px-3 py-2 rounded-sm text-center"
                  style={{ background: "rgba(104,211,145,0.08)", border: "1px solid rgba(104,211,145,0.3)" }}
                >
                  <div className="font-game text-xs tracking-widest" style={{ color: "#68d391" }}>
                    👑 RANG MAXIMUM
                  </div>
                </div>
              )}

              <div className="my-4" style={{ height: "1px", background: "#383838" }} />

              <div className="flex items-center justify-between">
                <span className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>
                  GAINS DÉBLOQUÉS
                </span>
                <span className="font-game text-sm" style={{ color: "#1CE400" }}>
                  💶 {state.totalMoneyEarned}€
                </span>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          {state.totalCalls > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {/* Taux de réponse */}
              <div
                className="rounded-sm px-3 py-3"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
              >
                <div className="font-game text-[9px] tracking-widest mb-1.5" style={{ color: "#848484" }}>
                  TX. RÉPONSE
                </div>
                <div className="font-game text-2xl leading-none" style={{ color: "#5DC7E5" }}>
                  {tauxReponse}%
                </div>
                <div style={{ color: "#686868", fontSize: "0.6rem", marginTop: "3px" }}>
                  {totalCallsYes} OUI / {state.totalCalls} calls
                </div>
              </div>

              {/* Taux de conversion */}
              <div
                className="rounded-sm px-3 py-3"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
              >
                <div className="font-game text-[9px] tracking-widest mb-1.5" style={{ color: "#848484" }}>
                  TX. CONVERSION
                </div>
                <div className="font-game text-2xl leading-none" style={{ color: "#FF5500" }}>
                  {tauxConversion}%
                </div>
                <div style={{ color: "#686868", fontSize: "0.6rem", marginTop: "3px" }}>
                  {state.totalBookings} RDV / {state.totalCalls} calls
                </div>
              </div>
            </div>
          )}

          {/* Mini-leaderboard */}
          {lbSorted.length > 0 && (
            <div
              className="rounded-sm overflow-hidden"
              style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid #383838" }}>
                <span className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>
                  CLASSEMENT
                </span>
                {myLbPos > 0 && (
                  <span className="font-game text-[10px]" style={{ color: "#FF5500" }}>
                    #{myLbPos}
                  </span>
                )}
              </div>

              {lbSorted.slice(0, 5).map((entry, idx) => {
                const isSelf = entry.email === myEmail || entry.name === state.playerName;
                const entryRankColor = getRank(entry.totalBookings).color;
                return (
                  <div
                    key={entry.email || entry.name}
                    className="flex items-center gap-2 px-3 py-2"
                    style={{
                      borderBottom: idx < Math.min(lbSorted.length, 5) - 1 ? "1px solid #2D2D2D" : "none",
                      background: isSelf ? "rgba(255,85,0,0.06)" : "transparent",
                    }}
                  >
                    <span className="font-game text-xs w-5 text-center flex-shrink-0" style={{ color: idx < 3 ? "#FF5500" : "#686868" }}>
                      {idx < 3 ? MEDAL[idx] : `#${idx + 1}`}
                    </span>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-game text-[9px] flex-shrink-0"
                      style={{ background: `${entryRankColor}18`, border: `1.5px solid ${entryRankColor}`, color: entryRankColor }}
                    >
                      {getInitials(entry.name)}
                    </div>
                    <span
                      className="font-game text-[10px] truncate flex-1"
                      style={{ color: isSelf ? "#FF5500" : "#C0C0C0" }}
                    >
                      {entry.name.split(" ")[0]}
                    </span>
                    <span className="font-game text-[10px] flex-shrink-0" style={{ color: "#1CE400" }}>
                      {entry.totalBookings} RDV
                    </span>
                  </div>
                );
              })}

              {/* Show self if outside top 5 */}
              {myLbPos > 5 && localEntry === null && (() => {
                const selfEntry = lbSorted[myLbPos - 1];
                return selfEntry ? (
                  <>
                    <div className="px-3 py-1 text-center font-game text-[9px]" style={{ color: "#484848", borderTop: "1px solid #2D2D2D" }}>
                      ···
                    </div>
                    <div
                      className="flex items-center gap-2 px-3 py-2"
                      style={{ background: "rgba(255,85,0,0.06)" }}
                    >
                      <span className="font-game text-xs w-5 text-center flex-shrink-0" style={{ color: "#848484" }}>
                        #{myLbPos}
                      </span>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-game text-[9px] flex-shrink-0"
                        style={{ background: `${getRank(selfEntry.totalBookings).color}18`, border: `1.5px solid ${getRank(selfEntry.totalBookings).color}`, color: getRank(selfEntry.totalBookings).color }}
                      >
                        {getInitials(selfEntry.name)}
                      </div>
                      <span className="font-game text-[10px] truncate flex-1" style={{ color: "#FF5500" }}>
                        {selfEntry.name.split(" ")[0]}
                      </span>
                      <span className="font-game text-[10px] flex-shrink-0" style={{ color: "#1CE400" }}>
                        {selfEntry.totalBookings} RDV
                      </span>
                    </div>
                  </>
                ) : null;
              })()}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
