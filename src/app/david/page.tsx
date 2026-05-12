"use client";

import { useEffect, useState } from "react";
import { fetchAllStates } from "@/lib/supabase";
import { GameState, ProspectStatus } from "@/lib/types";

const BORDER   = "#2e2e2e";
const CARD_BG  = "#1e1e1e";

const STATUS_CFG: Record<ProspectStatus, { label: string; color: string }> = {
  a_appeler: { label: "À appeler", color: "#FF5500" },
  rappel:    { label: "Relance",   color: "#5DC7E5" },
  rdv:       { label: "RDV",      color: "#1CE400" },
  perdu:     { label: "Perdu",    color: "#ef4444" },
};

type UserRow = {
  email: string;
  state: GameState;
  syncedAt: string;
};

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "à l'instant";
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

function avatar(name: string, color: string) {
  const initials = name.split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className="w-9 h-9 rounded-sm flex items-center justify-center font-game text-sm flex-shrink-0"
      style={{ background: `${color}18`, border: `1px solid ${color}50`, color }}
    >
      {initials}
    </div>
  );
}

const USER_COLORS = ["#FF5500", "#5DC7E5", "#1CE400", "#AE00FC", "#f97316", "#f6ad55"];

export default function DavidPage() {
  const [users,     setUsers]     = useState<UserRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshed, setRefreshed] = useState(new Date());
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

  const displayedUser = activeUser ?? users[0]?.email ?? null;
  const selectedUser  = users.find((u) => u.email === displayedUser) ?? users[0] ?? null;

  return (
    <div className="min-h-screen" style={{ background: "#181818", color: "#C0C0C0" }}>

      {/* Header */}
      <div style={{ background: "#111", borderBottom: `1px solid ${BORDER}`, padding: "14px 24px" }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div className="font-game text-[10px] tracking-widest" style={{ color: "#484848" }}>COLD CALL OF DUTY</div>
          <div style={{ width: 1, height: 14, background: "#2e2e2e" }} />
          <div className="font-game text-sm tracking-widest" style={{ color: "#FF5500" }}>DASHBOARD</div>
        </div>
        <div className="flex items-center gap-3">
          {loading && <div className="font-game text-[9px] tracking-widest" style={{ color: "#484848" }}>SYNC…</div>}
          <div className="font-game text-[9px] tracking-widest" style={{ color: "#383838" }}>
            Mis à jour {refreshed.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <button
            onClick={load}
            className="font-game text-[9px] tracking-widest px-2.5 py-1.5 rounded-sm"
            style={{ background: "transparent", border: `1px solid ${BORDER}`, color: "#484848", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#C0C0C0"; e.currentTarget.style.borderColor = "#484848"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#484848"; e.currentTarget.style.borderColor = BORDER; }}
          >↻ REFRESH</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">

        {/* Team cards */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(users.length, 4)}, 1fr)` }}>
          {users.map((u, i) => {
            const col   = USER_COLORS[i % USER_COLORS.length];
            const s     = u.state;
            const active = activeUser === u.email || (!activeUser && i === 0);
            const activeProspects = (s.prospects ?? []).filter((p) => !p.archived);
            const rdv    = activeProspects.filter((p) => p.status === "rdv").length;
            const rappel = activeProspects.filter((p) => p.status === "rappel").length;
            const perdu  = activeProspects.filter((p) => p.status === "perdu").length;
            const total  = activeProspects.length;
            return (
              <button
                key={u.email}
                onClick={() => setActiveUser(u.email)}
                className="rounded-sm p-4 text-left transition-all"
                style={{
                  background: active ? `${col}0c` : CARD_BG,
                  border: `1px solid ${active ? col + "50" : BORDER}`,
                  cursor: "pointer",
                }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  {avatar(s.playerName, col)}
                  <div className="min-w-0">
                    <div className="font-game text-sm leading-tight" style={{ color: col }}>{s.playerName.toUpperCase()}</div>
                    <div style={{ color: "#484848", fontSize: "0.65rem", marginTop: 1 }}>
                      actif {relativeTime(u.syncedAt)}
                    </div>
                  </div>
                </div>

                {/* Today stats */}
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

                {/* Pipeline breakdown */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: `${total} leads`, color: "#383838" },
                    { label: `${rdv} RDV`, color: "#1CE400" },
                    { label: `${rappel} relances`, color: "#5DC7E5" },
                    { label: `${perdu} perdus`, color: "#ef4444" },
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

        {/* Pipeline table for selected user */}
        {selectedUser && (() => {
          const s    = selectedUser.state;
          const col  = USER_COLORS[users.indexOf(selectedUser) % USER_COLORS.length];
          const activeProspects = (s.prospects ?? [])
            .filter((p) => !p.archived)
            .sort((a, b) => {
              const order: ProspectStatus[] = ["rappel", "a_appeler", "rdv", "perdu"];
              return order.indexOf(a.status) - order.indexOf(b.status);
            });

          return (
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col }} />
                  <span className="font-game text-xs tracking-widest" style={{ color: col }}>
                    PIPELINE — {s.playerName.toUpperCase()}
                  </span>
                  <span className="font-game text-[9px]" style={{ color: "#484848" }}>
                    {activeProspects.length} prospects actifs
                  </span>
                </div>
              </div>

              {activeProspects.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#383838", fontSize: "0.8rem" }}>
                  Pipeline vide
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["NOM", "SPÉCIALITÉ", "VILLE", "TÉL", "STATUT", "1er CONTACT", "RAPPEL", "RELANCES", "COMMENTAIRES"].map((h) => (
                          <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: "0.62rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.1em", color: "#484848", borderBottom: `1px solid ${BORDER}`, background: "#181818", whiteSpace: "nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeProspects.map((p, i) => {
                        const cfg = STATUS_CFG[p.status];
                        return (
                          <tr key={p.id} style={{ borderBottom: i < activeProspects.length - 1 ? `1px solid #1e1e1e` : "none", background: i % 2 === 0 ? "#1a1a1a" : "#1c1c1c" }}>
                            <td style={{ padding: "8px 12px", fontSize: "0.8rem", color: "#C0C0C0", whiteSpace: "nowrap", fontWeight: 600 }}>{p.name}</td>
                            <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: "#686868" }}>{p.specialite}</td>
                            <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: "#686868", whiteSpace: "nowrap" }}>{p.ville}</td>
                            <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: "#5DC7E5", whiteSpace: "nowrap" }}>
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
                            <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: "#686868", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.notes || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* Empty state */}
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
