"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/gameContext";
import { getRank, getNextRank, RANK_MONEY_REWARDS } from "@/lib/gameData";
import { fetchAllStates } from "@/lib/supabase";

// ── Custom confirm modal ──────────────────────────────────────────────────────

function ConfirmModal({ title, body, confirmLabel = "CONFIRMER", danger = false, onConfirm, onCancel }: {
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(3px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-sm p-5 space-y-4"
        style={{ background: "#232323", border: "1px solid #383838", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="font-game text-sm tracking-wider text-white mb-1">{title}</div>
          <div style={{ color: "#848484", fontSize: "0.8rem", lineHeight: 1.5 }}>{body}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-sm font-game text-xs tracking-wider transition-all active:scale-95"
            style={{ background: "transparent", border: "1px solid #383838", color: "#848484" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#686868"; e.currentTarget.style.color = "#C0C0C0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#383838"; e.currentTarget.style.color = "#848484"; }}
          >
            ANNULER
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-sm font-game text-xs tracking-wider transition-all active:scale-95"
            style={{
              background: danger ? "rgba(239,68,68,0.15)" : "rgba(255,85,0,0.15)",
              border: `1px solid ${danger ? "rgba(239,68,68,0.5)" : "rgba(255,85,0,0.5)"}`,
              color: danger ? "#ef4444" : "#FF5500",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "rgba(239,68,68,0.25)" : "rgba(255,85,0,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = danger ? "rgba(239,68,68,0.15)" : "rgba(255,85,0,0.15)"; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const CARD_BG = "#232323";
const BORDER  = "#383838";

export default function HomeTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { state } = useGame();

  const rank     = getRank(state.totalBookings);
  const nextRank = getNextRank(state.totalBookings);

  // Progressive daily goal: starts at 20, +10 each week, capped at 80
  const dailyGoal = (() => {
    const firstDay = state.history[0]?.date ?? new Date().toISOString().split("T")[0];
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksSince = Math.floor((Date.now() - new Date(firstDay + "T00:00:00").getTime()) / msPerWeek);
    return Math.min(80, 20 + weeksSince * 10);
  })();
  const dailyCallsYes = state.dailyCallsYes ?? 0;
  const goalPct = Math.min(100, Math.round((dailyCallsYes / dailyGoal) * 100));
  const goalMet = dailyCallsYes >= dailyGoal;

  const weeklyBookingGoal = 10;
  const weeklyBookings    = state.totalBookings - state.weeklyBookingsAtStart;
  const weeklyGoalPct     = Math.min(100, Math.round((weeklyBookings / weeklyBookingGoal) * 100));
  const weeklyGoalMet     = weeklyBookings >= weeklyBookingGoal;

  const RANK_IMG: Record<string, number> = {
    "Silver I": 1, "Silver II": 2, "Silver III": 3, "Silver IV": 4,
    "Silver Elite": 5, "Silver Elite Master": 6,
    "Gold Nova I": 7, "Gold Nova II": 8, "Gold Nova III": 9, "Gold Nova Master": 10,
    "Master Guardian I": 11, "Master Guardian II": 12, "Master Guardian Elite": 13,
    "Distinguished Master Guardian": 14, "Global Elite": 18,
  };
  const rankImgUrl = `https://static.csgostats.gg/images/ranks/${RANK_IMG[rank.name] ?? 1}.png`;

  const rankPct = nextRank
    ? Math.round(((state.totalBookings - rank.minBookings) / (nextRank.minBookings - rank.minBookings)) * 100)
    : 100;

  const nextRankReward = nextRank ? RANK_MONEY_REWARDS[nextRank.name] : null;

  const totalCallsYes = state.totalCallsYes ?? 0;
  const tauxReponse    = state.totalCalls > 0 ? Math.round((totalCallsYes / state.totalCalls) * 100) : 0;
  const tauxConversion = state.totalCalls > 0 ? Math.round((state.totalBookings / state.totalCalls) * 100) : 0;

  type ActivityEntry = { userName: string; prospectName: string | null; type: "call" | "booking"; syncedAt: string; };

  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [logOpen,     setLogOpen]     = useState(false);

  useEffect(() => {
    fetchAllStates().then((all) => {
      const entries: ActivityEntry[] = all
        .filter((r) => r.state.totalCalls > 0)
        .map((r) => {
          const lastProspect = [...(r.state.prospects ?? [])]
            .filter((p) => p.premierContact)
            .sort((a, b) => (b.premierContact ?? "").localeCompare(a.premierContact ?? ""))[0];
          return {
            userName:     r.state.playerName,
            prospectName: lastProspect?.name ?? r.state.lastCalledProspectName ?? null,
            type:         ((r.state.totalBookings ?? 0) > 0 ? "booking" : "call") as "call" | "booking",
            syncedAt:     r.syncedAt,
          };
        })
        .sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime());
      setActivityLog(entries);
    }).catch(() => {});
  }, []);

  function relativeTime(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)   return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)}j`;
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Activity log banner ────────────────────────────────────────────── */}
      {activityLog.length > 0 && (() => {
        const top = activityLog[0];
        return (
          <div className="rounded-sm mb-3" style={{ background: "#1a1a1a", border: "1px solid #2e2e2e" }}>
            {/* Top row */}
            <button
              className="w-full flex items-center gap-2 px-3 py-2 font-game text-[10px] tracking-widest text-left"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#848484" }}
              onClick={() => setLogOpen((o) => !o)}
            >
              <span style={{ fontSize: "0.75rem" }}>{top.type === "booking" ? "🎯" : "📞"}</span>
              <span>DERNIER {top.type === "booking" ? "BOOKING" : "CALL"}</span>
              <span style={{ color: "#FF5500" }}>{top.userName.toUpperCase()}</span>
              {top.prospectName && (
                <>
                  <span style={{ color: "#484848" }}>→</span>
                  <span style={{ color: "#C0C0C0" }}>{top.prospectName}</span>
                </>
              )}
              <span style={{ color: "#484848" }}>·</span>
              <span>{relativeTime(top.syncedAt)}</span>
              <span className="ml-auto" style={{ color: "#484848", fontSize: "0.7rem" }}>
                {logOpen ? "▲" : "▼"}
              </span>
            </button>

            {/* Expandable log */}
            {logOpen && (
              <div
                className="overflow-y-auto"
                style={{ maxHeight: "180px", borderTop: "1px solid #2e2e2e" }}
              >
                {activityLog.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 font-game text-[9px] tracking-widest"
                    style={{ borderBottom: i < activityLog.length - 1 ? "1px solid #222" : "none", color: "#686868" }}
                  >
                    <span style={{ fontSize: "0.7rem" }}>{entry.type === "booking" ? "🎯" : "📞"}</span>
                    <span style={{ color: "#C0C0C0", minWidth: 60 }}>{entry.userName}</span>
                    {entry.prospectName && (
                      <>
                        <span style={{ color: "#383838" }}>→</span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.prospectName}
                        </span>
                      </>
                    )}
                    <span className="ml-auto flex-shrink-0">{relativeTime(entry.syncedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      <div className="lg:grid lg:gap-4" style={{ gridTemplateColumns: "1fr 260px" } as React.CSSProperties}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="space-y-3">

          {/* ── KPI row ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              { label: "Passés",      value: state.dailyCalls,                                                sub: `Total: ${state.totalCalls}`,                                                        color: "#FF5500", icon: "📞" },
              { label: "Répondus",    value: state.dailyCallsYes ?? 0,                                        sub: `Total: ${state.totalCallsYes ?? 0}`,                                                color: "#5DC7E5", icon: "👍" },
              { label: "Bookés",      value: state.dailyBookings,                                             sub: `Total: ${state.totalBookings}`,                                                     color: "#1CE400", icon: "🎯" },
              { label: "Non bookés",  value: Math.max(0, (state.dailyCallsYes ?? 0) - state.dailyBookings),   sub: `Total: ${Math.max(0, (state.totalCallsYes ?? 0) - state.totalBookings)}`,             color: "#f97316", icon: "❌" },
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

          {/* ── Daily goal + recharge ───────────────────────────────────── */}
          <div className="flex gap-3 items-stretch">
            {/* Objectif */}
            <div
              className="flex-1 rounded-sm px-4 py-3"
              style={{
                background: CARD_BG,
                border: `1px solid ${goalMet ? "rgba(28,228,0,0.4)" : BORDER}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>
                    OBJECTIF JOURNALIER
                  </span>
                  {dailyGoal < 80 && (
                    <span className="font-game text-[9px] ml-2" style={{ color: "#484848" }}>
                      → {dailyGoal + 10} sem. prochaine
                    </span>
                  )}
                </div>
                <span className="font-game text-xs" style={{ color: goalMet ? "#1CE400" : "#C0C0C0" }}>
                  {goalMet ? "✅ OBJECTIF ATTEINT" : `${dailyCallsYes} / ${dailyGoal} RÉPONDUS`}
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

              {/* Weekly booking goal */}
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid #2A2A2A" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>
                    OBJECTIF HEBDO — RDV
                  </span>
                  <span className="font-game text-xs" style={{ color: weeklyGoalMet ? "#1CE400" : "#C0C0C0" }}>
                    {weeklyGoalMet ? "✅ OBJECTIF ATTEINT" : `${weeklyBookings} / ${weeklyBookingGoal} RDV`}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#383838" }}>
                  <div
                    className="h-full rounded-full progress-bar"
                    style={{
                      width: `${weeklyGoalPct}%`,
                      background: weeklyGoalMet
                        ? "linear-gradient(90deg,#15803d,#22c55e)"
                        : "linear-gradient(90deg,#0e7490,#5DC7E5)",
                      boxShadow: weeklyGoalMet
                        ? "0 0 6px rgba(34,197,94,0.5)"
                        : "0 0 6px rgba(93,199,229,0.4)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recharger */}
            {onNavigate && (
              <button
                onClick={() => onNavigate("leads:scraper")}
                className="rounded-sm font-game text-xs tracking-wider transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5"
                style={{
                  background: CARD_BG, border: `1px solid ${BORDER}`,
                  color: "#848484", width: "90px", flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF5500"; e.currentTarget.style.color = "#FF5500"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#848484"; }}
              >
                <span style={{ fontSize: "1.4rem" }}>🔫</span>
                <span>RECHARGER</span>
              </button>
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
                <img
                  src={rankImgUrl}
                  alt={rank.name}
                  width={52}
                  height={52}
                  className="flex-shrink-0"
                  style={{ filter: `drop-shadow(0 0 10px ${rank.color}70)` }}
                />
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


        </div>

      </div>

    </div>
  );
}
