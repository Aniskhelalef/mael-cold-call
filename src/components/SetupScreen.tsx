"use client";

import { useState } from "react";
import { useGame } from "@/lib/gameContext";
import { fetchStateFromSupabase, isSupabaseConfigured } from "@/lib/supabase";

const CARD_BG = "#232323";
const BORDER  = "#383838";

export default function SetupScreen() {
  const { dispatch } = useGame();
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: { name?: string; email?: string } = {};
    if (!name.trim())  e.name  = "Ton prénom est requis";
    if (!email.trim()) e.email = "Ton email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Email invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStart = async () => {
    if (!validate()) return;
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName  = name.trim();
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const result = await fetchStateFromSupabase();
        if (result && result.state.playerEmail === trimmedEmail) {
          dispatch({ type: "RESTORE_STATE", state: { ...result.state, playerName: trimmedName } });
          return;
        }
      }
      dispatch({ type: "SETUP_PLAYER", name: trimmedName, email: trimmedEmail });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "0.75rem 1rem",
    background: "#181818",
    border: `1px solid ${BORDER}`,
    borderRadius: "2px",
    color: "#F0F0F0",
    outline: "none",
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: "1rem",
    letterSpacing: "0.04em",
    transition: "border-color 0.15s",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#181818" }}
    >
      {/* Subtle orange glow top-left */}
      <div
        className="absolute top-0 left-0 w-96 h-96 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,85,0,0.06) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-game text-[11px] tracking-[0.25em] mb-3" style={{ color: "#848484" }}>
            COLD CALL RPG
          </div>
          <h1 className="font-game leading-none mb-2" style={{ fontSize: "clamp(2.5rem,8vw,3.5rem)", color: "#FF5500" }}>
            CCR
          </h1>
          <p style={{ color: "#848484", fontSize: "0.8rem" }}>
            Gamifie ta prospection. Rank up en bookant des RDV.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex gap-2 justify-center mb-6 flex-wrap">
          {[
            { icon: "📞", text: "20 calls/jour" },
            { icon: "🏅", text: "15 rangs" },
            { icon: "💰", text: "Jusqu'à 900€" },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm"
              style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
            >
              <span style={{ fontSize: "0.75rem" }}>{f.icon}</span>
              <span className="font-game text-[10px] tracking-wider" style={{ color: "#C0C0C0" }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div
          className="rounded-sm p-5"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="font-game text-[10px] tracking-widest mb-4" style={{ color: "#848484" }}>
            CRÉER / REJOINDRE
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="font-game text-[10px] tracking-widest block mb-1.5" style={{ color: "#848484" }}>
              PRÉNOM
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="Mael"
              maxLength={20}
              autoFocus
              style={{ ...inputStyle, borderColor: errors.name ? "#ef4444" : BORDER }}
              onFocus={(e) => { if (!errors.name) e.target.style.borderColor = "#FF5500"; }}
              onBlur={(e)  => { if (!errors.name) e.target.style.borderColor = BORDER; }}
            />
            {errors.name && (
              <p style={{ color: "#ef4444", fontSize: "0.72rem", marginTop: "0.25rem" }}>{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="font-game text-[10px] tracking-widest block mb-1.5" style={{ color: "#848484" }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="ton@email.com"
              style={{ ...inputStyle, borderColor: errors.email ? "#ef4444" : BORDER }}
              onFocus={(e) => { if (!errors.email) e.target.style.borderColor = "#FF5500"; }}
              onBlur={(e)  => { if (!errors.email) e.target.style.borderColor = BORDER; }}
            />
            {errors.email && (
              <p style={{ color: "#ef4444", fontSize: "0.72rem", marginTop: "0.25rem" }}>{errors.email}</p>
            )}
            <p style={{ color: "#686868", fontSize: "0.68rem", marginTop: "0.35rem" }}>
              Sert à retrouver ta progression si tu te reconnectes
            </p>
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-3.5 rounded-sm font-game text-sm tracking-widest transition-all duration-150 active:scale-95 btn-pulse"
            style={{
              background:    loading ? "#2A2A2A" : "#FF5500",
              color:         loading ? "#848484" : "#FFFFFF",
              border:        `1px solid ${loading ? BORDER : "#FF5500"}`,
              cursor:        loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#FF6B1A"; e.currentTarget.style.borderColor = "#FF6B1A"; } }}
            onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = "#FF5500"; e.currentTarget.style.borderColor = "#FF5500"; } }}
          >
            {loading ? "VÉRIFICATION…" : "COMMENCER →"}
          </button>
        </div>

        <p className="text-center mt-3" style={{ color: "#484848", fontSize: "0.65rem" }}>
          Progression sauvegardée localement + cloud
        </p>
      </div>
    </div>
  );
}
