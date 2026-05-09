"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/lib/gameContext";
import SetupScreen from "./SetupScreen";
import Header from "./Header";
import HomeTab from "./HomeTab";
import StatsTab from "./StatsTab";
import ScriptTab from "./ScriptTab";
import LeaderboardTab from "./LeaderboardTab";
import LeadsTab from "./LeadsTab";
import ScraperTab from "./ScraperTab";

export default function GameApp() {
  const { state } = useGame();
  const [activeTab, setActiveTab] = useState("home");
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  if (!state.playerName) {
    return <SetupScreen />;
  }

  return (
    <div className="min-h-screen bg-game-bg">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 py-5 pb-24">
        {activeTab === "home"         && <HomeTab onNavigate={setActiveTab} />}
        {activeTab === "leads"        && <LeadsTab />}
        {activeTab === "scraper"      && <ScraperTab />}
        {activeTab === "leaderboard"  && <LeaderboardTab />}
        {activeTab === "stats"        && <StatsTab />}
        {activeTab === "script"       && <ScriptTab />}
      </main>

    </div>
  );
}
