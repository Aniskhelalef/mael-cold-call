"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { fetchAllStates } from "@/lib/supabase";
import { GameState, Prospect, ProspectStatus } from "@/lib/types";

const BORDER  = "#383838";
const CARD_BG = "#232323";

const STATUS_CFG: Record<ProspectStatus, { label: string; color: string }> = {
  a_appeler: { label: "À appeler",  color: "#848484" },
  rappel:    { label: "Relance",    color: "#f97316" },
  rdv:       { label: "RDV Booké", color: "#22c55e" },
  perdu:     { label: "Perdu",     color: "#ef4444" },
};
const STATUS_LIST: ProspectStatus[] = ["a_appeler", "rappel", "rdv", "perdu"];
const USER_COLORS = ["#FF5500", "#5DC7E5", "#1CE400", "#AE00FC", "#f97316", "#f6ad55"];

type UserRow = { email: string; state: GameState; syncedAt: string };

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "à l'instant";
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

function fmtDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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

// ── Lead row ──────────────────────────────────────────────────────────────────

function LeadRow({ prospect, idx, onDelete }: { prospect: Prospect; idx: number; onDelete: () => void }) {
  const [playerOpen, setPlayerOpen] = useState(false);
  const [audioUrls,  setAudioUrls]  = useState<{ key: string; url: string }[]>([]);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => { urlsRef.current.forEach((u) => URL.revokeObjectURL(u)); };
  }, []);

  async function togglePlayer() {
    if (playerOpen) { setPlayerOpen(false); return; }
    const refs = (prospect.recordings ?? []).filter((r) => r.startsWith("http") || r.startsWith("data:"));
    if (refs.length === 0) return;
    setAudioUrls(refs.map((url) => ({ key: url, url })));
    setPlayerOpen(true);
  }

  const sc          = STATUS_CFG[prospect.status] ?? STATUS_CFG.a_appeler;
  const rowBg       = idx % 2 === 0 ? "#1c1c1c" : "#181818";
  const playableRecs = (prospect.recordings ?? []).filter((r) => r.startsWith("http") || r.startsWith("data:"));
  const hasRec      = playableRecs.length > 0;

  return (
    <>
      <tr style={{ borderBottom: playerOpen ? "none" : "1px solid #252525", background: rowBg }}>
        <td style={{ padding: "8px 12px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={prospect.name}>
          {(prospect.googleMapsUrl || prospect.website) ? (
            <a href={prospect.googleMapsUrl || prospect.website} target="_blank" rel="noopener noreferrer"
              style={{ color: "#f1f5f9", fontSize: "0.83rem", fontWeight: 600, textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#60a5fa"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#f1f5f9"; }}>
              {prospect.name} <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>↗</span>
            </a>
          ) : (
            <span style={{ color: "#f1f5f9", fontSize: "0.83rem", fontWeight: 600 }}>{prospect.name}</span>
          )}
        </td>
        <td style={{ padding: "8px 12px", maxWidth: 160 }}>
          {prospect.website ? (
            <a href={prospect.website} target="_blank" rel="noopener noreferrer"
              style={{ color: "#f97316", fontSize: "0.72rem", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#fb923c"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#f97316"; }}
              title={prospect.website}>
              {prospect.website.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          ) : <span style={{ color: "#383838", fontSize: "0.75rem" }}>—</span>}
        </td>
        <td style={{ padding: "8px 12px", maxWidth: 200 }}>
          {prospect.email ? (
            <a href={`mailto:${prospect.email}`}
              style={{ color: "#848484", fontSize: "0.75rem", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#FF5500"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#848484"; }}>
              {prospect.email}
            </a>
          ) : <span style={{ color: "#383838", fontSize: "0.75rem" }}>—</span>}
        </td>
        <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
          {prospect.phone ? (
            <a href={`tel:${prospect.phone.replace(/\s/g, "")}`}
              style={{ color: "#60a5fa", fontSize: "0.78rem", textDecoration: "none", fontFamily: "monospace" }}>
              {prospect.phone}
            </a>
          ) : <span style={{ color: "#383838", fontSize: "0.78rem" }}>—</span>}
        </td>
        <td style={{ padding: "8px 12px", fontSize: "0.78rem", color: "#686868", whiteSpace: "nowrap" }}>
          {fmtDate(prospect.premierContact) ?? "—"}
        </td>
        <td style={{ padding: "8px 12px", textAlign: "center" }}>
          {prospect.reponse ? (
            <span style={{
              padding: "2px 10px", borderRadius: 3, fontSize: "0.72rem", fontWeight: 700,
              background: prospect.reponse === "Oui" ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.15)",
              color: prospect.reponse === "Oui" ? "#22c55e" : "#ef4444",
            }}>{prospect.reponse}</span>
          ) : <span style={{ color: "#383838", fontSize: "0.75rem" }}>—</span>}
        </td>
        <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
          <span className="font-game text-[9px] px-2 py-1 rounded-sm"
            style={{ background: `${sc.color}18`, border: `1px solid ${sc.color}50`, color: sc.color, whiteSpace: "nowrap" }}>
            {sc.label}
          </span>
        </td>
        <td style={{ padding: "8px 12px", fontSize: "0.78rem", color: prospect.rappelDate ? "#5DC7E5" : "#383838", whiteSpace: "nowrap" }}>
          {fmtDate(prospect.rappelDate) ?? "—"}
        </td>
        <td style={{ padding: "8px 12px", fontSize: "0.78rem", color: "#686868", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {prospect.pourquoi ?? "—"}
        </td>
        <td style={{ padding: "8px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
          {prospect.callDuration
            ? <span style={{ color: "#f59e0b", fontSize: "0.75rem", fontFamily: "monospace" }}>
                {String(Math.floor(prospect.callDuration / 60)).padStart(2, "0")}:{String(prospect.callDuration % 60).padStart(2, "0")}
              </span>
            : <span style={{ color: "#383838", fontSize: "0.75rem" }}>—</span>}
        </td>
        <td style={{ padding: "8px 12px", fontSize: "0.78rem", color: "#686868", minWidth: 160, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {prospect.notes || "—"}
        </td>
        <td style={{ padding: "8px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
          {hasRec && (
            <button onClick={togglePlayer}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.06em", color: playerOpen ? "#FF5500" : "#5DC7E5" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}>
              🎙 ÉCOUTER{playableRecs.length > 1 && ` (${playableRecs.length})`}
            </button>
          )}
          <button
            onClick={() => { if (window.confirm(`Supprimer ${prospect.name} ?`)) onDelete(); }}
            style={{ background: "none", border: "none", color: "#383838", cursor: "pointer", fontSize: "0.9rem", marginLeft: hasRec ? 6 : 0 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#383838"; }}>
            🗑
          </button>
        </td>
      </tr>

      {playerOpen && audioUrls.length > 0 && (
        <tr style={{ background: "#141414", borderBottom: "1px solid #252525" }}>
          <td colSpan={12} style={{ padding: "10px 16px" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-game text-[9px] tracking-widest" style={{ color: "#5DC7E5" }}>🎙 ENREGISTREMENTS — {prospect.name}</span>
              <button onClick={() => setPlayerOpen(false)}
                style={{ background: "none", border: "none", color: "#484848", cursor: "pointer", fontSize: "0.75rem", marginLeft: "auto" }}>✕</button>
            </div>
            <div className="space-y-2">
              {audioUrls.map((item, i) => (
                <div key={item.key} className="flex items-center gap-3">
                  <span style={{ color: "#484848", fontSize: "0.65rem", fontFamily: "monospace", flexShrink: 0 }}>#{audioUrls.length - i}</span>
                  <audio controls src={item.url} autoPlay={i === audioUrls.length - 1}
                    style={{ flex: 1, height: 28, accentColor: "#5DC7E5" }} />
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Pipeline panel ─────────────────────────────────────────────────────────────

async function deleteProspectInSupabase(userEmail: string, prospectId: string, currentState: GameState) {
  const { supabase } = await import("@/lib/supabase");
  if (!supabase) return;
  const updated = { ...currentState, prospects: (currentState.prospects ?? []).filter((p) => p.id !== prospectId) };
  await supabase.from("game_state").update({ data: updated, updated_at: new Date().toISOString() }).eq("id", userEmail);
}

function PipelinePanel({ user, color, onProspectDeleted }: { user: UserRow; color: string; onProspectDeleted: (id: string) => void }) {
  const [search,       setSearch]      = useState("");
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | "all">("all");
  const [archiveOpen,  setArchiveOpen]  = useState(false);

  const allProspects      = user.state.prospects ?? [];
  const prospects         = allProspects.filter((p) => !p.archived);
  const archivedProspects = allProspects.filter((p) => p.archived);

  const total       = prospects.length;
  const reached     = prospects.filter((p) => p.reponse === "Oui" || p.reponse === "Non").length;
  const oui         = prospects.filter((p) => p.reponse === "Oui").length;
  const relancePend = prospects.filter((p) => p.status === "rappel").length;
  const rdvCount    = prospects.filter((p) => p.status === "rdv").length;
  const tauxReponse = reached > 0 ? Math.round((oui / reached) * 100) : 0;

  const filtered = useMemo(() => {
    let list = prospects;
    if (filterStatus !== "all") list = list.filter((p) => p.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.notes ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [prospects, filterStatus, search]);

  const TH = ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.65rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.1em", color: "#848484", borderBottom: `1px solid ${BORDER}`, background: "#1a1a1a", whiteSpace: "nowrap", ...style }}>
      {children}
    </th>
  );

  return (
    <div className="space-y-4">
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "16px 20px" }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="font-game text-xs tracking-widest" style={{ color }}>
            PIPELINE — {user.state.playerName.toUpperCase()}
          </span>
          <span className="font-game text-[9px]" style={{ color: "#484848" }}>
            {total} prospects actifs · actif {relativeTime(user.syncedAt)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "TAUX DE RÉPONSE",     value: `${tauxReponse}%`, sub: `${oui} OUI / ${reached} contactés`, color: "#22c55e" },
            { label: "RELANCES EN ATTENTE", value: relancePend,        sub: "leads à rappeler",                  color: "#f97316" },
            { label: "RDV BOOKÉS",          value: rdvCount,            sub: `sur ${total} leads`,               color: "#5DC7E5" },
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: "#181818", border: `1px solid ${BORDER}`, borderRadius: 4, padding: "12px 16px" }}>
              <div style={{ color: "#848484", fontSize: "0.62rem", letterSpacing: "0.1em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>{kpi.label}</div>
              <div style={{ color: kpi.color, fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>{kpi.value}</div>
              <div style={{ color: "#484848", fontSize: "0.7rem", marginTop: 2 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
          style={{ flex: "1 1 180px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 3, padding: "8px 12px", color: "#fff", fontSize: "0.83rem", outline: "none" }}
          onFocus={(e) => { e.target.style.borderColor = "#FF5500"; }}
          onBlur={(e)  => { e.target.style.borderColor = BORDER; }} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ProspectStatus | "all")}
          style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 3, padding: "8px 10px", color: "#C0C0C0", fontSize: "0.8rem", outline: "none", cursor: "pointer" }}>
          <option value="all">Tous les statuts</option>
          {STATUS_LIST.map((s) => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>
        <div style={{ color: "#484848", fontSize: "0.72rem", marginLeft: 4 }}>
          {filtered.length} affiché{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div style={{ overflowX: "auto", borderRadius: 4, border: `1px solid ${BORDER}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH>NOM</TH><TH>SITE</TH><TH>MAIL</TH><TH>TÉL</TH><TH>1er CONTACT</TH>
              <TH style={{ textAlign: "center" }}>RÉPONSE</TH>
              <TH>STATUT</TH><TH>DATE RELANCE</TH><TH>POURQUOI</TH>
              <TH style={{ textAlign: "center" }}>DURÉE</TH>
              <TH>COMMENTAIRES</TH><TH></TH>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: "32px", textAlign: "center", color: "#484848", fontSize: "0.85rem" }}>
                  {total === 0 ? "Pipeline vide" : "Aucun résultat"}
                </td>
              </tr>
            ) : filtered.map((p, i) => (
              <LeadRow key={p.id} prospect={p} idx={i} onDelete={() => {
                deleteProspectInSupabase(user.email, p.id, user.state);
                onProspectDeleted(p.id);
              }} />
            ))}
          </tbody>
        </table>
      </div>

      {archivedProspects.length > 0 && (
        <div style={{ borderRadius: 4, border: "1px solid #2a2a2a", overflow: "hidden" }}>
          <button onClick={() => setArchiveOpen((o) => !o)}
            className="w-full flex items-center gap-2 px-4 py-3 font-game text-xs tracking-widest"
            style={{ background: "#1a1a1a", border: "none", cursor: "pointer", color: "#484848", textAlign: "left" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#686868"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#484848"; }}>
            <span>📦</span>
            <span>ARCHIVES</span>
            <span style={{ background: "#2a2a2a", borderRadius: 2, padding: "1px 6px", fontSize: "0.65rem" }}>{archivedProspects.length}</span>
            <span style={{ fontSize: "0.65rem", color: "#383838" }}>— prospects perdus archivés automatiquement</span>
            <span className="ml-auto">{archiveOpen ? "▲" : "▼"}</span>
          </button>
          {archiveOpen && (
            <div style={{ overflowX: "auto", borderTop: "1px solid #222" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["NOM", "SPÉCIALITÉ", "VILLE", "TÉL", "1er CONTACT", "COMMENTAIRES"].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.62rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.1em", color: "#484848", borderBottom: "1px solid #222", background: "#161616", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {archivedProspects.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < archivedProspects.length - 1 ? "1px solid #1e1e1e" : "none", background: i % 2 === 0 ? "#181818" : "#1a1a1a" }}>
                      <td style={{ padding: "7px 12px", fontSize: "0.78rem", color: "#686868", whiteSpace: "nowrap" }}>{p.name}</td>
                      <td style={{ padding: "7px 12px", fontSize: "0.72rem", color: "#484848" }}>{p.specialite}</td>
                      <td style={{ padding: "7px 12px", fontSize: "0.72rem", color: "#484848" }}>{p.ville}</td>
                      <td style={{ padding: "7px 12px", fontSize: "0.72rem", color: "#484848", whiteSpace: "nowrap" }}>{p.phone}</td>
                      <td style={{ padding: "7px 12px", fontSize: "0.72rem", color: "#484848", whiteSpace: "nowrap" }}>{fmtDate(p.premierContact) ?? "—"}</td>
                      <td style={{ padding: "7px 12px", fontSize: "0.72rem", color: "#484848", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Coaching tab ───────────────────────────────────────────────────────────────

export default function CoachingTab() {
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
    <div className="max-w-7xl mx-auto space-y-4">

      {/* Refresh bar */}
      <div className="flex items-center justify-end gap-3">
        {loading && <span className="font-game text-[9px] tracking-widest" style={{ color: "#484848" }}>SYNC…</span>}
        <span className="font-game text-[9px] tracking-widest" style={{ color: "#383838" }}>
          {refreshed.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <button onClick={load}
          className="font-game text-[9px] tracking-widest px-2.5 py-1.5 rounded-sm"
          style={{ background: "transparent", border: `1px solid ${BORDER}`, color: "#484848", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#C0C0C0"; e.currentTarget.style.borderColor = "#484848"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#484848"; e.currentTarget.style.borderColor = BORDER; }}>
          ↻ REFRESH
        </button>
      </div>

      {/* Team cards */}
      {users.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(users.length, 4)}, 1fr)` }}>
          {users.map((u, i) => {
            const col    = USER_COLORS[i % USER_COLORS.length];
            const s      = u.state;
            const active = selectedEmail === u.email;
            const ap     = (s.prospects ?? []).filter((p) => !p.archived);
            const withRec = ap.filter((p) => (p.recordings ?? []).some((r) => r.startsWith("http") || r.startsWith("data:"))).length;
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
                    { label: `${ap.length} leads`,                                          color: "#383838" },
                    { label: `${ap.filter((p) => p.status === "rdv").length} RDV`,          color: "#1CE400" },
                    { label: `${ap.filter((p) => p.status === "rappel").length} relances`,  color: "#5DC7E5" },
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
      )}

      {/* Pipeline du commercial sélectionné */}
      {selectedUser && (
        <PipelinePanel
          user={selectedUser}
          color={selectedColor}
          onProspectDeleted={(id) => {
            setUsers((prev) => prev.map((u) =>
              u.email === selectedUser.email
                ? { ...u, state: { ...u.state, prospects: (u.state.prospects ?? []).filter((p) => p.id !== id) } }
                : u
            ));
          }}
        />
      )}

      {!loading && users.length === 0 && (
        <div style={{ padding: "60px", textAlign: "center", color: "#383838" }}>
          <div className="font-game text-xs tracking-widest">AUCUNE DONNÉE DISPONIBLE</div>
        </div>
      )}
    </div>
  );
}
