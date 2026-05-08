"use client";

import { useState } from "react";
import { useGame } from "@/lib/gameContext";

export default function SetupScreen() {
  const { dispatch } = useGame();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleStart = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Entre ton nom pour commencer !");
      return;
    }
    dispatch({ type: "SETUP_PLAYER", name: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleStart();
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0a12 0%, #0d0d1f 50%, #0a0a12 100%)" }}>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)",
            backgroundSize: "50px 50px"
          }}
        />
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-64 h-64 opacity-20"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-20"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 right-0 w-48 h-48 opacity-15"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          {/* CS:GO style logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-blue-500 mb-6 glow-blue"
            style={{ background: "radial-gradient(circle, #1e3a8a 0%, #0a0a12 100%)" }}>
            <span className="text-4xl">🎮</span>
          </div>

          <div className="font-game text-xs tracking-widest text-blue-400 mb-2">
            COLD CALL RPG — SAISON 1
          </div>

          <h1 className="font-game text-4xl md:text-5xl gradient-text mb-3">
            BIENVENUE DANS<br />COLD CALL RPG
          </h1>

          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Transforme chaque appel en victoire. Gagne de l'XP, monte en level, débloques des hauts faits.
          </p>
        </div>

        {/* Stat preview */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: "⚡", label: "XP & Niveaux", desc: "20 niveaux" },
            { icon: "🏆", label: "Hauts Faits", desc: "31 achievements" },
            { icon: "🎖️", label: "Rangs CS:GO", desc: "18 rangs" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-game-border p-3 text-center"
              style={{ background: "rgba(16,16,28,0.8)" }}>
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="font-game text-xs text-blue-400">{item.label}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Setup form */}
        <div className="rounded-xl border border-game-border-light p-6"
          style={{ background: "rgba(16,16,28,0.9)", backdropFilter: "blur(10px)" }}>

          <div className="font-game text-sm text-gray-400 mb-2 tracking-wider">
            IDENTIFIANT DU JOUEUR
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder="Entre ton nom..."
              maxLength={20}
              className="w-full bg-game-bg border border-game-border-light rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none transition-all"
              style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.1rem", letterSpacing: "0.05em" }}
              onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
              onBlur={(e) => e.target.style.borderColor = "#252540"}
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-xs mt-1">{error}</p>
            )}
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-lg font-game text-lg tracking-widest transition-all duration-200 active:scale-95 btn-pulse"
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
              color: "#fff",
              border: "1px solid #3b82f6",
              boxShadow: "0 0 20px rgba(59,130,246,0.4)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 30px rgba(59,130,246,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 20px rgba(59,130,246,0.4)")}
          >
            ⚔️ COMMENCER L'AVENTURE
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Données sauvegardées localement • Aucun compte requis
        </p>
      </div>
    </div>
  );
}
