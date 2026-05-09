"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/gameContext";
import { getRank, getNextRank, RANK_MONEY_REWARDS } from "@/lib/gameData";
import { fetchLeaderboard, LeaderboardEntry } from "@/lib/supabase";

const MEDAL = ["🥇", "🥈", "🥉"];

// ── Custom confirm modal ──────────────────────────────────────────────────────

function ConfirmModal({ title, body, confirmLabel = "CONFIRMER", danger = false, onConfirm, onCancel }: {
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(3px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-sm p-5 space-y-4"
        style={{ background: "#232323", border: "1px solid #383838", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="font-game text-sm tracking-wider text-white mb-1">{title}</div>
          <div style={{ color: "#848484", fontSize: "0.8rem", lineHeight: 1.5 }}>{body}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-sm font-game text-xs tracking-wider transition-all active:scale-95"
            style={{ background: "transparent", border: "1px solid #383838", color: "#848484" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#686868"; e.currentTarget.style.color = "#C0C0C0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#383838"; e.currentTarget.style.color = "#848484"; }}
          >
            ANNULER
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-sm font-game text-xs tracking-wider transition-all active:scale-95"
            style={{
              background: danger ? "rgba(239,68,68,0.15)" : "rgba(255,85,0,0.15)",
              border: `1px solid ${danger ? "rgba(239,68,68,0.5)" : "rgba(255,85,0,0.5)"}`,
              color: danger ? "#ef4444" : "#FF5500",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "rgba(239,68,68,0.25)" : "rgba(255,85,0,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = danger ? "rgba(239,68,68,0.15)" : "rgba(255,85,0,0.15)"; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name.split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmt(ms: number): string {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const CARD_BG = "#232323";
const BORDER  = "#383838";

export default function HomeTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { state, dispatch } = useGame();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Session
  let sessionMsLeft = 0, sessionPct = 0, sessionExpired = false;
  if (state.sessionActive && state.sessionStart) {
    const dur      = state.sessionTargetMinutes * 60_000;
    const elapsed  = now - state.sessionStart;
    sessionMsLeft  = Math.max(0, dur - elapsed);
    sessionPct     = Math.min(100, Math.round((elapsed / dur) * 100));
    sessionExpired = elapsed >= dur;
  }

  const rank     = getRank(state.totalBookings);
  const nextRank = getNextRank(state.totalBookings);

  // Progressive daily goal: starts at 20, +10 each week, capped at 80
  const dailyGoal = (() => {
    const firstDay = state.history[0]?.date ?? new Date().toISOString().split("T")[0];
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksSince = Math.floor((Date.now() - new Date(firstDay + "T00:00:00").getTime()) / msPerWeek);
    return Math.min(80, 20 + weeksSince * 10);
  })();
  const goalPct = Math.min(100, Math.round((state.dailyCalls / dailyGoal) * 100));
  const goalMet = state.dailyCalls >= dailyGoal;

  const rankGroupIcon =
    rank.group === "global"   ? "👑" :
    rank.group === "guardian" ? "🛡️" :
    rank.group === "gold"     ? "🏅" : "🥈";

  const rankPct = nextRank
    ? Math.round(((state.totalBookings - rank.minBookings) / (nextRank.minBookings - rank.minBookings)) * 100)
    : 100;

  const nextRankReward = nextRank ? RANK_MONEY_REWARDS[nextRank.name] : null;

  type CallStage = "idle" | "answered_q" | "booked_q" | "relance_q" | "relance_date";
  const [callStage, setCallStage] = useState<CallStage>("idle");
  const [callAnsweredYes, setCallAnsweredYes] = useState(false);
  const [prospectIdx, setProspectIdx] = useState(0);
  const [relanceDate, setRelanceDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [editingNotes,  setEditingNotes]  = useState(false);
  const [notesDraft,    setNotesDraft]    = useState("");
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [timerStart,    setTimerStart]    = useState<number | null>(null);
  const [timerElapsed,  setTimerElapsed]  = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const STATUS_LABEL: Record<string, string> = {
    a_appeler: "À APPELER", rappel: "RAPPEL", rdv: "RDV",
    demo: "DÉMO", vendu: "VENDU", perdu: "PERDU",
  };
  const STATUS_COLOR: Record<string, string> = {
    a_appeler: "#FF5500", rappel: "#5DC7E5", rdv: "#1CE400",
    demo: "#a855f7", vendu: "#f6ad55", perdu: "#ef4444",
  };

  const callableProspects = (state.prospects ?? [])
    .filter((p) => p.status === "a_appeler" || p.status === "rappel")
    .sort((a, b) => {
      if (a.rappelDate && b.rappelDate) return a.rappelDate.localeCompare(b.rappelDate);
      if (a.rappelDate) return -1;
      if (b.rappelDate) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
  const safeIdx = callableProspects.length > 0 ? prospectIdx % callableProspects.length : 0;
  const currentProspect = callableProspects[safeIdx] ?? null;

  // Reset notes edit when prospect changes
  useEffect(() => {
    setEditingNotes(false);
    setNotesDraft(currentProspect?.notes ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx, prospectIdx]);

  function startTimer() {
    const start = Date.now();
    setTimerStart(start);
    setTimerElapsed(0);
    timerRef.current = setInterval(() => {
      setTimerElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
  }
  function stopTimer(): number {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const duration = timerStart ? Math.floor((Date.now() - timerStart) / 1000) : 0;
    setTimerStart(null);
    setTimerElapsed(0);
    return duration;
  }
  function fmtTimer(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  function resetCallFlow() {
    setCallStage("idle");
    setCallAnsweredYes(false);
  }

  function handleNon() {
    dispatch({ type: "LOG_CALL" });
    if (currentProspect) dispatch({ type: "UPDATE_PROSPECT", id: currentProspect.id, changes: { reponse: "non" } });
    setCallAnsweredYes(false);
    setCallStage("relance_q");
  }
  function handleOui() {
    setCallAnsweredYes(true);
    setCallStage("booked_q");
    startTimer();
  }
  function handleBooked() {
    const dur = stopTimer();
    dispatch({ type: "LOG_CALL_BOOKING" });
    if (currentProspect) dispatch({ type: "UPDATE_PROSPECT", id: currentProspect.id, changes: { status: "rdv", reponse: "rdv", callDuration: dur } });
    setProspectIdx((i) => i + 1);
    resetCallFlow();
  }
  function handleNotBooked() {
    dispatch({ type: "LOG_CALL_YES" });
    if (currentProspect) dispatch({ type: "UPDATE_PROSPECT", id: currentProspect.id, changes: { reponse: "oui_non_booké" } });
    setCallStage("relance_q");
  }
  function handleRelanceOui() { setCallStage("relance_date"); }
  function handleRelanceNon() {
    const dur = stopTimer();
    if (currentProspect) dispatch({ type: "UPDATE_PROSPECT", id: currentProspect.id, changes: { status: "perdu", callDuration: dur || undefined } });
    setProspectIdx((i) => i + 1);
    resetCallFlow();
  }
  function handleRelanceConfirm() {
    const dur = stopTimer();
    if (currentProspect) dispatch({
      type: "UPDATE_PROSPECT",
      id: currentProspect.id,
      changes: {
        status: "rappel",
        rappelDate: relanceDate,
        relanceCount: (currentProspect.relanceCount ?? 0) + 1,
        callDuration: dur || undefined,
      },
    });
    setProspectIdx((i) => i + 1);
    resetCallFlow();
  }

  function handlePerdreDefinitif() {
    if (!currentProspect) return;
    setConfirmOpen(true);
  }

  function confirmPerdre() {
    if (!currentProspect) return;
    dispatch({ type: "UPDATE_PROSPECT", id: currentProspect.id, changes: { status: "perdu" } });
    setProspectIdx((i) => i + 1);
    resetCallFlow();
    setConfirmOpen(false);
  }

  const totalCallsYes = state.totalCallsYes ?? 0;
  const tauxReponse    = state.totalCalls > 0 ? Math.round((totalCallsYes / state.totalCalls) * 100) : 0;
  const tauxConversion = state.totalCalls > 0 ? Math.round((state.totalBookings / state.totalCalls) * 100) : 0;

  const [lbEntries, setLbEntries] = useState<LeaderboardEntry[]>([]);
  useEffect(() => {
    fetchLeaderboard().then(setLbEntries).catch(() => {});
  }, []);

  // End-of-month countdown
  const endOfMonth = (() => {
    const d = new Date(now);
    return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  })();
  const msLeft = endOfMonth - now;
  const daysLeft  = Math.floor(msLeft / 86_400_000);
  const hoursLeft = Math.floor((msLeft % 86_400_000) / 3_600_000);

  const myEmail = state.playerEmail;
  const myOnLb  = lbEntries.some((e) => e.email === myEmail || e.name === state.playerName);
  const localEntry: LeaderboardEntry | null = !myOnLb && state.playerName
    ? { email: myEmail, name: state.playerName, totalXP: 0, totalCalls: state.totalCalls, totalBookings: state.totalBookings, currentStreak: state.currentStreak, totalSales: state.totalSales, updatedAt: new Date().toISOString() }
    : null;
  const lbSorted = [...lbEntries, ...(localEntry ? [localEntry] : [])]
    .sort((a, b) => b.totalBookings - a.totalBookings);
  const myLbPos = lbSorted.findIndex((e) => e.email === myEmail || e.name === state.playerName) + 1;

  return (
    <div className="max-w-4xl mx-auto">

      {/* Custom confirm modal */}
      {confirmOpen && currentProspect && (
        <ConfirmModal
          title="PERDRE DÉFINITIVEMENT ?"
          body={`${currentProspect.name} sera marqué comme perdu et ne réapparaîtra plus dans la file d'appels.`}
          confirmLabel="PERDRE"
          danger
          onConfirm={confirmPerdre}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <div className="lg:grid lg:gap-4" style={{ gridTemplateColumns: "1fr 260px" } as React.CSSProperties}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="space-y-3">

          {/* ── KPI row ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2">
            {([
              { label: "Calls",  value: state.dailyCalls,         sub: `Total: ${state.totalCalls}`,      color: "#FF5500", icon: "📞" },
              { label: "RDV",    value: state.dailyBookings,       sub: `Total: ${state.totalBookings}`,   color: "#1CE400", icon: "🎯" },
              { label: "Streak", value: `${state.currentStreak}J`, sub: `Record: ${state.longestStreak}j`, color: "#5DC7E5", icon: "🔥" },
            ] as const).map((c) => (
              <div
                key={c.label}
                className="rounded-sm p-3 flex flex-col gap-1"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>
                    {c.label.toUpperCase()}
                  </span>
                  <span style={{ fontSize: "0.75rem" }}>{c.icon}</span>
                </div>
                <div className="font-game text-2xl sm:text-3xl stat-value leading-none" style={{ color: c.color }}>
                  {c.value}
                </div>
                <div style={{ color: "#848484", fontSize: "0.68rem" }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Daily goal ──────────────────────────────────────────────── */}
          <div
            className="rounded-sm px-4 py-3"
            style={{
              background: CARD_BG,
              border: `1px solid ${goalMet ? "rgba(28,228,0,0.4)" : BORDER}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div>
                  <span className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>
                    OBJECTIF JOURNALIER
                  </span>
                  {dailyGoal < 80 && (
                    <span className="font-game text-[9px] ml-2" style={{ color: "#484848" }}>
                      → {dailyGoal + 10} sem. prochaine
                    </span>
                  )}
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate("scraper")}
                    className="font-game text-[9px] tracking-wider rounded-sm px-2 py-1 transition-all active:scale-95"
                    style={{ background: "#1a1a1a", border: "1px solid #383838", color: "#848484", whiteSpace: "nowrap" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF5500"; e.currentTarget.style.color = "#FF5500"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#383838"; e.currentTarget.style.color = "#848484"; }}
                  >
                    🔫 RECHARGER
                  </button>
                )}
              </div>
              <span className="font-game text-xs" style={{ color: goalMet ? "#1CE400" : "#C0C0C0" }}>
                {goalMet ? "✅ OBJECTIF ATTEINT" : `${state.dailyCalls} / ${dailyGoal} CALLS`}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#383838" }}>
              <div
                className="h-full rounded-full progress-bar"
                style={{
                  width: `${goalPct}%`,
                  background: goalMet
                    ? "linear-gradient(90deg,#15803d,#22c55e)"
                    : "linear-gradient(90deg,#CC4400,#FF5500)",
                  boxShadow: goalMet
                    ? "0 0 6px rgba(34,197,94,0.5)"
                    : "0 0 6px rgba(255,85,0,0.4)",
                }}
              />
            </div>
          </div>

          {/* ── Call flow ───────────────────────────────────────────────── */}
          <div
            className="rounded-sm p-4"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            {/* Prospect card — always visible */}
            {currentProspect ? (
              <div className="mb-3">
                {/* Header row */}
                <div
                  className="rounded-sm p-3 flex items-center justify-between gap-2"
                  style={{ background: "#1A1A1A", border: `1px solid ${STATUS_COLOR[currentProspect.status] ?? BORDER}30` }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-sm flex items-center justify-center font-game text-sm flex-shrink-0"
                      style={{ background: `${STATUS_COLOR[currentProspect.status] ?? "#848484"}18`, border: `1px solid ${STATUS_COLOR[currentProspect.status] ?? BORDER}40`, color: STATUS_COLOR[currentProspect.status] ?? "#848484" }}
                    >
                      {currentProspect.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-game text-sm text-white leading-tight truncate">{currentProspect.name}</div>
                      <div style={{ color: "#848484", fontSize: "0.65rem", marginTop: "1px" }}>
                        {[currentProspect.specialite, currentProspect.ville].filter(Boolean).join(" · ")}
                        {currentProspect.rappelDate && (
                          <span style={{ color: "#5DC7E5", marginLeft: "6px" }}>📅 {currentProspect.rappelDate}</span>
                        )}
                      </div>
                      {currentProspect.phone && (
                        <a
                          href={`tel:${currentProspect.phone.replace(/\s/g, "")}`}
                          style={{ color: "#60a5fa", fontSize: "0.68rem", textDecoration: "none", display: "block", marginTop: "2px" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#93c5fd"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#60a5fa"; }}
                        >
                          📞 {currentProspect.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Relance count badge */}
                    {(currentProspect.relanceCount ?? 0) > 0 && (
                      <span
                        className="font-game text-[9px] px-1.5 py-0.5 rounded-sm"
                        style={{ background: "rgba(93,199,229,0.12)", color: "#5DC7E5", border: "1px solid rgba(93,199,229,0.3)" }}
                        title="Nombre de relances"
                      >
                        🔄 {currentProspect.relanceCount}
                      </span>
                    )}

                    {/* Status badge */}
                    <span
                      className="font-game text-[9px] tracking-widest px-1.5 py-0.5 rounded-sm"
                      style={{ background: `${STATUS_COLOR[currentProspect.status] ?? "#848484"}18`, color: STATUS_COLOR[currentProspect.status] ?? "#848484", border: `1px solid ${STATUS_COLOR[currentProspect.status] ?? "#848484"}30` }}
                    >
                      {STATUS_LABEL[currentProspect.status] ?? currentProspect.status}
                    </span>

                    {callStage === "idle" && (
                      <div className="flex items-center gap-1">
                        {/* Perdre définitivement */}
                        <button
                          onClick={handlePerdreDefinitif}
                          className="font-game text-xs px-2 py-1 rounded-sm transition-colors"
                          style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                          title="Perdre définitivement"
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          ✕
                        </button>

                        {/* Prev / Next */}
                        {callableProspects.length > 1 && (
                          <>
                            <button
                              onClick={() => setProspectIdx((i) => (i - 1 + callableProspects.length) % callableProspects.length)}
                              className="font-game text-xs px-2 py-1 rounded-sm transition-colors"
                              style={{ color: "#848484", border: "1px solid #383838" }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "#C0C0C0"; e.currentTarget.style.borderColor = "#FF5500"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "#848484"; e.currentTarget.style.borderColor = "#383838"; }}
                            >
                              ←
                            </button>
                            <button
                              onClick={() => setProspectIdx((i) => i + 1)}
                              className="font-game text-xs px-2 py-1 rounded-sm transition-colors"
                              style={{ color: "#848484", border: "1px solid #383838" }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "#C0C0C0"; e.currentTarget.style.borderColor = "#FF5500"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "#848484"; e.currentTarget.style.borderColor = "#383838"; }}
                            >
                              →
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes field */}
                <div
                  className="rounded-sm mt-1.5"
                  style={{ background: "#1A1A1A", border: "1px solid #2D2D2D" }}
                >
                  {editingNotes ? (
                    <textarea
                      autoFocus
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      onBlur={() => {
                        dispatch({ type: "UPDATE_PROSPECT", id: currentProspect.id, changes: { notes: notesDraft } });
                        setEditingNotes(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") { setNotesDraft(currentProspect.notes ?? ""); setEditingNotes(false); }
                      }}
                      rows={2}
                      style={{
                        width: "100%", background: "transparent", border: "none", outline: "none",
                        color: "#D0D0D0", fontSize: "0.75rem", padding: "8px 10px",
                        resize: "none", lineHeight: 1.5,
                      }}
                      placeholder="Ajouter un commentaire..."
                    />
                  ) : (
                    <div
                      onClick={() => { setNotesDraft(currentProspect.notes ?? ""); setEditingNotes(true); }}
                      style={{
                        padding: "8px 10px", cursor: "text", fontSize: "0.75rem", lineHeight: 1.5,
                        color: currentProspect.notes ? "#848484" : "#383838",
                        minHeight: "36px",
                      }}
                    >
                      {currentProspect.notes || "Ajouter un commentaire..."}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="rounded-sm p-3 mb-3 text-center"
                style={{ background: "#1A1A1A", border: "1px solid #2D2D2D" }}
              >
                <div style={{ color: "#484848", fontSize: "0.7rem" }}>Aucun prospect à appeler — ajoute-en dans Script</div>
              </div>
            )}

            {/* ── Step machine ── */}
            {callStage === "idle" && (
              <button
                onClick={() => setCallStage("answered_q")}
                className="w-full py-6 rounded-sm font-game text-base tracking-widest transition-all duration-150 active:scale-95 btn-pulse"
                style={{ background: "#FF5500", border: "1px solid #FF5500", color: "#FFF" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#FF6B1A"; e.currentTarget.style.borderColor = "#FF6B1A"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#FF5500"; e.currentTarget.style.borderColor = "#FF5500"; }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "6px" }}>📞</div>
                CALL LANCÉ
              </button>
            )}

            {callStage === "answered_q" && (
              <div>
                <div className="font-game text-[10px] tracking-widest text-center mb-3" style={{ color: "#848484" }}>
                  LA PERSONNE A-T-ELLE RÉPONDU ?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleNon}
                    className="py-6 rounded-sm font-game text-sm tracking-wide transition-all active:scale-95"
                    style={{ background: "rgba(255,85,0,0.1)", border: "1px solid rgba(255,85,0,0.4)", color: "#FF5500" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,85,0,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,85,0,0.1)"; }}
                  >
                    <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>👎</div>NON
                  </button>
                  <button onClick={handleOui}
                    className="py-6 rounded-sm font-game text-sm tracking-wide transition-all active:scale-95"
                    style={{ background: "rgba(93,199,229,0.1)", border: "1px solid rgba(93,199,229,0.4)", color: "#5DC7E5" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.1)"; }}
                  >
                    <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>👍</div>OUI
                  </button>
                </div>
              </div>
            )}

            {callStage === "booked_q" && (
              <div>
                {/* Live timer */}
                <div className="text-center mb-2">
                  <span
                    className="font-game text-2xl tracking-widest"
                    style={{ color: "#FF5500", fontVariantNumeric: "tabular-nums" }}
                  >
                    {fmtTimer(timerElapsed)}
                  </span>
                </div>
                <div className="font-game text-[10px] tracking-widest text-center mb-3" style={{ color: "#848484" }}>
                  LE CALL EST BOOKÉ ?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleBooked}
                    className="py-6 rounded-sm font-game text-sm tracking-wide transition-all active:scale-95"
                    style={{ background: "rgba(28,228,0,0.1)", border: "1px solid rgba(28,228,0,0.4)", color: "#1CE400" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(28,228,0,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(28,228,0,0.1)"; }}
                  >
                    <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>🎯</div>BOOKÉ
                  </button>
                  <button onClick={handleNotBooked}
                    className="py-6 rounded-sm font-game text-sm tracking-wide transition-all active:scale-95"
                    style={{ background: "rgba(255,85,0,0.1)", border: "1px solid rgba(255,85,0,0.4)", color: "#FF5500" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,85,0,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,85,0,0.1)"; }}
                  >
                    <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>❌</div>PAS BOOKÉ
                  </button>
                </div>
              </div>
            )}

            {callStage === "relance_q" && (
              <div>
                {timerStart && (
                  <div className="text-center mb-2">
                    <span className="font-game text-xl tracking-widest" style={{ color: "#848484", fontVariantNumeric: "tabular-nums" }}>
                      {fmtTimer(timerElapsed)}
                    </span>
                  </div>
                )}
                <div className="font-game text-[10px] tracking-widest text-center mb-3" style={{ color: "#848484" }}>
                  ON LE RELANCE ?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleRelanceOui}
                    className="py-6 rounded-sm font-game text-sm tracking-wide transition-all active:scale-95"
                    style={{ background: "rgba(93,199,229,0.1)", border: "1px solid rgba(93,199,229,0.4)", color: "#5DC7E5" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.1)"; }}
                  >
                    <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>🔄</div>OUI
                  </button>
                  <button onClick={handleRelanceNon}
                    className="py-6 rounded-sm font-game text-sm tracking-wide transition-all active:scale-95"
                    style={{ background: "#1A1A1A", border: "1px solid #383838", color: "#848484" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#2D2D2D"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1A1A"; }}
                  >
                    <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>🗑</div>NON
                  </button>
                </div>
              </div>
            )}

            {callStage === "relance_date" && (
              <div>
                <div className="font-game text-[10px] tracking-widest text-center mb-3" style={{ color: "#848484" }}>
                  QUAND LE RELANCER ?
                </div>
                <input
                  type="date"
                  value={relanceDate}
                  onChange={(e) => setRelanceDate(e.target.value)}
                  className="w-full mb-3 rounded-sm px-3 py-2.5 font-game text-sm"
                  style={{ background: "#1A1A1A", border: "1px solid #5DC7E5", color: "#F0F0F0", outline: "none" }}
                />
                <button onClick={handleRelanceConfirm}
                  className="w-full py-3 rounded-sm font-game text-sm tracking-widest transition-all active:scale-95"
                  style={{ background: "#5DC7E5", border: "1px solid #5DC7E5", color: "#000" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#7DD8EC"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#5DC7E5"; }}
                >
                  CONFIRMER
                </button>
              </div>
            )}

            {/* Cancel + undo */}
            <div className="flex items-center justify-between mt-2">
              {callStage !== "idle" ? (
                <button onClick={resetCallFlow}
                  className="text-xs transition-colors py-1"
                  style={{ color: "#484848" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#848484"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#484848"; }}
                >
                  ← annuler
                </button>
              ) : (
                <button
                  onClick={() => dispatch({ type: "UNDO_CALL" })}
                  disabled={state.dailyCalls === 0}
                  className="text-xs transition-colors py-1 disabled:opacity-20 disabled:cursor-not-allowed"
                  style={{ color: "#848484" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#C0C0C0"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#848484"; }}
                >
                  ↩ Annuler le dernier call
                </button>
              )}
              <span style={{ color: "#484848", fontSize: "0.65rem" }}>
                {callableProspects.length} prospect{callableProspects.length !== 1 ? "s" : ""} en attente
              </span>
            </div>
          </div>

          {/* ── Session ─────────────────────────────────────────────────── */}
          <div
            className="rounded-sm p-4"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            <div className="font-game text-[10px] tracking-widest mb-3" style={{ color: "#848484" }}>
              SESSION DE TRAVAIL
            </div>

            {!state.sessionActive ? (
              <div>
                <p style={{ color: "#848484", fontSize: "0.75rem", marginBottom: "0.6rem" }}>
                  Reste focus pendant la session — timer visible pour tenir le rythme.
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { minutes: 30,  label: "30 MIN" },
                    { minutes: 60,  label: "1H" },
                    { minutes: 120, label: "2H" },
                  ].map((opt) => (
                    <button
                      key={opt.minutes}
                      onClick={() => dispatch({ type: "START_SESSION", minutes: opt.minutes })}
                      className="py-3 rounded-sm font-game text-xs tracking-wider transition-all duration-150 active:scale-95"
                      style={{ background: "#2D2D2D", border: "1px solid #383838", color: "#C0C0C0" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#FF5500";
                        e.currentTarget.style.color = "#FF5500";
                        e.currentTarget.style.background = "rgba(255,85,0,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#383838";
                        e.currentTarget.style.color = "#C0C0C0";
                        e.currentTarget.style.background = "#2D2D2D";
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className={`font-game text-3xl leading-none ${sessionExpired ? "session-expired" : "text-white"}`}>
                      {sessionExpired ? "TERMINÉ!" : fmt(sessionMsLeft)}
                    </div>
                    <div style={{ color: "#848484", fontSize: "0.65rem", marginTop: "3px" }}>
                      {state.sessionTargetMinutes}min · {state.sessionCalls} calls · {state.sessionBookings} RDV
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch({ type: "END_SESSION" })}
                    className="px-3 py-1.5 rounded-sm font-game text-xs tracking-wider transition-all active:scale-95"
                    style={{
                      background: sessionExpired ? "rgba(28,228,0,0.1)" : "rgba(255,85,0,0.1)",
                      border:     sessionExpired ? "1px solid rgba(28,228,0,0.4)" : "1px solid rgba(255,85,0,0.4)",
                      color:      sessionExpired ? "#1CE400" : "#FF5500",
                    }}
                  >
                    {sessionExpired ? "✅ CLORE" : "⏹ STOP"}
                  </button>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#383838" }}>
                  <div
                    className="h-full rounded-full progress-bar"
                    style={{
                      width: `${sessionPct}%`,
                      background: sessionExpired
                        ? "linear-gradient(90deg,#15803d,#22c55e)"
                        : "linear-gradient(90deg,#7c3aed,#8b5cf6)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
        <div className="mt-3 lg:mt-0 space-y-3">

          {/* Rank card */}
          <div
            className="rounded-sm p-4 relative overflow-hidden"
            style={{ background: CARD_BG, border: `1px solid ${rank.color}40` }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top right, ${rank.color}0d 0%, transparent 65%)` }}
            />

            <div className="relative z-10">
              <div className="font-game text-[10px] tracking-widest mb-3" style={{ color: "#848484" }}>
                RANG ACTUEL
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-sm flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${rank.color}18`, border: `1px solid ${rank.color}50` }}
                >
                  {rankGroupIcon}
                </div>
                <div>
                  <div className="font-game text-base leading-tight" style={{ color: rank.color }}>
                    {rank.name}
                  </div>
                  <div style={{ color: "#848484", fontSize: "0.68rem", marginTop: "2px" }}>
                    {state.totalBookings} RDV au total
                  </div>
                </div>
              </div>

              {nextRank ? (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ color: "#848484", fontSize: "0.65rem" }}>
                      Prochain : <span style={{ color: nextRank.color }}>{nextRank.name}</span>
                    </span>
                    <span className="font-game text-xs" style={{ color: rank.color }}>
                      {rankPct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "#383838" }}>
                    <div
                      className="h-full rounded-full progress-bar"
                      style={{ width: `${rankPct}%`, background: rank.color }}
                    />
                  </div>
                  <div style={{ color: "#686868", fontSize: "0.6rem" }}>
                    encore {nextRank.minBookings - state.totalBookings} RDV
                  </div>

                  {(nextRankReward || nextRank.group === "global") && (
                    <div
                      className="mt-3 px-3 py-2 rounded-sm"
                      style={{ background: `${nextRank.color}0d`, border: `1px solid ${nextRank.color}30` }}
                    >
                      <div className="font-game text-[9px] tracking-widest mb-0.5" style={{ color: "#848484" }}>
                        RÉCOMPENSE AU RANG SUIVANT
                      </div>
                      <div className="font-game text-sm" style={{ color: nextRank.group === "global" ? "#f6ad55" : nextRank.color }}>
                        {nextRank.group === "global" ? "🎁 MacBook Pro" : `💶 +${nextRankReward}€`}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="px-3 py-2 rounded-sm text-center"
                  style={{ background: "rgba(104,211,145,0.08)", border: "1px solid rgba(104,211,145,0.3)" }}
                >
                  <div className="font-game text-xs tracking-widest" style={{ color: "#68d391" }}>
                    👑 RANG MAXIMUM
                  </div>
                </div>
              )}

              <div className="my-4" style={{ height: "1px", background: "#383838" }} />

              <div className="flex items-center justify-between">
                <span className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>
                  GAINS DÉBLOQUÉS
                </span>
                <span className="font-game text-sm" style={{ color: "#1CE400" }}>
                  💶 {state.totalMoneyEarned}€
                </span>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          {state.totalCalls > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {/* Taux de réponse */}
              <div
                className="rounded-sm px-3 py-3"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
              >
                <div className="font-game text-[9px] tracking-widest mb-1.5" style={{ color: "#848484" }}>
                  TX. RÉPONSE
                </div>
                <div className="font-game text-2xl leading-none" style={{ color: "#5DC7E5" }}>
                  {tauxReponse}%
                </div>
                <div style={{ color: "#686868", fontSize: "0.6rem", marginTop: "3px" }}>
                  {totalCallsYes} OUI / {state.totalCalls} calls
                </div>
              </div>

              {/* Taux de conversion */}
              <div
                className="rounded-sm px-3 py-3"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
              >
                <div className="font-game text-[9px] tracking-widest mb-1.5" style={{ color: "#848484" }}>
                  TX. CONVERSION
                </div>
                <div className="font-game text-2xl leading-none" style={{ color: "#FF5500" }}>
                  {tauxConversion}%
                </div>
                <div style={{ color: "#686868", fontSize: "0.6rem", marginTop: "3px" }}>
                  {state.totalBookings} RDV / {state.totalCalls} calls
                </div>
              </div>
            </div>
          )}

          {/* Mini-leaderboard */}
          {lbSorted.length > 0 && (
            <div
              className="rounded-sm overflow-hidden"
              style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid #383838" }}>
                <span className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>
                  CLASSEMENT
                </span>
                {myLbPos > 0 && (
                  <span className="font-game text-[10px]" style={{ color: "#FF5500" }}>
                    #{myLbPos}
                  </span>
                )}
              </div>

              {lbSorted.slice(0, 5).map((entry, idx) => {
                const isSelf = entry.email === myEmail || entry.name === state.playerName;
                const entryRankColor = getRank(entry.totalBookings).color;
                return (
                  <div
                    key={entry.email || entry.name}
                    className="flex items-center gap-2 px-3 py-2"
                    style={{
                      borderBottom: idx < Math.min(lbSorted.length, 5) - 1 ? "1px solid #2D2D2D" : "none",
                      background: isSelf ? "rgba(255,85,0,0.06)" : "transparent",
                    }}
                  >
                    <span className="font-game text-xs w-5 text-center flex-shrink-0" style={{ color: idx < 3 ? "#FF5500" : "#686868" }}>
                      {idx < 3 ? MEDAL[idx] : `#${idx + 1}`}
                    </span>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-game text-[9px] flex-shrink-0"
                      style={{ background: `${entryRankColor}18`, border: `1.5px solid ${entryRankColor}`, color: entryRankColor }}
                    >
                      {getInitials(entry.name)}
                    </div>
                    <span
                      className="font-game text-[10px] truncate flex-1"
                      style={{ color: isSelf ? "#FF5500" : "#C0C0C0" }}
                    >
                      {entry.name.split(" ")[0]}
                    </span>
                    <span className="font-game text-[10px] flex-shrink-0" style={{ color: "#1CE400" }}>
                      {entry.totalBookings} RDV
                    </span>
                  </div>
                );
              })}

              {/* Show self if outside top 5 */}
              {myLbPos > 5 && localEntry === null && (() => {
                const selfEntry = lbSorted[myLbPos - 1];
                return selfEntry ? (
                  <>
                    <div className="px-3 py-1 text-center font-game text-[9px]" style={{ color: "#484848", borderTop: "1px solid #2D2D2D" }}>
                      ···
                    </div>
                    <div
                      className="flex items-center gap-2 px-3 py-2"
                      style={{ background: "rgba(255,85,0,0.06)" }}
                    >
                      <span className="font-game text-xs w-5 text-center flex-shrink-0" style={{ color: "#848484" }}>
                        #{myLbPos}
                      </span>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-game text-[9px] flex-shrink-0"
                        style={{ background: `${getRank(selfEntry.totalBookings).color}18`, border: `1.5px solid ${getRank(selfEntry.totalBookings).color}`, color: getRank(selfEntry.totalBookings).color }}
                      >
                        {getInitials(selfEntry.name)}
                      </div>
                      <span className="font-game text-[10px] truncate flex-1" style={{ color: "#FF5500" }}>
                        {selfEntry.name.split(" ")[0]}
                      </span>
                      <span className="font-game text-[10px] flex-shrink-0" style={{ color: "#1CE400" }}>
                        {selfEntry.totalBookings} RDV
                      </span>
                    </div>
                  </>
                ) : null;
              })()}
            </div>
          )}

          {/* End-of-month countdown */}
          <div
            className="rounded-sm px-4 py-3"
            style={{ background: CARD_BG, border: "1px solid rgba(246,173,85,0.3)" }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-game text-[10px] tracking-widest" style={{ color: "#848484" }}>
                FIN DU MOIS
              </span>
              <span className="font-game text-[10px]" style={{ color: "#f6ad55" }}>
                🏆 BONUS 50€
              </span>
            </div>
            <div className="font-game text-xl leading-none" style={{ color: "#f6ad55" }}>
              {daysLeft}j {hoursLeft}h
            </div>
            <div style={{ color: "#686868", fontSize: "0.6rem", marginTop: "3px" }}>
              Le #1 du classement remporte 50€ bonus
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
