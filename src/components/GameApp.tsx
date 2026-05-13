"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/lib/gameContext";
import SetupScreen from "./SetupScreen";
import Header from "./Header";
import HomeTab from "./HomeTab";
import StatsTab from "./StatsTab";
import RankTab from "./RankTab";
import ScriptTab from "./ScriptTab";
import LeaderboardTab from "./LeaderboardTab";
import LeadsTab from "./LeadsTab";
import CoachingTab from "./CoachingTab";
import FloatingCallWidget from "./FloatingCallWidget";

export default function GameApp() {
  const { state } = useGame();
  const [activeTab,    setActiveTab]    = useState("home");
  const [leadsSubTab,  setLeadsSubTab]  = useState<"pipeline" | "scraper">("pipeline");
  const [mounted,      setMounted]      = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  if (!state.playerName) {
    return <SetupScreen />;
  }

  function handleNavigate(target: string) {
    if (target === "leads:scraper") {
      setLeadsSubTab("scraper");
      setActiveTab("leads");
    } else {
      setLeadsSubTab("pipeline");
      setActiveTab(target);
    }
  }

  return (
    <div className="min-h-screen bg-game-bg">
      <Header activeTab={activeTab} setActiveTab={(t) => handleNavigate(t)} />

      <FloatingCallWidget onNavigate={handleNavigate} />

      <main className="max-w-6xl mx-auto px-4 py-5 pb-24">
        {activeTab === "home"         && <HomeTab onNavigate={handleNavigate} />}
        {activeTab === "leads"        && <LeadsTab defaultSub={leadsSubTab} />}
        {activeTab === "coaching"     && <CoachingTab />}
        {activeTab === "leaderboard"  && <LeaderboardTab />}
        {activeTab === "rank"         && <RankTab />}
        {activeTab === "stats"        && <StatsTab />}
        {activeTab === "script"       && <ScriptTab />}
      </main>

    </div>
  );
}
