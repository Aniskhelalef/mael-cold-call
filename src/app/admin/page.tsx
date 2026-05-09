"use client";

import { useState, useEffect, useCallback } from "react";
import { GameState } from "@/lib/types";
import { RANKS } from "@/lib/gameData";
import { fetchAllStates, isSupabaseConfigured } from "@/lib/supabase";
import { Prospect, ProspectStatus } from "@/lib/types";

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
  state, syncedAt, onRefresh, loading, hideHeader = false,
}: {
  state: GameState; syncedAt: string | null; onRefresh: () => void; loading: boolean; hideHeader?: boolean;
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

  return (
    <div>
      {/* ── Player summary banner (when not hidden) ── */}
      {!hideHeader && (
        <div style={{ background: "#1a1b26", borderBottom: "1px solid #2a2b3d", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
              {state.playerName}
            </span>
            {state.playerEmail && <span style={{ fontSize: "0.75rem", color: "#60a5fa" }}>{state.playerEmail}</span>}
            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.6rem", borderRadius: "9999px", color: rank.color, background: `${rank.color}22`, border: `1px solid ${rank.color}44`, fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>
              {rank.name}
            </span>
          </div>
          {syncDate && <div style={{ fontSize: "0.7rem", color: "#4b5563" }}>{timeAgo(syncDate)}</div>}
        </div>
      )}

      {/* Player name + rank inline when header is hidden */}
      {hideHeader && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
          <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
            {state.playerName}
          </span>
          <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.6rem", borderRadius: "9999px", color: rank.color, background: `${rank.color}22`, border: `1px solid ${rank.color}44`, fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>
            {rank.name}
          </span>
          {syncDate && <span style={{ fontSize: "0.7rem", color: "#4b5563" }}>{timeAgo(syncDate)}</span>}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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


        <div style={{ textAlign: "center", fontSize: "0.7rem", color: "#1f2937", paddingBottom: "1rem" }}>
          Cold Call of Duty Admin — Données en lecture seule
        </div>
      </div>
    </div>
  );
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProspectStatus, { label: string; color: string }> = {
  a_appeler:      { label: "—",              color: "#848484" },
  rappel:         { label: "Relance",        color: "#f97316" },
  rdv:            { label: "RDV Booké",      color: "#22c55e" },
  demo:           { label: "Site montré",    color: "#8b5cf6" },
  vente_en_cours: { label: "Vente en cours", color: "#f59e0b" },
  vendu:          { label: "Vendu",          color: "#1CE400" },
  perdu:          { label: "No close",       color: "#ef4444" },
};

// ─── Pipeline View ─────────────────────────────────────────────────────────────

function PipelineView({ prospects }: { prospects: Prospect[] }) {
  const [search, setSearch] = useState("");

  const filtered = prospects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.phone.includes(q) || (p.email ?? "").toLowerCase().includes(q);
  });

  const total   = prospects.length;
  const rdv     = prospects.filter((p) => p.status === "rdv" || p.status === "demo" || p.status === "vente_en_cours" || p.status === "vendu").length;
  const relance = prospects.filter((p) => p.status === "rappel").length;
  const vendu   = prospects.filter((p) => p.status === "vendu").length;

  return (
    <div style={{ background: "#1a1b26", border: "1px solid #2a2b3d", borderRadius: "0.75rem", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #2a2b3d" }}>
        <div style={{ fontSize: "0.65rem", color: "#4b5563", letterSpacing: "0.15em", marginBottom: "0.75rem" }}>
          👥 PIPELINE — {total} LEADS
        </div>
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          {[
            { label: "Total",    value: total,   color: "#e2e8f0" },
            { label: "RDV+",     value: rdv,     color: "#22c55e" },
            { label: "Relances", value: relance, color: "#f97316" },
            { label: "Vendus",   value: vendu,   color: "#1CE400" },
          ].map((kpi) => (
            <div key={kpi.label}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: kpi.color, lineHeight: 1 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#4b5563", marginTop: "0.15rem" }}>{kpi.label}</div>
            </div>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un lead…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "0.5rem 0.875rem",
            background: "#0f1117", border: "1px solid #2a2b3d", borderRadius: "0.375rem",
            color: "#e2e8f0", fontSize: "0.8rem", outline: "none",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#111827" }}>
              {["NOM", "TÉL", "STATUT", "RÉPONSE", "1er CONTACT", "FICHE", "COMMENTAIRE"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.6rem", color: "#4b5563", letterSpacing: "0.1em", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid #2a2b3d" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#4b5563", fontSize: "0.875rem" }}>
                  Aucun lead
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => {
                const sc = STATUS_LABELS[p.status] ?? STATUS_LABELS.a_appeler;
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #1f2937", background: i % 2 === 0 ? "#1a1b26" : "#151621" }}>
                    <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ color: "#e2e8f0", fontSize: "0.82rem", fontWeight: 600 }}>{p.name}</span>
                    </td>
                    <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                      <a href={`tel:${p.phone.replace(/\s/g, "")}`} style={{ color: "#60a5fa", fontSize: "0.78rem", textDecoration: "none", fontFamily: "monospace" }}>
                        {p.phone}
                      </a>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: sc.color + "22", color: sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <span style={{
                        fontSize: "0.7rem", fontWeight: 700,
                        color: p.reponse === "Oui" ? "#22c55e" : p.reponse === "Non" ? "#ef4444" : "#374151",
                      }}>
                        {p.reponse ?? "—"}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                      {p.premierContact
                        ? new Date(p.premierContact + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                        : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      {p.googleMapsUrl ? (
                        <a href={p.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontSize: "0.72rem", textDecoration: "none" }}>
                          Maps ↗
                        </a>
                      ) : <span style={{ color: "#374151", fontSize: "0.72rem" }}>—</span>}
                    </td>
                    <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: "0.75rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.notes || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page Export ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authenticated,  setAuthenticated]  = useState(false);
  const [checkingAuth,   setCheckingAuth]   = useState(true);
  const [allUsers,       setAllUsers]       = useState<{ email: string; state: GameState; syncedAt: string }[]>([]);
  const [selectedEmail,  setSelectedEmail]  = useState<string | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [activeTab,      setActiveTab]      = useState<"stats" | "pipeline">("stats");

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") setAuthenticated(true);
    setCheckingAuth(false);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const users = await fetchAllStates();
      setAllUsers(users);
      if (users.length > 0 && !selectedEmail) setSelectedEmail(users[0].email);
    } finally {
      setLoading(false);
    }
  }, [selectedEmail]);

  useEffect(() => {
    if (!authenticated || !isSupabaseConfigured) return;
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [authenticated, fetchData]);

  if (checkingAuth) return null;
  if (!authenticated) return <PasswordGate onAuth={() => setAuthenticated(true)} />;
  if (!isSupabaseConfigured) return <SetupInstructions />;

  const selected = allUsers.find((u) => u.email === selectedEmail) ?? null;

  if (!selected && !loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1117" }}>
        {loading ? (
          <div style={{ color: "#6b7280" }}>Chargement…</div>
        ) : (
          <div style={{ textAlign: "center", color: "#6b7280" }}>Aucune donnée — les commerciaux doivent d&apos;abord utiliser l&apos;app.</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117" }}>
      {/* ── Top bar ── */}
      <div style={{ background: "#1a1b26", borderBottom: "1px solid #2a2b3d", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>👑</span>
            <span style={{ fontSize: "0.65rem", color: "#6b7280", letterSpacing: "0.15em" }}>COLD CALL OF DUTY — ADMIN</span>
          </div>

          {/* User selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <select
              value={selectedEmail ?? ""}
              onChange={(e) => { setSelectedEmail(e.target.value); setActiveTab("stats"); }}
              style={{
                background: "#0f1117", border: "1px solid #2a2b3d", borderRadius: "0.5rem",
                color: "#e2e8f0", padding: "0.4rem 0.75rem", fontSize: "0.85rem",
                outline: "none", cursor: "pointer", fontFamily: "Rajdhani, sans-serif",
              }}
            >
              {allUsers.map((u) => (
                <option key={u.email} value={u.email}>{u.state.playerName} — {u.email}</option>
              ))}
            </select>
            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                padding: "0.4rem 0.875rem", borderRadius: "0.5rem",
                background: "transparent", border: "1px solid #374151",
                color: loading ? "#4b5563" : "#9ca3af",
                fontSize: "0.75rem", cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "..." : "🔄 Sync"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        {selected && (
          <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem", display: "flex", gap: "0" }}>
            {(["stats", "pipeline"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "0.6rem 1.25rem", fontSize: "0.72rem", fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
                  background: "none", border: "none",
                  borderBottom: activeTab === tab ? "2px solid #FF5500" : "2px solid transparent",
                  color: activeTab === tab ? "#FF5500" : "#6b7280",
                }}
              >
                {tab === "stats" ? "📊 STATS" : "👥 PIPELINE"}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {activeTab === "stats" ? (
            <AdminDashboard
              state={selected.state}
              syncedAt={selected.syncedAt}
              onRefresh={fetchData}
              loading={loading}
              hideHeader
            />
          ) : (
            <PipelineView prospects={selected.state.prospects ?? []} />
          )}
        </div>
      )}
    </div>
  );
}
