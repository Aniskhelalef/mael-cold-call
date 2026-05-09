"use client";

import { useGame } from "@/lib/gameContext";
import { getRank, getNextRank, RANKS, RANK_MONEY_REWARDS } from "@/lib/gameData";

const RANK_IMG: Record<string, number> = {
  "Silver I":                       1,
  "Silver II":                      2,
  "Silver III":                     3,
  "Silver IV":                      4,
  "Silver Elite":                   5,
  "Silver Elite Master":            6,
  "Gold Nova I":                    7,
  "Gold Nova II":                   8,
  "Gold Nova III":                  9,
  "Gold Nova Master":              10,
  "Master Guardian I":             11,
  "Master Guardian II":            12,
  "Master Guardian Elite":         13,
  "Distinguished Master Guardian": 14,
  "Global Elite":                  18,
};

function imgUrl(name: string) {
  return `https://static.csgostats.gg/images/ranks/${RANK_IMG[name] ?? 1}.png`;
}

const GROUP_LABEL: Record<string, string> = {
  silver:   "SILVER",
  gold:     "GOLD NOVA",
  guardian: "MASTER GUARDIAN",
  global:   "GLOBAL ELITE",
};

export default function RankTab() {
  const { state } = useGame();
  const rank     = getRank(state.totalBookings);
  const nextRank = getNextRank(state.totalBookings);
  const rankPct  = nextRank
    ? Math.round(((state.totalBookings - rank.minBookings) / (nextRank.minBookings - rank.minBookings)) * 100)
    : 100;

  let lastGroup = "";

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* ── Current rank hero ─────────────────────────────────────────────── */}
      <div
        className="rounded-sm p-5 relative overflow-hidden"
        style={{ background: "#232323", border: `2px solid ${rank.color}60` }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 75% 50%, ${rank.color}18 0%, transparent 65%)` }}
        />
        <div className="relative flex items-center gap-5">
          <img
            src={imgUrl(rank.name)}
            alt={rank.name}
            width={88}
            height={88}
            style={{ filter: `drop-shadow(0 0 14px ${rank.color}70)` }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-game text-[10px] tracking-widest mb-1" style={{ color: "#848484" }}>
              TON RANG ACTUEL
            </div>
            <div className="font-game text-2xl leading-none" style={{ color: rank.color }}>
              {rank.name}
            </div>
            <div style={{ color: "#848484", fontSize: "0.72rem", marginTop: "4px" }}>
              {state.totalBookings} RDV au total
            </div>

            {RANK_MONEY_REWARDS[rank.name] !== undefined && (
              <div
                className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-sm"
                style={{ background: "rgba(28,228,0,0.08)", border: "1px solid rgba(28,228,0,0.2)" }}
              >
                <span style={{ fontSize: "0.7rem" }}>💰</span>
                <span className="font-game text-[10px]" style={{ color: "#1CE400" }}>
                  {RANK_MONEY_REWARDS[rank.name]}€ débloqués
                </span>
              </div>
            )}

            {nextRank ? (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1.5" style={{ fontSize: "0.65rem" }}>
                  <span style={{ color: "#848484" }}>
                    Prochain :{" "}
                    <span className="font-game" style={{ color: nextRank.color }}>
                      {nextRank.name}
                    </span>
                    {RANK_MONEY_REWARDS[nextRank.name] !== undefined && (
                      <span style={{ color: "#FF9500", marginLeft: 6 }}>
                        +{RANK_MONEY_REWARDS[nextRank.name]}€
                      </span>
                    )}
                    {nextRank.group === "global" && (
                      <span style={{ color: "#FFD700", marginLeft: 6 }}>🎁 MacBook Pro</span>
                    )}
                  </span>
                  <span className="font-game" style={{ color: rank.color }}>{rankPct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#383838" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${rankPct}%`,
                      background: rank.color,
                      boxShadow: `0 0 6px ${rank.color}70`,
                    }}
                  />
                </div>
                <div style={{ color: "#686868", fontSize: "0.62rem", marginTop: "4px" }}>
                  {nextRank.minBookings - state.totalBookings} RDV manquants
                </div>
              </div>
            ) : (
              <div
                className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-sm"
                style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.3)" }}
              >
                <span>🏆</span>
                <span className="font-game text-xs" style={{ color: "#FFD700" }}>RANG MAX — MacBook Pro débloqué</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Full rank ladder ──────────────────────────────────────────────── */}
      <div className="rounded-sm overflow-hidden" style={{ background: "#232323", border: "1px solid #383838" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #383838" }}>
          <div className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>
            TOUS LES RANGS
          </div>
        </div>

        <div>
          {RANKS.map((r, i) => {
            const isCurrent  = r.name === rank.name;
            const isUnlocked = state.totalBookings >= r.minBookings;
            const reward     = RANK_MONEY_REWARDS[r.name];
            const showHeader = r.group !== lastGroup;
            if (showHeader) lastGroup = r.group;

            return (
              <div key={r.name}>
                {showHeader && (
                  <div
                    className="px-4 py-2 font-game text-[9px] tracking-widest"
                    style={{
                      color: r.color,
                      background: `${r.color}08`,
                      borderTop: i > 0 ? "1px solid #2D2D2D" : "none",
                      borderBottom: "1px solid #2D2D2D",
                    }}
                  >
                    {GROUP_LABEL[r.group]}
                  </div>
                )}

                <div
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={{
                    background:   isCurrent ? `${r.color}10` : "transparent",
                    borderLeft:   isCurrent ? `3px solid ${r.color}` : "3px solid transparent",
                    borderBottom: "1px solid #2A2A2A",
                    opacity:      isUnlocked ? 1 : 0.45,
                  }}
                >
                  {/* Rank number */}
                  <div
                    className="font-game text-[10px] w-4 text-right flex-shrink-0"
                    style={{ color: "#686868" }}
                  >
                    {i + 1}
                  </div>

                  {/* CS2 rank image */}
                  <img
                    src={imgUrl(r.name)}
                    alt={r.name}
                    width={44}
                    height={44}
                    className="flex-shrink-0"
                    style={{
                      filter: isUnlocked
                        ? isCurrent
                          ? `drop-shadow(0 0 8px ${r.color}90)`
                          : "none"
                        : "grayscale(1) brightness(0.35)",
                    }}
                  />

                  {/* Name + requirement */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-game text-xs truncate"
                        style={{ color: isUnlocked ? r.color : "#686868" }}
                      >
                        {r.name}
                      </span>
                      {isCurrent && (
                        <span
                          className="rounded px-1.5 py-0.5 font-game text-[9px] flex-shrink-0"
                          style={{ background: `${r.color}25`, color: r.color }}
                        >
                          ACTUEL
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#686868", fontSize: "0.58rem", marginTop: "1px" }}>
                      {r.minBookings} RDV requis
                    </div>
                  </div>

                  {/* Reward */}
                  {r.group === "global" ? (
                    <span style={{ color: isUnlocked ? "#FFD700" : "#686868", fontSize: "0.72rem", flexShrink: 0 }}>
                      🎁 MacBook
                    </span>
                  ) : reward !== undefined ? (
                    <span
                      className="font-game text-xs flex-shrink-0"
                      style={{ color: isUnlocked ? "#1CE400" : "#686868" }}
                    >
                      +{reward}€
                    </span>
                  ) : null}

                  {/* Unlock check */}
                  <span
                    className="flex-shrink-0 font-game text-xs"
                    style={{ color: isUnlocked ? "#1CE400" : "#383838", marginLeft: "4px" }}
                  >
                    {isUnlocked ? "✓" : "○"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
