"use client";

import { GameProvider } from "@/lib/gameContext";
import GameApp from "@/components/GameApp";

export default function Home() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  );
}
