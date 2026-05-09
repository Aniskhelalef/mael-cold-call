"use client";

import { useState, useEffect, useCallback } from "react";
import { GameState } from "@/lib/types";
import { ACHIEVEMENTS, RANKS } from "@/lib/gameData";
import { fetchStateFromSupabase, isSupabaseConfigured } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "coldcall2024";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRank(bookings: number) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (bookings >= r.minBookings) current = r;
  }
  const idx = RANKS.findIndex((r) => r.name === current.name);
  return { current, next: RANKS[idx + 1] ?? null };
}

function convRate(calls: number, bookings: number) {
  if (calls === 0) return "—";
  return `${((bookings / calls) * 100).toFixed(1)}%`;
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m}min`;
  return `il y a ${Math.floor(m / 60)}h`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

const TIER = {
  bronze: { border: "#cd7f32", text: "#cd7f32", bg: "rgba(205,127,50,0.12)" },
  silver: { border: "#808090", text: "#c8d0e0", bg: "rgba(192,192,192,0.08)" },
  gold:   { border: "#ffd700", text: "#ffd700", bg: "rgba(255,215,0,0.12)" },
};

// ─── Password Gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "true");
      onAuth();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1117" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👑</div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.12em", fontSize: "1.5rem", color: "#fff", fontWeight: 700 }}>
            COLD CALL OF DUTY
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: "0.25rem" }}>Panneau Admin</p>
        </div>
        <form
          onSubmit={submit}
          className="rounded-2xl p-6"
          style={{ background: "#1a1b26", border: `1px solid ${error ? "#ef4444" : "#2a2b3d"}` }}
        >
          <label style={{ display: "block", fontSize: "0.7rem", color: "#6b7280", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>
            MOT DE PASSE
          </label>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            autoFocus
            placeholder="••••••••••"
            style={{
              width: "100%", boxSizing: "border-box", padding: "0.75rem 1rem",
              background: "#0f1117", border: `1px solid ${error ? "#ef4444" : "#2a2b3d"}`,
              borderRadius: "0.5rem", color: "#fff", outline: "none",
              fontFamily: "Rajdhani, sans-serif", fontSize: "1.1rem",
              marginBottom: error ? "0.5rem" : "1rem",
            }}
          />
          {error && (
            <p style={{ color: "#ef4444", fontSize: "0.75rem", textAlign: "center", marginBottom: "1rem" }}>
              Mot de passe incorrect
            </p>
          )}
          <button
            type="submit"
            style={{
              width: "100%", padding: "0.875rem",
              background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
              border: "1px solid #3b82f6", borderRadius: "0.5rem",
              color: "#fff", fontFamily: "Rajdhani, sans-serif",
              fontSize: "1rem", letterSpacing: "0.12em", fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ACCÉDER
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Setup Instructions ────────────────────────────────────────────────────────

function SetupInstructions() {
  const sql = `CREATE TABLE IF NOT EXISTS game_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON game_state
  FOR ALL USING (true) WITH CHECK (true);`;

  const env = `NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_ADMIN_PASSWORD=ton_mot_de_passe`;

  const steps = [
    { n: 1, title: "Crée un projet Supabase", content: <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Va sur <span style={{ color: "#60a5fa" }}>supabase.com</span> et crée un projet gratuit.</p> },
    { n: 2, title: "Lance ce SQL dans l'éditeur SQL", content: <pre style={{ background: "#0f1117", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.75rem", color: "#4ade80", overflowX: "auto", margin: 0 }}>{sql}</pre> },
    { n: 3, title: <>Ajoute dans <code style={{ color: "#fbbf24" }}>.env.local</code></>, content: <pre style={{ background: "#0f1117", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.75rem", color: "#fbbf24", overflowX: "auto", margin: 0 }}>{env}</pre> },
    { n: 4, title: "Redémarre le serveur", content: <pre style={{ background: "#0f1117", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.75rem", color: "#e2e8f0", margin: 0 }}>npm run dev</pre> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔌</div>
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", color: "#fff", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Connexion Supabase requise
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Suis ces 4 étapes pour activer la synchronisation</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {steps.map((s) => (
            <div key={s.n} style={{ background: "#1a1b26", border: "1px solid #2a2b3d", borderRadius: "0.75rem", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>{s.n}</span>
                <span style={{ color: "#fff", fontWeight: 600 }}>{s.title}</span>
              </div>
              <div style={{ marginLeft: "2.75rem" }}>{s.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── History Bar Chart ─────────────────────────────────────────────────────────

function HistoryChart({ history }: { history: GameState["history"] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  if (history.length === 0) {
    return (
      <div style={{ height: "8rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", fontSize: "0.875rem" }}>
        Pas encore de données — Mael doit d&apos;abord utiliser l&apos;app
      </div>
    );
  }
  const last30 = history.slice(-30);
  const maxCalls = Math.max(...last30.map((d) => d.calls), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "8rem", position: "relative" }}>
      {last30.map((day) => {
        const h = Math.max((day.calls / maxCalls) * 100, 4);
        const hasBooking = day.bookings > 0;
        const label = new Date(day.date + "T00:00:00").toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
        const isHovered = hovered === day.date;

        return (
          <div
            key={day.date}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", cursor: "default" }}
            onMouseEnter={() => setHovered(day.date)}
            onMouseLeave={() => setHovered(null)}
          >
            {isHovered && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
                background: "#1a1b26", border: "1px solid #2a2b3d", borderRadius: "0.4rem",
                padding: "0.35rem 0.6rem", whiteSpace: "nowrap", zIndex: 10,
                fontSize: "0.7rem", color: "#e2e8f0",
              }}>
                {label}: {day.calls} calls, {day.bookings} RDV
              </div>
            )}
            <div
              style={{
                width: "100%", borderRadius: "3px 3px 0 0",
                height: `${h}%`,
                background: hasBooking
                  ? "linear-gradient(to top, #22c55e, #16a34a)"
                  : "linear-gradient(to top, #3b82f6, #2563eb)",
                opacity: isHovered ? 1 : 0.75,
                transition: "opacity 0.15s",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ title, icon, rows }: {
  title: string; icon: string;
  rows: { label: string; value: string | number; accent?: boolean }[];
}) {
  return (
    <div style={{ background: "#1a1b26", border: "1px solid #2a2b3d", borderRadius: "0.75rem", padding: "1.25rem" }}>
      <div style={{ fontSize: "0.65rem", color: "#4b5563", letterSpacing: "0.15em", marginBottom: "1rem" }}>
        {icon} {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>{r.label}</span>
            <span style={{
              fontFamily: "Rajdhani, sans-serif", fontSize: "1.15rem", fontWeight: 700,
              color: r.accent ? "#60a5fa" : "#e2e8f0",
            }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

function AdminDashboard({
  state, syncedAt, onRefresh, loading,
}: {
  state: GameState; syncedAt: string | null; onRefresh: () => void; loading: boolean;
}) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceUpdate((n) => n + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const { current: rank, next: nextRank } = getRank(state.totalBookings);
  const weeklyCalls = state.totalCalls - state.weeklyCallsAtStart;
  const weeklyBookings = state.totalBookings - state.weeklyBookingsAtStart;
  const calledToday = state.lastActivityDate === today();
  const syncDate = syncedAt ? new Date(syncedAt) : null;

  const rankPct = nextRank
    ? ((state.totalBookings - rank.minBookings) / (nextRank.minBookings - rank.minBookings)) * 100
    : 100;

  const unlocked = ACHIEVEMENTS.filter((a) => state.unlockedAchievements.includes(a.id));

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117" }}>
      {/* ── Header ── */}
      <div style={{ background: "#1a1b26", borderBottom: "1px solid #2a2b3d", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.1rem" }}>👑</span>
              <span style={{ fontSize: "0.65rem", color: "#6b7280", letterSpacing: "0.15em" }}>COLD CALL OF DUTY — ADMIN</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                {state.playerName || "Mael"}
              </span>
              {state.playerEmail && (
                <span style={{ fontSize: "0.75rem", color: "#60a5fa" }}>
                  {state.playerEmail}
                </span>
              )}
              <span style={{
                fontSize: "0.7rem", padding: "0.15rem 0.6rem", borderRadius: "9999px",
                color: rank.color, background: `${rank.color}22`, border: `1px solid ${rank.color}44`,
                fontFamily: "Rajdhani, sans-serif", fontWeight: 600,
              }}>
                {rank.name}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "flex-end" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: "0.7rem", color: "#22c55e", letterSpacing: "0.1em" }}>LIVE</span>
              </div>
              {syncDate && (
                <div style={{ fontSize: "0.7rem", color: "#4b5563" }}>{timeAgo(syncDate)}</div>
              )}
            </div>
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                padding: "0.4rem 0.875rem", borderRadius: "0.5rem",
                background: "transparent", border: "1px solid #374151",
                color: loading ? "#4b5563" : "#9ca3af",
                fontSize: "0.75rem", cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {loading ? "..." : "🔄 Sync"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <StatCard title="AUJOURD'HUI" icon="📅" rows={[
            { label: "📞 Calls", value: state.dailyCalls, accent: true },
            { label: "🎯 RDV", value: state.dailyBookings },
            { label: "💰 Sites vendus", value: state.dailySales ?? 0 },
            { label: "👍 OUI aujourd'hui", value: state.dailyCallsYes ?? 0 },
          ]} />
          <StatCard title="CETTE SEMAINE" icon="📆" rows={[
            { label: "📞 Calls", value: weeklyCalls, accent: true },
            { label: "🎯 Bookings", value: weeklyBookings },
            { label: "📊 Conversion", value: convRate(weeklyCalls, weeklyBookings) },
            { label: "📅 Jours actifs", value: `${state.weeklyDaysActive} / 7` },
          ]} />
          <StatCard title="TOTAL" icon="🏆" rows={[
            { label: "📞 Calls", value: state.totalCalls.toLocaleString("fr-FR"), accent: true },
            { label: "🎯 RDV", value: state.totalBookings.toLocaleString("fr-FR") },
            { label: "💰 Sites vendus", value: (state.totalSales ?? 0).toLocaleString("fr-FR") },
            { label: "💰 Gains", value: `${state.totalMoneyEarned ?? 0}€` },
          ]} />
        </div>

        {/* ── Streak ── */}
        <div
          style={{
            background: "#1a1b26",
            border: `1px solid ${calledToday ? "#22c55e44" : "#ef444444"}`,
            borderRadius: "0.75rem", padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.65rem", color: "#4b5563", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>🔥 STREAK</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "3.5rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                  {state.currentStreak}
                </span>
                <span style={{ color: "#9ca3af" }}>jours consécutifs</span>
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                Record personnel : {state.longestStreak} jours
              </div>
            </div>
            <div
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "0.875rem", fontWeight: 500,
                background: calledToday ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                border: calledToday ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)",
                color: calledToday ? "#4ade80" : "#f87171",
              }}
            >
              {calledToday ? "✅ A appelé aujourd'hui" : "⚠️ Pas encore appelé aujourd'hui"}
            </div>
          </div>
          {state.longestStreak > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#4b5563", marginBottom: "0.35rem" }}>
                <span>Vers le record</span>
                <span>{state.currentStreak} / {state.longestStreak}</span>
              </div>
              <div style={{ height: "6px", borderRadius: "9999px", background: "#1f2937" }}>
                <div style={{
                  height: "100%", borderRadius: "9999px",
                  width: `${Math.min((state.currentStreak / Math.max(state.longestStreak, 1)) * 100, 100)}%`,
                  background: calledToday ? "#22c55e" : "#ef4444",
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          )}
        </div>

        {/* ── History Chart ── */}
        <div style={{ background: "#1a1b26", border: "1px solid #2a2b3d", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#4b5563", letterSpacing: "0.15em" }}>📊 HISTORIQUE — 30 DERNIERS JOURS</div>
            <div style={{ display: "flex", gap: "1rem" }}>
              {[["#3b82f6", "Calls"], ["#22c55e", "Avec booking"]].map(([color, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.7rem", color: "#6b7280" }}>
                  <span style={{ width: "12px", height: "8px", borderRadius: "2px", background: color, display: "inline-block" }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <HistoryChart history={state.history} />
        </div>

        {/* ── Rank ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          {/* Rank */}
          <div style={{ background: "#1a1b26", border: "1px solid #2a2b3d", borderRadius: "0.75rem", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#4b5563", letterSpacing: "0.15em", marginBottom: "0.75rem" }}>🎮 RANG CS:GO</div>
            <div style={{ marginBottom: "0.25rem" }}>
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: rank.color }}>{rank.name}</span>
            </div>
            <div style={{ color: "#4b5563", fontSize: "0.75rem", marginBottom: "0.75rem" }}>
              {state.totalBookings} bookings totaux
            </div>
            {nextRank ? (
              <>
                <div style={{ height: "8px", borderRadius: "9999px", background: "#1f2937", marginBottom: "0.4rem" }}>
                  <div style={{ height: "100%", borderRadius: "9999px", background: rank.color, width: `${rankPct}%`, transition: "width 0.5s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#4b5563" }}>
                  <span>{state.totalBookings - rank.minBookings} / {nextRank.minBookings - rank.minBookings}</span>
                  <span style={{ color: nextRank.color }}>→ {nextRank.name} ({nextRank.minBookings - state.totalBookings} RDV)</span>
                </div>
              </>
            ) : (
              <div style={{ color: "#68d391", fontSize: "0.75rem", fontWeight: 700 }}>🌟 GLOBAL ELITE</div>
            )}
          </div>
        </div>

        {/* ── Achievements ── */}
        <div style={{ background: "#1a1b26", border: "1px solid #2a2b3d", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#4b5563", letterSpacing: "0.15em" }}>🏆 HAUTS FAITS</div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{unlocked.length}</span>
              <span style={{ color: "#374151" }}> / {ACHIEVEMENTS.length}</span>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: "4px", borderRadius: "9999px", background: "#1f2937", marginBottom: "1.25rem" }}>
            <div style={{
              height: "100%", borderRadius: "9999px",
              width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%`,
              background: "linear-gradient(to right, #cd7f32, #ffd700)",
              transition: "width 0.5s",
            }} />
          </div>
          {unlocked.length === 0 ? (
            <div style={{ textAlign: "center", color: "#374151", padding: "2rem 0", fontSize: "0.875rem" }}>
              Aucun haut fait débloqué pour l&apos;instant
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
              {unlocked.map((ach) => {
                const s = TIER[ach.tier];
                return (
                  <div
                    key={ach.id}
                    style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "0.625rem", padding: "0.875rem" }}
                  >
                    <div style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>{ach.icon}</div>
                    <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.8rem", fontWeight: 700, color: s.text, marginBottom: "0.25rem" }}>
                      {ach.title}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#6b7280", marginBottom: "0.5rem" }}>{ach.description}</div>
                    <div style={{ fontSize: "0.7rem", color: s.text, fontWeight: 600 }}>+{ach.xpReward} XP</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", fontSize: "0.7rem", color: "#1f2937", paddingBottom: "1rem" }}>
          Cold Call of Duty Admin — Données en lecture seule
        </div>
      </div>
    </div>
  );
}

// ─── Page Export ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") setAuthenticated(true);
    setCheckingAuth(false);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchStateFromSupabase();
      if (result) {
        setGameState(result.state);
        setSyncedAt(result.syncedAt);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authenticated || !isSupabaseConfigured) return;
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [authenticated, fetchData]);

  if (checkingAuth) return null;
  if (!authenticated) return <PasswordGate onAuth={() => setAuthenticated(true)} />;
  if (!isSupabaseConfigured) return <SetupInstructions />;

  if (!gameState) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1117" }}>
        {loading ? (
          <div style={{ color: "#6b7280" }}>Chargement des données...</div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#9ca3af", marginBottom: "0.5rem" }}>Aucune donnée trouvée</div>
            <div style={{ color: "#4b5563", fontSize: "0.875rem" }}>
              Mael doit d&apos;abord utiliser l&apos;app pour synchroniser.
            </div>
          </div>
        )}
      </div>
    );
  }

  return <AdminDashboard state={gameState} syncedAt={syncedAt} onRefresh={fetchData} loading={loading} />;
}
