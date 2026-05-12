"use client";

import { useEffect, useState } from "react";
import { fetchAllStates } from "@/lib/supabase";
import { GameState, Prospect, ProspectStatus } from "@/lib/types";

const BORDER   = "#2e2e2e";
const CARD_BG  = "#1e1e1e";

const STATUS_CFG: Record<ProspectStatus, { label: string; color: string }> = {
  a_appeler: { label: "À appeler", color: "#FF5500" },
  rappel:    { label: "Relance",   color: "#5DC7E5" },
  rdv:       { label: "RDV",      color: "#1CE400" },
  perdu:     { label: "Perdu",    color: "#ef4444" },
};

type UserRow = { email: string; state: GameState; syncedAt: string };

const USER_COLORS = ["#FF5500", "#5DC7E5", "#1CE400", "#AE00FC", "#f97316", "#f6ad55"];

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "à l'instant";
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-9 h-9 rounded-sm flex items-center justify-center font-game text-sm flex-shrink-0"
      style={{ background: `${color}18`, border: `1px solid ${color}50`, color }}>
      {initials}
    </div>
  );
}

// ── Pipeline row with inline audio player ─────────────────────────────────────

function ProspectRow({ p, i, total }: { p: Prospect; i: number; total: number }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CFG[p.status];
  const urls = (p.recordings ?? []).filter((r) => r.startsWith("http"));
  const rowBg = i % 2 === 0 ? "#1a1a1a" : "#1c1c1c";

  return (
    <>
      <tr style={{ borderBottom: open ? "none" : (i < total - 1 ? "1px solid #1e1e1e" : "none"), background: rowBg }}>
        <td style={{ padding: "8px 12px", fontSize: "0.8rem", color: "#C0C0C0", whiteSpace: "nowrap", fontWeight: 600 }}>{p.name}</td>
        <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: "#686868" }}>{p.specialite}</td>
        <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: "#686868", whiteSpace: "nowrap" }}>{p.ville}</td>
        <td style={{ padding: "8px 12px", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
          <a href={`tel:${p.phone.replace(/\s/g, "")}`} style={{ color: "#5DC7E5", textDecoration: "none" }}>{p.phone}</a>
        </td>
        <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
          <span className="font-game text-[9px] px-1.5 py-0.5 rounded-sm"
            style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}40`, color: cfg.color }}>
            {cfg.label}
          </span>
        </td>
        <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: "#686868", whiteSpace: "nowrap" }}>
          {p.premierContact ?? "—"}
        </td>
        <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: p.rappelDate ? "#5DC7E5" : "#383838", whiteSpace: "nowrap" }}>
          {p.rappelDate ?? "—"}
        </td>
        <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: "#686868", textAlign: "center" }}>
          {(p.relanceCount ?? 0) > 0 ? <span style={{ color: "#5DC7E5" }}>{p.relanceCount}×</span> : "—"}
        </td>
        <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: "#686868", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p.notes || "—"}
        </td>
        <td style={{ padding: "8px 12px" }}>
          {urls.length > 0 && (
            <button
              onClick={() => setOpen((o) => !o)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.06em", color: open ? "#FF5500" : "#5DC7E5" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              🎙 ÉCOUTER{urls.length > 1 && ` (${urls.length})`}
            </button>
          )}
        </td>
      </tr>

      {open && urls.length > 0 && (
        <tr style={{ background: "#141414", borderBottom: i < total - 1 ? "1px solid #1e1e1e" : "none" }}>
          <td colSpan={10} style={{ padding: "10px 16px" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-game text-[9px] tracking-widest" style={{ color: "#5DC7E5" }}>
                🎙 ENREGISTREMENTS — {p.name}
              </span>
              <button onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "#484848", cursor: "pointer", fontSize: "0.75rem", marginLeft: "auto" }}>
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {urls.map((url, idx) => (
                <div key={url} className="flex items-center gap-3">
                  <span style={{ color: "#484848", fontSize: "0.65rem", fontFamily: "monospace", flexShrink: 0 }}>
                    #{urls.length - idx}
                  </span>
                  <audio
                    controls
                    src={url}
                    autoPlay={idx === urls.length - 1}
                    style={{ flex: 1, height: 28 }}
                  />
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Pipeline table ────────────────────────────────────────────────────────────

function PipelineTable({ user, color }: { user: UserRow; color: string }) {
  const s = user.state;
  const prospects = (s.prospects ?? [])
    .filter((p) => !p.archived)
    .sort((a, b) => {
      const order: ProspectStatus[] = ["rappel", "a_appeler", "rdv", "perdu"];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });

  const withRec = prospects.filter((p) => (p.recordings ?? []).some((r) => r.startsWith("http"))).length;

  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="font-game text-xs tracking-widest" style={{ color }}>
            PIPELINE — {s.playerName.toUpperCase()}
          </span>
          <span className="font-game text-[9px]" style={{ color: "#484848" }}>
            {prospects.length} prospects actifs
          </span>
        </div>
        {withRec > 0 && (
          <span className="font-game text-[9px] px-2 py-0.5 rounded-sm"
            style={{ background: "rgba(93,199,229,0.1)", border: "1px solid rgba(93,199,229,0.3)", color: "#5DC7E5" }}>
            🎙 {withRec} enregistrement{withRec > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {prospects.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: "#383838", fontSize: "0.8rem" }}>Pipeline vide</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["NOM", "SPÉCIALITÉ", "VILLE", "TÉL", "STATUT", "1er CONTACT", "RAPPEL", "RELANCES", "COMMENTAIRES", "🎙"].map((h) => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: "0.62rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.1em", color: "#484848", borderBottom: `1px solid ${BORDER}`, background: "#181818", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prospects.map((p, i) => (
                <ProspectRow key={p.id} p={p} i={i} total={prospects.length} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DavidPage() {
  const [users,      setUsers]      = useState<UserRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshed,  setRefreshed]  = useState(new Date());
  const [activeUser, setActiveUser] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const all = await fetchAllStates();
      setUsers(all.filter((r) => r.state.playerName));
      setRefreshed(new Date());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const selectedEmail = activeUser ?? users[0]?.email ?? null;
  const selectedUser  = users.find((u) => u.email === selectedEmail) ?? users[0] ?? null;
  const selectedColor = selectedUser ? USER_COLORS[users.indexOf(selectedUser) % USER_COLORS.length] : "#FF5500";

  return (
    <div className="min-h-screen" style={{ background: "#181818", color: "#C0C0C0" }}>

      {/* Header */}
      <div style={{ background: "#111", borderBottom: `1px solid ${BORDER}`, padding: "14px 24px" }}
        className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="font-game text-[10px] tracking-widest" style={{ color: "#484848" }}>COLD CALL OF DUTY</div>
          <div style={{ width: 1, height: 14, background: "#2e2e2e" }} />
          <div className="font-game text-sm tracking-widest" style={{ color: "#FF5500" }}>DASHBOARD</div>
        </div>
        <div className="flex items-center gap-3">
          {loading && <div className="font-game text-[9px] tracking-widest" style={{ color: "#484848" }}>SYNC…</div>}
          <div className="font-game text-[9px] tracking-widest" style={{ color: "#383838" }}>
            {refreshed.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <button onClick={load}
            className="font-game text-[9px] tracking-widest px-2.5 py-1.5 rounded-sm"
            style={{ background: "transparent", border: `1px solid ${BORDER}`, color: "#484848", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#C0C0C0"; e.currentTarget.style.borderColor = "#484848"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#484848"; e.currentTarget.style.borderColor = BORDER; }}
          >↻ REFRESH</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">

        {/* Team cards */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(users.length, 1), 4)}, 1fr)` }}>
          {users.map((u, i) => {
            const col    = USER_COLORS[i % USER_COLORS.length];
            const s      = u.state;
            const active = selectedEmail === u.email;
            const ap     = (s.prospects ?? []).filter((p) => !p.archived);
            const withRec = ap.filter((p) => (p.recordings ?? []).some((r) => r.startsWith("http"))).length;
            return (
              <button key={u.email} onClick={() => setActiveUser(u.email)}
                className="rounded-sm p-4 text-left transition-all"
                style={{ background: active ? `${col}0c` : CARD_BG, border: `1px solid ${active ? col + "50" : BORDER}`, cursor: "pointer" }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <Avatar name={s.playerName} color={col} />
                  <div className="min-w-0">
                    <div className="font-game text-sm leading-tight" style={{ color: col }}>{s.playerName.toUpperCase()}</div>
                    <div style={{ color: "#484848", fontSize: "0.65rem", marginTop: 1 }}>actif {relativeTime(u.syncedAt)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: "CALLS", value: s.dailyCalls,    total: s.totalCalls,    color: "#FF5500" },
                    { label: "RDV",   value: s.dailyBookings, total: s.totalBookings, color: "#1CE400" },
                  ].map((kpi) => (
                    <div key={kpi.label} style={{ background: "#181818", borderRadius: 3, padding: "8px 10px" }}>
                      <div className="font-game text-[9px] tracking-widest mb-1" style={{ color: "#484848" }}>{kpi.label}</div>
                      <div className="font-game text-xl leading-none" style={{ color: kpi.color }}>{kpi.value}</div>
                      <div style={{ color: "#383838", fontSize: "0.6rem", marginTop: 2 }}>/ {kpi.total} total</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: `${ap.length} leads`,                                                           color: "#383838" },
                    { label: `${ap.filter((p) => p.status === "rdv").length} RDV`,                           color: "#1CE400" },
                    { label: `${ap.filter((p) => p.status === "rappel").length} relances`,                   color: "#5DC7E5" },
                    ...(withRec > 0 ? [{ label: `🎙 ${withRec}`, color: "#5DC7E5" }] : []),
                  ].map((t) => (
                    <span key={t.label} className="font-game text-[9px] px-1.5 py-0.5 rounded-sm"
                      style={{ background: `${t.color}10`, border: `1px solid ${t.color}30`, color: t.color }}>
                      {t.label}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Pipeline */}
        {selectedUser && <PipelineTable user={selectedUser} color={selectedColor} />}

        {!loading && users.length === 0 && (
          <div style={{ padding: "60px", textAlign: "center", color: "#383838" }}>
            <div className="font-game text-2xl mb-2" style={{ color: "#FF5500" }}>CCOD</div>
            <div className="font-game text-xs tracking-widest">AUCUNE DONNÉE DISPONIBLE</div>
          </div>
        )}
      </div>
    </div>
  );
}
