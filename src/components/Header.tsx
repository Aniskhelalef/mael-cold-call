"use client";

import { useGame } from "@/lib/gameContext";
import { getLevel, getNextLevel, getLevelProgress, getRank } from "@/lib/gameData";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: "home", label: "Accueil", icon: "🏠" },
  { id: "achievements", label: "Hauts Faits", icon: "🏆" },
  { id: "missions", label: "Missions", icon: "⚔️" },
  { id: "stats", label: "Stats", icon: "📊" },
  { id: "script", label: "Script", icon: "📋" },
];

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { state, dispatch } = useGame();

  const handleLogout = () => {
    if (window.confirm("Se déconnecter ? Ta progression reste sauvegardée dans le cloud.")) {
      dispatch({ type: "LOGOUT" });
    }
  };
  const level = getLevel(state.totalXP);
  const nextLevel = getNextLevel(state.totalXP);
  const progress = getLevelProgress(state.totalXP);
  const rank = getRank(state.totalBookings);

  const rankColorClass =
    rank.group === "global" ? "rank-global" :
    rank.group === "supreme" ? "rank-supreme" :
    rank.group === "eagle" ? "rank-eagle" :
    rank.group === "guardian" ? "rank-guardian" :
    rank.group === "gold" ? "rank-gold" : "";

  return (
    <header className="sticky top-0 z-40 border-b border-game-border"
      style={{ background: "rgba(10,10,18,0.95)", backdropFilter: "blur(10px)" }}>

      {/* Top bar */}
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* Left: player info */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Level badge */}
            <div className="flex-shrink-0 w-11 h-11 rounded-lg border border-blue-500/40 flex items-center justify-center relative level-shimmer"
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)" }}>
              <span className="font-game text-blue-300 text-sm">{level.level}</span>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-game-bg border border-blue-500/60 flex items-center justify-center">
                <span className="text-[8px] text-blue-400">LV</span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-game text-white text-base truncate">{state.playerName}</span>
                <span className="font-game text-blue-400 text-xs hidden sm:block">{level.title}</span>
              </div>
              {/* XP bar */}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 sm:w-36 h-1.5 rounded-full bg-game-border overflow-hidden">
                  <div
                    className="xp-bar-fill h-full rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-gray-500 text-xs hidden sm:block">
                  {nextLevel ? `${state.totalXP}/${nextLevel.minXP} XP` : "MAX"}
                </span>
              </div>
            </div>
          </div>

          {/* Center: title on desktop */}
          <div className="hidden md:block text-center">
            <div className="font-game text-blue-400 text-xs tracking-widest">COLD CALL RPG</div>
          </div>

          {/* Right: money + streak + rank */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Money earned */}
            {state.totalMoneyEarned > 0 && (
              <div className="hidden sm:flex items-center gap-1 bg-game-card border border-green-500/30 rounded-lg px-3 py-1.5">
                <span className="text-sm">💶</span>
                <span className="font-game text-green-400 text-sm">{state.totalMoneyEarned}€</span>
              </div>
            )}

            {/* Streak */}
            <div className="hidden sm:flex items-center gap-1 bg-game-card border border-game-border rounded-lg px-3 py-1.5">
              <span className="text-sm">🔥</span>
              <span className="font-game text-orange-400 text-sm">{state.currentStreak}</span>
              <span className="text-gray-400 text-xs">j</span>
            </div>

            {/* Rank */}
            <div className="bg-game-card border border-game-border rounded-lg px-3 py-1.5">
              <div className={`font-game text-xs ${rankColorClass}`}
                style={{ color: rankColorClass ? undefined : rank.color }}>
                {rank.name}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
              style={{ background: "transparent", border: "1px solid #1f2937", color: "#374151" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1f2937"; e.currentTarget.style.color = "#374151"; }}
            >
              <span style={{ fontSize: "0.9rem" }}>🚪</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="max-w-4xl mx-auto">
        <nav className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center transition-colors duration-150 border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="text-sm sm:hidden">{tab.icon}</span>
              <span className="hidden sm:inline font-game text-xs tracking-wider">
                {tab.icon} {tab.label.toUpperCase()}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
