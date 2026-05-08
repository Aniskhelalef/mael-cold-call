"use client";

import { useState } from "react";
import { useGame } from "@/lib/gameContext";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "0.75rem 1rem",
  background: "#0f1117",
  border: "1px solid #343c5e",
  borderRadius: "0.5rem",
  color: "#f1f5f9",
  outline: "none",
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: "1.05rem",
  letterSpacing: "0.04em",
  transition: "border-color 0.15s",
};

export default function SetupScreen() {
  const { dispatch } = useGame();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validate = () => {
    const e: { name?: string; email?: string } = {};
    if (!name.trim()) e.name = "Ton prénom est requis";
    if (!email.trim()) e.email = "Ton email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Email invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStart = () => {
    if (!validate()) return;
    dispatch({ type: "SETUP_PLAYER", name: name.trim(), email: email.trim().toLowerCase() });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0c14 0%, #0d1020 50%, #0a0c14 100%)" }}
    >
      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)",
        backgroundSize: "50px 50px",
      }} />
      {/* Glows */}
      <div className="absolute top-0 left-0 w-72 h-72 opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 right-0 w-72 h-72 opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-blue-500 mb-5 glow-blue"
            style={{ background: "radial-gradient(circle, #1e3a8a 0%, #0a0c14 100%)" }}
          >
            <span className="text-4xl">🎮</span>
          </div>
          <div className="font-game text-xs tracking-widest text-blue-400 mb-2">
            COLD CALL RPG — SAISON 1
          </div>
          <h1 className="font-game text-4xl md:text-5xl gradient-text mb-3">
            CRÉE TON<br />COMPTE
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem", maxWidth: "20rem", margin: "0 auto" }}>
            Transforme chaque appel en victoire. Gagne de l'XP, monte en level, débloque des hauts faits.
          </p>
        </div>

        {/* Preview badges */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: "⚡", label: "XP & Niveaux", desc: "20 niveaux" },
            { icon: "🏆", label: "Hauts Faits", desc: "31 achievements" },
            { icon: "🎖️", label: "Rangs CS:GO", desc: "18 rangs" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border p-3 text-center"
              style={{ background: "#1a1d2e", borderColor: "#272d4a" }}
            >
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="font-game text-xs text-blue-400">{item.label}</div>
              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: "rgba(26,29,46,0.95)", borderColor: "#343c5e", backdropFilter: "blur(10px)" }}
        >
          {/* Name */}
          <div className="mb-4">
            <label style={{ display: "block", fontSize: "0.7rem", color: "#94a3b8", letterSpacing: "0.15em", marginBottom: "0.5rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
              PRÉNOM DU JOUEUR
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="Ex: Mael"
              maxLength={20}
              autoFocus
              style={{ ...INPUT_STYLE, borderColor: errors.name ? "#ef4444" : "#343c5e" }}
              onFocus={(e) => { if (!errors.name) e.target.style.borderColor = "#3b82f6"; }}
              onBlur={(e) => { if (!errors.name) e.target.style.borderColor = "#343c5e"; }}
            />
            {errors.name && (
              <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label style={{ display: "block", fontSize: "0.7rem", color: "#94a3b8", letterSpacing: "0.15em", marginBottom: "0.5rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="ton@email.com"
              style={{ ...INPUT_STYLE, borderColor: errors.email ? "#ef4444" : "#343c5e" }}
              onFocus={(e) => { if (!errors.email) e.target.style.borderColor = "#3b82f6"; }}
              onBlur={(e) => { if (!errors.email) e.target.style.borderColor = "#343c5e"; }}
            />
            {errors.email && (
              <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.email}</p>
            )}
            <p style={{ color: "#475569", fontSize: "0.7rem", marginTop: "0.375rem" }}>
              Utilisé pour t'identifier dans le tableau de bord admin
            </p>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl font-game text-lg tracking-widest transition-all duration-150 active:scale-95 btn-pulse"
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
              color: "#fff",
              border: "1px solid #3b82f6",
              boxShadow: "0 0 20px rgba(59,130,246,0.4)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 30px rgba(59,130,246,0.65)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 20px rgba(59,130,246,0.4)")}
          >
            ⚔️ COMMENCER L'AVENTURE
          </button>
        </div>

        <p style={{ textAlign: "center", color: "#334155", fontSize: "0.7rem", marginTop: "1.25rem" }}>
          Données sauvegardées localement • Visible dans l'admin
        </p>
      </div>
    </div>
  );
}
