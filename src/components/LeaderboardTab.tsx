"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/gameContext";
import { fetchLeaderboard, LeaderboardEntry, isSupabaseConfigured } from "@/lib/supabase";
import { getLevel } from "@/lib/gameData";

function getLevelColor(lv: number): string {
  if (lv <= 3)  return "#1CE400";
  if (lv <= 6)  return "#5DC7E5";
  if (lv <= 9)  return "#AE00FC";
  return "#FF5500";
}

function getInitials(name: string): string {
  return name.split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1)  return "à l'instant";
  if (diff < 60) return `il y a ${diff}min`;
  const h = Math.floor(diff / 60);
  if (h < 24)    return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)     return `il y a ${d}j`;
  return `il y a ${Math.floor(d / 7)}sem`;
}

const MEDAL = ["🥇", "🥈", "🥉"];
const CARD_BG = "#1C1C1C";
const BORDER  = "#2A2A2A";

export default function LeaderboardTab() {
  const { state } = useGame();
  const [entries,   setEntries]   = useState<LeaderboardEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [sortBy,    setSortBy]    = useState<"xp" | "rdv" | "calls" | "streak">("xp");
  const [refreshed, setRefreshed] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchLeaderboard()
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger le classement.");
        setLoading(false);
      });
  }, [refreshed]);

  const sorted = [...entries].sort((a, b) => {
    switch (sortBy) {
      case "rdv":    return b.totalBookings - a.totalBookings;
      case "calls":  return b.totalCalls    - a.totalCalls;
      case "streak": return b.currentStreak - a.currentStreak;
      default:       return b.totalXP       - a.totalXP;
    }
  });

  const myEmail = state.playerEmail;

  // Compute local-only entry from state if not yet in Supabase
  const myOnLeaderboard = entries.some(
    (e) => e.email === myEmail || e.name === state.playerName
  );
  const localEntry: LeaderboardEntry | null =
    !myOnLeaderboard && state.playerName
      ? {
          email:         myEmail,
          name:          state.playerName,
          totalXP:       state.totalXP,
          totalCalls:    state.totalCalls,
          totalBookings: state.totalBookings,
          currentStreak: state.currentStreak,
          totalSales:    state.totalSales,
          updatedAt:     new Date().toISOString(),
        }
      : null;

  const displayList = localEntry
    ? [...sorted, localEntry].sort((a, b) => {
        switch (sortBy) {
          case "rdv":    return b.totalBookings - a.totalBookings;
          case "calls":  return b.totalCalls    - a.totalCalls;
          case "streak": return b.currentStreak - a.currentStreak;
          default:       return b.totalXP       - a.totalXP;
        }
      })
    : sorted;

  const myRank = displayList.findIndex(
    (e) => e.email === myEmail || e.name === state.playerName
  ) + 1;

  const SORT_TABS: { key: typeof sortBy; label: string }[] = [
    { key: "xp",     label: "XP / ELO"  },
    { key: "rdv",    label: "RDV"        },
    { key: "calls",  label: "Calls"      },
    { key: "streak", label: "Streak"     },
  ];

  return (
    <div className="space-y-3 max-w-3xl mx-auto">

      {/* ── Header card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-sm p-4 flex items-center justify-between"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <div>
          <h2 className="font-game text-lg text-white">CLASSEMENT</h2>
          <p style={{ color: "#5A5A5A", fontSize: "0.75rem" }}>
            {loading ? "Chargement…" : `${displayList.length} joueur${displayList.length > 1 ? "s" : ""}`}
            {myRank > 0 && (
              <span style={{ color: "#FF5500" }}> · Ta position: #{myRank}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isSupabaseConfigured && (
            <span
              className="font-game text-[10px] px-2 py-1 rounded-sm"
              style={{ background: "rgba(255,85,0,0.1)", border: "1px solid rgba(255,85,0,0.3)", color: "#FF5500" }}
            >
              OFFLINE
            </span>
          )}
          <button
            onClick={() => setRefreshed((n) => n + 1)}
            disabled={loading}
            className="px-3 py-1.5 rounded-sm font-game text-xs tracking-wider transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "#242424", border: "1px solid #383838", color: "#9A9A9A" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF5500"; e.currentTarget.style.color = "#FF5500"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#383838"; e.currentTarget.style.color = "#9A9A9A"; }}
          >
            {loading ? "…" : "⟳ REFRESH"}
          </button>
        </div>
      </div>

      {/* ── Sort tabs ────────────────────────────────────────────────────── */}
      <div className="flex gap-1">
        {SORT_TABS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            className="px-3 py-1.5 rounded-sm font-game text-[10px] tracking-wider transition-all duration-100"
            style={{
              background:   sortBy === s.key ? "#FF5500" : "#1C1C1C",
              border:       `1px solid ${sortBy === s.key ? "#FF5500" : "#2A2A2A"}`,
              color:        sortBy === s.key ? "#FFF" : "#9A9A9A",
            }}
          >
            {s.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div
          className="rounded-sm px-4 py-3 font-game text-xs"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
        >
          {error}
        </div>
      )}

      {/* ── No Supabase notice ───────────────────────────────────────────── */}
      {!isSupabaseConfigured && displayList.length <= 1 && (
        <div
          className="rounded-sm p-4 text-center"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🏆</div>
          <div className="font-game text-sm text-white mb-1">Classement multi-joueurs</div>
          <div style={{ color: "#5A5A5A", fontSize: "0.75rem", maxWidth: "320px", margin: "0 auto" }}>
            Configure Supabase pour voir les autres joueurs. Pour l&apos;instant tu es seul en haut du tableau.
          </div>
        </div>
      )}

      {/* ── Top 3 podium ─────────────────────────────────────────────────── */}
      {displayList.length >= 2 && (
        <div className="grid grid-cols-3 gap-2">
          {[1, 0, 2].map((pos, col) => {
            const entry = displayList[pos];
            if (!entry) return <div key={col} />;
            const lv = getLevel(entry.totalXP);
            const lvColor = getLevelColor(lv.level);
            const isSelf = entry.email === myEmail || entry.name === state.playerName;
            const heights = ["h-24", "h-32", "h-20"];
            return (
              <div
                key={pos}
                className={`rounded-sm flex flex-col items-center justify-end ${heights[col]} pb-3 relative overflow-hidden`}
                style={{
                  background: isSelf
                    ? "rgba(255,85,0,0.1)"
                    : pos === 0 ? "rgba(255,215,0,0.06)" : "#1C1C1C",
                  border: `1px solid ${isSelf ? "rgba(255,85,0,0.4)" : pos === 0 ? "rgba(255,215,0,0.25)" : "#2A2A2A"}`,
                }}
              >
                {/* Medal */}
                <div className="absolute top-2 left-0 right-0 text-center" style={{ fontSize: col === 1 ? "1.4rem" : "1.1rem" }}>
                  {MEDAL[pos]}
                </div>
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-game text-sm mb-1"
                  style={{ background: `${lvColor}22`, border: `2px solid ${lvColor}`, color: lvColor }}
                >
                  {getInitials(entry.name)}
                </div>
                {/* Name */}
                <div
                  className="font-game text-[10px] tracking-wide text-center px-1 truncate w-full"
                  style={{ color: isSelf ? "#FF5500" : "#FFFFFF" }}
                >
                  {entry.name.split(" ")[0].toUpperCase()}
                </div>
                {/* XP */}
                <div className="font-game text-[9px] mt-0.5" style={{ color: "#5A5A5A" }}>
                  {sortBy === "xp"     ? `${entry.totalXP.toLocaleString()} XP` :
                   sortBy === "rdv"    ? `${entry.totalBookings} RDV` :
                   sortBy === "calls"  ? `${entry.totalCalls} calls` :
                   `${entry.currentStreak}j`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Full table ───────────────────────────────────────────────────── */}
      <div
        className="rounded-sm overflow-hidden"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        {/* Column headers */}
        <div
          className="grid px-4 py-2"
          style={{
            gridTemplateColumns: "36px 1fr 56px 80px 60px 50px",
            borderBottom: "1px solid #2A2A2A",
            gap: "8px",
          }}
        >
          {["#", "JOUEUR", "NIVEAU", sortBy === "xp" ? "XP" : sortBy === "rdv" ? "RDV" : sortBy === "calls" ? "CALLS" : "STREAK", "RDV", "CALLS"].map((h, i) => (
            <div key={i} className="font-game text-[10px] tracking-widest" style={{ color: "#5A5A5A", textAlign: i > 2 ? "right" : "left" }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="py-12 text-center font-game text-xs" style={{ color: "#5A5A5A" }}>
            CHARGEMENT…
          </div>
        ) : displayList.length === 0 ? (
          <div className="py-12 text-center font-game text-xs" style={{ color: "#5A5A5A" }}>
            AUCUN JOUEUR
          </div>
        ) : (
          displayList.map((entry, idx) => {
            const isSelf = entry.email === myEmail || entry.name === state.playerName;
            const lv = getLevel(entry.totalXP);
            const lvColor = getLevelColor(lv.level);
            const rank = idx + 1;
            const mainStat =
              sortBy === "xp"     ? entry.totalXP.toLocaleString() :
              sortBy === "rdv"    ? entry.totalBookings :
              sortBy === "calls"  ? entry.totalCalls :
              `${entry.currentStreak}j`;

            return (
              <div
                key={entry.email || entry.name}
                className={`lb-row grid px-4 py-3 items-center ${isSelf ? "lb-row-self" : ""}`}
                style={{
                  gridTemplateColumns: "36px 1fr 56px 80px 60px 50px",
                  gap: "8px",
                  borderBottom: "1px solid #242424",
                }}
              >
                {/* Rank */}
                <div className="font-game text-sm" style={{ color: rank <= 3 ? "#FF5500" : "#5A5A5A" }}>
                  {rank <= 3 ? MEDAL[rank - 1] : `#${rank}`}
                </div>

                {/* Player */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-game text-[10px]"
                    style={{ background: `${lvColor}18`, border: `1.5px solid ${lvColor}`, color: lvColor }}
                  >
                    {getInitials(entry.name)}
                  </div>
                  <div className="min-w-0">
                    <div
                      className="font-game text-xs truncate"
                      style={{ color: isSelf ? "#FF5500" : "#FFFFFF" }}
                    >
                      {entry.name}
                      {isSelf && (
                        <span className="ml-1.5 font-game text-[9px] px-1.5 py-0.5 rounded-sm"
                          style={{ background: "rgba(255,85,0,0.15)", color: "#FF5500" }}>
                          TOI
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#5A5A5A", fontSize: "0.6rem" }}>{timeAgo(entry.updatedAt)}</div>
                  </div>
                </div>

                {/* Level badge */}
                <div>
                  <span
                    className="fi-level-badge"
                    style={{ background: lvColor, color: "#000" }}
                  >
                    {lv.level}
                  </span>
                </div>

                {/* Main stat */}
                <div className="font-game text-xs text-right" style={{ color: "#FFFFFF" }}>
                  {mainStat}
                </div>

                {/* RDV */}
                <div className="font-game text-xs text-right" style={{ color: "#1CE400" }}>
                  {entry.totalBookings}
                </div>

                {/* Calls */}
                <div className="font-game text-xs text-right" style={{ color: "#9A9A9A" }}>
                  {entry.totalCalls}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <p className="text-center" style={{ color: "#3A3A3A", fontSize: "0.65rem" }}>
        Classement mis à jour en temps réel depuis Supabase · Tri par {sortBy === "xp" ? "XP total" : sortBy === "rdv" ? "RDV" : sortBy === "calls" ? "Calls" : "Streak"}
      </p>
    </div>
  );
}
