"use client";

import { useGame } from "@/lib/gameContext";
import { getRank, getNextRank } from "@/lib/gameData";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: "home",        label: "Dashboard"  },
  { id: "leads",       label: "Leads"      },
  { id: "scraper",     label: "Scraper"    },
  { id: "leaderboard", label: "Classement" },
  { id: "stats",       label: "Stats"      },
  { id: "script",      label: "Script"     },
];

const TAB_ICONS: Record<string, string> = {
  home:        "⚡",
  leads:       "👥",
  scraper:     "🔍",
  leaderboard: "🏆",
  stats:       "📊",
  script:      "📋",
};

function getInitials(name: string): string {
  return name.split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { state, dispatch } = useGame();

  const handleLogout = () => {
    if (window.confirm("Se déconnecter ? Ta progression reste sauvegardée dans le cloud.")) {
      dispatch({ type: "LOGOUT" });
    }
  };

  const handleResetStats = () => {
    if (window.confirm("Réinitialiser toutes les stats (calls, RDV, streaks…) ? Les prospects sont conservés. Cette action est irréversible.")) {
      dispatch({ type: "RESET_STATS" });
    }
  };

  const rank      = getRank(state.totalBookings);
  const nextRank  = getNextRank(state.totalBookings);
  const rankPct   = nextRank
    ? Math.round(((state.totalBookings - rank.minBookings) / (nextRank.minBookings - rank.minBookings)) * 100)
    : 100;
  const rankIcon  =
    rank.group === "global"   ? "👑" :
    rank.group === "guardian" ? "🛡" :
    rank.group === "gold"     ? "🏅" : "🥈";

  return (
    <header
      className="sticky top-0 z-40"
      style={{ background: "#181818", borderBottom: "1px solid #383838" }}
    >
      <div className="max-w-6xl mx-auto">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 h-14 gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className="font-game text-lg tracking-widest"
              style={{ color: "#FF5500" }}
            >
              CCOD
            </span>
            <div style={{ width: "1px", height: "18px", background: "#383838" }} className="hidden sm:block" />
            <span
              className="font-game text-xs tracking-widest hidden sm:block"
              style={{ color: "#848484" }}
            >
              Cold Call of Duty
            </span>
          </div>

          {/* Desktop tab nav */}
          <nav className="hidden lg:flex items-end gap-0 flex-1 justify-center self-stretch">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="font-game text-xs tracking-wider px-4 h-full transition-colors duration-150 relative"
                  style={{
                    color:      active ? "#FF5500" : "#C0C0C0",
                    background: "transparent",
                    borderBottom: active ? "2px solid #FF5500" : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#FFFFFF"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#C0C0C0"; }}
                >
                  {tab.label.toUpperCase()}
                </button>
              );
            })}
          </nav>

          {/* Right: player profile */}
          <div className="flex items-center gap-2.5 flex-shrink-0">

            {/* Streak */}
            {state.currentStreak > 0 && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded"
                style={{ background: "rgba(255,85,0,0.1)", border: "1px solid rgba(255,85,0,0.25)" }}
              >
                <span style={{ fontSize: "0.7rem" }}>🔥</span>
                <span className="font-game text-xs" style={{ color: "#FF5500" }}>
                  {state.currentStreak}J
                </span>
              </div>
            )}

            {/* Money earned */}
            {state.totalMoneyEarned > 0 && (
              <div
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded"
                style={{ background: "rgba(28,228,0,0.08)", border: "1px solid rgba(28,228,0,0.2)" }}
              >
                <span style={{ fontSize: "0.7rem" }}>💶</span>
                <span className="font-game text-xs" style={{ color: "#1CE400" }}>
                  {state.totalMoneyEarned}€
                </span>
              </div>
            )}

            {/* Divider */}
            <div style={{ width: "1px", height: "20px", background: "#383838" }} className="hidden sm:block" />

            {/* Avatar + name + rank */}
            <div className="flex items-center gap-2.5">
              {/* Avatar circle */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-game text-sm"
                  style={{
                    background: `${rank.color}20`,
                    border: `2px solid ${rank.color}`,
                    color:  rank.color,
                  }}
                >
                  {getInitials(state.playerName)}
                </div>
                {/* Rank badge */}
                <div
                  className="absolute -bottom-1 -right-1 fi-level-badge"
                  style={{ background: rank.color, color: "#000", fontSize: "0.6rem" }}
                >
                  {rankIcon}
                </div>
              </div>

              {/* Name + rank bar */}
              <div className="hidden md:block">
                <div className="font-game text-sm text-white leading-none truncate max-w-[130px]">
                  {state.playerName}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: "#383838" }}>
                    <div className="h-full rounded-full progress-bar" style={{ width: `${rankPct}%`, background: rank.color }} />
                  </div>
                  <span style={{ color: rank.color, fontSize: "0.58rem" }} className="font-game">
                    {nextRank ? `${nextRank.minBookings - state.totalBookings} RDV` : "MAX"}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="w-7 h-7 rounded flex items-center justify-center transition-colors duration-150"
              style={{ background: "transparent", border: "1px solid #383838", color: "#848484" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#FF5500";
                e.currentTarget.style.color = "#FF5500";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#383838";
                e.currentTarget.style.color = "#848484";
              }}
            >
              <span style={{ fontSize: "0.75rem" }}>🚪</span>
            </button>
          </div>
        </div>

        {/* ── Mobile / tablet tab strip ────────────────────────────────────── */}
        <nav
          className="lg:hidden flex overflow-x-auto"
          style={{ borderTop: "1px solid #383838" }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-shrink-0 px-3 py-2.5 font-game text-[10px] tracking-wider transition-colors duration-150"
                style={{
                  color:        active ? "#FF5500" : "#C0C0C0",
                  borderBottom: active ? "2px solid #FF5500" : "2px solid transparent",
                  background:   "transparent",
                }}
              >
                <span className="sm:hidden">{TAB_ICONS[tab.id]}</span>
                <span className="hidden sm:inline">{tab.label.toUpperCase()}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
