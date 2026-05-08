"use client";

import { useState } from "react";
import { useGame } from "@/lib/gameContext";
import SetupScreen from "./SetupScreen";
import Header from "./Header";
import HomeTab from "./HomeTab";
import AchievementsTab from "./AchievementsTab";
import MissionsTab from "./MissionsTab";
import StatsTab from "./StatsTab";
import ScriptTab from "./ScriptTab";
import PipelineTab from "./PipelineTab";
import LeaderboardTab from "./LeaderboardTab";
import AchievementToast from "./AchievementToast";

export default function GameApp() {
  const { state } = useGame();
  const [activeTab, setActiveTab] = useState("home");

  // Show setup screen if no player name
  if (!state.playerName) {
    return <SetupScreen />;
  }

  return (
    <div className="min-h-screen bg-game-bg">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 py-5 pb-24">
        {activeTab === "home"        && <HomeTab />}
        {activeTab === "leaderboard" && <LeaderboardTab />}
        {activeTab === "achievements" && <AchievementsTab />}
        {activeTab === "missions" && <MissionsTab />}
        {activeTab === "stats" && <StatsTab />}
        {activeTab === "script" && <ScriptTab />}
        {activeTab === "pipeline" && <PipelineTab />}
      </main>

      <AchievementToast />
    </div>
  );
}
