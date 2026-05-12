"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/gameContext";

const BORDER = "#383838";
const STATUS_LABEL: Record<string, string> = {
  a_appeler: "À APPELER", rappel: "RAPPEL", rdv: "RDV", perdu: "PERDU",
};
const STATUS_COLOR: Record<string, string> = {
  a_appeler: "#FF5500", rappel: "#5DC7E5", rdv: "#1CE400", perdu: "#ef4444",
};

function ConfirmModal({ title, body, confirmLabel = "CONFIRMER", onConfirm, onCancel }: {
  title: string; body: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
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
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-sm font-game text-xs tracking-wider"
            style={{ background: "transparent", border: "1px solid #383838", color: "#848484" }}
          >ANNULER</button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-sm font-game text-xs tracking-wider"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.5)", color: "#ef4444" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const MIN_W = 280;
const MAX_W = 680;
const MIN_H = 120;

export default function FloatingCallWidget({ onNavigate }: { onNavigate?: (target: string) => void }) {
  const { state, dispatch } = useGame();

  // ── Position, size & UI state ─────────────────────────────────────────────
  const [pos,       setPos]       = useState({ x: -1, y: -1 }); // -1 = init pending
  const [size,      setSize]      = useState({ w: 360, h: -1 }); // -1 h = auto
  const [minimized, setMinimized] = useState(false);
  const dragging   = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizing   = useRef(false);
  const resizeStart = useRef({ mx: 0, my: 0, w: 360, h: 0, x: 0, y: 0 });

  // Set default position bottom-right after mount
  useEffect(() => {
    setPos({ x: window.innerWidth - 380, y: window.innerHeight - 520 });
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (dragging.current) {
        setPos({
          x: Math.max(0, Math.min(window.innerWidth  - size.w, e.clientX - dragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - 60,      e.clientY - dragOffset.current.y)),
        });
      }
      if (resizing.current) {
        const dx = e.clientX - resizeStart.current.mx;
        const dy = e.clientY - resizeStart.current.my;
        setSize({
          w: Math.max(MIN_W, Math.min(MAX_W, resizeStart.current.w + dx)),
          h: Math.max(MIN_H, resizeStart.current.h + dy),
        });
      }
    }
    function onUp() { dragging.current = false; resizing.current = false; }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
  }, [size.w]);

  function startDrag(e: React.MouseEvent) {
    dragging.current   = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }

  function startResize(e: React.MouseEvent) {
    const el = (e.currentTarget as HTMLElement).closest("[data-widget]") as HTMLElement | null;
    resizing.current    = true;
    resizeStart.current = {
      mx: e.clientX,
      my: e.clientY,
      w:  size.w,
      h:  el ? el.offsetHeight : (size.h > 0 ? size.h : 400),
      x:  pos.x,
      y:  pos.y,
    };
    e.preventDefault();
    e.stopPropagation();
  }

  // ── Call flow state ───────────────────────────────────────────────────────
  type CallStage = "idle" | "answered_q" | "booked_q" | "pourquoi_q" | "relance_q" | "relance_date";
  const [callStage,      setCallStage]      = useState<CallStage>("idle");
  const [callAnsweredYes, setCallAnsweredYes] = useState(false);
  const [prospectIdx,    setProspectIdx]    = useState(0);
  const [relanceDate,    setRelanceDate]    = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft,   setNotesDraft]   = useState("");
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [timerStart,   setTimerStart]   = useState<number | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const callableProspects = (state.prospects ?? [])
    .filter((p) => p.status === "a_appeler" || p.status === "rappel")
    .sort((a, b) => {
      if (a.rappelDate && b.rappelDate) return a.rappelDate.localeCompare(b.rappelDate);
      if (a.rappelDate) return -1;
      if (b.rappelDate) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
  const safeIdx          = callableProspects.length > 0 ? prospectIdx % callableProspects.length : 0;
  const currentProspect  = callableProspects[safeIdx] ?? null;

  useEffect(() => {
    setEditingNotes(false);
    setNotesDraft(currentProspect?.notes ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx, prospectIdx]);

  function startTimer() {
    const s = Date.now();
    setTimerStart(s);
    setTimerElapsed(0);
    timerRef.current = setInterval(() => setTimerElapsed(Math.floor((Date.now() - s) / 1000)), 1000);
  }
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const dur = timerStart ? Math.floor((Date.now() - timerStart) / 1000) : 0;
    setTimerStart(null); setTimerElapsed(0);
    return dur;
  }
  function fmtTimer(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }
  function resetCallFlow() { setCallStage("idle"); setCallAnsweredYes(false); }

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
    if (currentProspect && !currentProspect.premierContact) {
      const today = new Date().toISOString().split("T")[0];
      dispatch({ type: "UPDATE_PROSPECT", id: currentProspect.id, changes: { premierContact: today } });
    }
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
    setCallStage("pourquoi_q");
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
      changes: { status: "rappel", rappelDate: relanceDate, relanceCount: (currentProspect.relanceCount ?? 0) + 1, callDuration: dur || undefined },
    });
    setProspectIdx((i) => i + 1);
    resetCallFlow();
  }
  function confirmPerdre() {
    if (!currentProspect) return;
    dispatch({ type: "UPDATE_PROSPECT", id: currentProspect.id, changes: { status: "perdu" } });
    setProspectIdx((i) => i + 1);
    resetCallFlow();
    setConfirmOpen(false);
  }

  if (!state.playerName || pos.x === -1) return null;

  const col = currentProspect ? (STATUS_COLOR[currentProspect.status] ?? "#848484") : "#FF5500";

  return (
    <>
      {confirmOpen && currentProspect && (
        <ConfirmModal
          title="PERDRE DÉFINITIVEMENT ?"
          body={`${currentProspect.name} sera marqué comme perdu et ne réapparaîtra plus dans la file d'appels.`}
          confirmLabel="PERDRE"
          onConfirm={confirmPerdre}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <div
        data-widget
        style={{
          position:     "fixed",
          left:         pos.x,
          top:          pos.y,
          zIndex:       150,
          width:        size.w,
          height:       minimized ? undefined : (size.h > 0 ? size.h : undefined),
          overflow:     minimized ? "hidden" : "auto",
          boxShadow:    "0 8px 40px rgba(0,0,0,0.6)",
          borderRadius: "4px",
          border:       `1px solid ${callStage !== "idle" ? "rgba(255,85,0,0.5)" : BORDER}`,
          userSelect:   "none",
          display:      "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Drag handle / title bar ─────────────────────────────────────── */}
        <div
          onMouseDown={startDrag}
          style={{
            background:  "#1A1A1A",
            borderBottom: minimized ? "none" : `1px solid ${BORDER}`,
            padding:     "6px 10px",
            cursor:      "grab",
            display:     "flex",
            alignItems:  "center",
            justifyContent: "space-between",
            gap:         "8px",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Status dot */}
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: callStage !== "idle" ? "#FF5500" : "#484848", flexShrink: 0 }} />
            <span className="font-game text-[10px] tracking-widest truncate" style={{ color: callStage !== "idle" ? "#FF5500" : "#848484" }}>
              {currentProspect ? currentProspect.name.toUpperCase() : "AUCUN PROSPECT"}
            </span>
            {currentProspect?.phone && minimized && (
              <a
                href={`tel:${currentProspect.phone.replace(/\s/g, "")}`}
                className="font-game text-[9px]"
                style={{ color: "#60a5fa", textDecoration: "none", flexShrink: 0 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {currentProspect.phone}
              </a>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
            {callStage !== "idle" && (
              <span className="font-game text-[9px] tracking-widest px-1.5 py-0.5 rounded-sm"
                style={{ background: "rgba(255,85,0,0.15)", border: "1px solid rgba(255,85,0,0.4)", color: "#FF5500" }}>
                EN COURS
              </span>
            )}
            <button
              onClick={() => setMinimized((v) => !v)}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors font-game text-[10px]"
              style={{ background: "transparent", border: "1px solid #383838", color: "#848484" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF5500"; e.currentTarget.style.color = "#FF5500"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#383838"; e.currentTarget.style.color = "#848484"; }}
            >
              {minimized ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {/* ── Expanded body ────────────────────────────────────────────────── */}
        {!minimized && (
          <div style={{ background: "#232323", padding: "12px", flex: 1, overflowY: "auto" }}>

            {/* Prospect card */}
            {currentProspect ? (
              <div className="mb-3">
                <div
                  className="rounded-sm p-3 flex items-center justify-between gap-2"
                  style={{ background: "#1A1A1A", border: `1px solid ${col}30` }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-sm flex items-center justify-center font-game text-sm flex-shrink-0"
                      style={{ background: `${col}18`, border: `1px solid ${col}40`, color: col }}
                    >
                      {currentProspect.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      {currentProspect.googleMapsUrl ? (
                        <a
                          href={currentProspect.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-game text-sm leading-tight truncate block"
                          style={{ color: "#FFFFFF", textDecoration: "none" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#FF5500"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#FFFFFF"; }}
                        >
                          {currentProspect.name} <span style={{ fontSize: "0.6rem", opacity: 0.6 }}>↗</span>
                        </a>
                      ) : (
                        <div className="font-game text-sm text-white leading-tight truncate">{currentProspect.name}</div>
                      )}
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
                      {currentProspect.website && (
                        <a
                          href={currentProspect.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#f97316", fontSize: "0.65rem", textDecoration: "none", display: "block", marginTop: "2px", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#fb923c"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#f97316"; }}
                          title={currentProspect.website}
                        >
                          🌐 {currentProspect.website.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(currentProspect.relanceCount ?? 0) > 0 && (
                      <span className="font-game text-[9px] px-1.5 py-0.5 rounded-sm"
                        style={{ background: "rgba(93,199,229,0.12)", color: "#5DC7E5", border: "1px solid rgba(93,199,229,0.3)" }}>
                        🔄 {currentProspect.relanceCount}
                      </span>
                    )}
                    <span className="font-game text-[9px] tracking-widest px-1.5 py-0.5 rounded-sm"
                      style={{ background: `${col}18`, color: col, border: `1px solid ${col}30` }}>
                      {STATUS_LABEL[currentProspect.status] ?? currentProspect.status}
                    </span>
                    {callStage === "idle" && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setConfirmOpen(true)}
                          className="font-game text-xs px-2 py-1 rounded-sm transition-colors"
                          style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", background: "transparent" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          title="Perdre définitivement"
                        >✕</button>
                        {callableProspects.length > 1 && (
                          <>
                            <button
                              onClick={() => {
                                let bestIdx = -1, bestDate = "";
                                callableProspects.forEach((p, i) => {
                                  if (p.premierContact && p.premierContact > bestDate) { bestDate = p.premierContact; bestIdx = i; }
                                });
                                if (bestIdx >= 0) setProspectIdx(bestIdx);
                              }}
                              className="font-game text-[9px] px-2 py-1 rounded-sm transition-colors"
                              style={{ color: "#5DC7E5", border: "1px solid rgba(93,199,229,0.3)", background: "transparent" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.1)"; e.currentTarget.style.borderColor = "#5DC7E5"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(93,199,229,0.3)"; }}
                              title="Reprendre au dernier contact"
                            >↩ REPRENDRE</button>
                            <button onClick={() => setProspectIdx((i) => (i - 1 + callableProspects.length) % callableProspects.length)}
                              className="font-game text-xs px-2 py-1 rounded-sm transition-colors"
                              style={{ color: "#848484", border: "1px solid #383838", background: "transparent" }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF5500"; e.currentTarget.style.color = "#C0C0C0"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#383838"; e.currentTarget.style.color = "#848484"; }}
                            >←</button>
                            <button onClick={() => setProspectIdx((i) => i + 1)}
                              className="font-game text-xs px-2 py-1 rounded-sm transition-colors"
                              style={{ color: "#848484", border: "1px solid #383838", background: "transparent" }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF5500"; e.currentTarget.style.color = "#C0C0C0"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#383838"; e.currentTarget.style.color = "#848484"; }}
                            >→</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="rounded-sm mt-1.5" style={{ background: "#1A1A1A", border: "1px solid #2D2D2D" }}>
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
                        color: "#D0D0D0", fontSize: "0.75rem", padding: "8px 10px", resize: "none", lineHeight: 1.5,
                      }}
                      placeholder="Ajouter un commentaire..."
                    />
                  ) : (
                    <div
                      onClick={() => { setNotesDraft(currentProspect.notes ?? ""); setEditingNotes(true); }}
                      style={{ padding: "8px 10px", cursor: "text", fontSize: "0.75rem", lineHeight: 1.5, color: currentProspect.notes ? "#848484" : "#383838", minHeight: "36px" }}
                    >
                      {currentProspect.notes || "Ajouter un commentaire..."}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-sm p-3 mb-3 text-center" style={{ background: "#1A1A1A", border: "1px solid #2D2D2D" }}>
                <div style={{ color: "#484848", fontSize: "0.7rem" }}>Aucun prospect à appeler</div>
              </div>
            )}

            {/* ── Step machine ── */}
            {callStage === "idle" && (
              callableProspects.length === 0 ? (
                <button
                  onClick={() => onNavigate?.("leads:scraper")}
                  className="w-full py-5 rounded-sm font-game text-sm tracking-widest transition-all active:scale-95"
                  style={{ background: "rgba(93,199,229,0.1)", border: "1px solid rgba(93,199,229,0.4)", color: "#5DC7E5" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.1)"; }}
                >
                  <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>🔫</div>
                  TROUVER DES PROSPECTS
                </button>
              ) : (
                <button
                  onClick={() => setCallStage("answered_q")}
                  className="w-full py-5 rounded-sm font-game text-sm tracking-widest transition-all active:scale-95 btn-pulse"
                  style={{ background: "#FF5500", border: "1px solid #FF5500", color: "#FFF" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#FF6B1A"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FF5500"; }}
                >
                  <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>📞</div>
                  CALL LANCÉ
                </button>
              )
            )}

            {callStage === "answered_q" && (
              <div>
                <div className="font-game text-[10px] tracking-widest text-center mb-3" style={{ color: "#848484" }}>
                  LA PERSONNE A-T-ELLE RÉPONDU ?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleNon}
                    className="py-5 rounded-sm font-game text-sm tracking-wide transition-all active:scale-95"
                    style={{ background: "rgba(255,85,0,0.1)", border: "1px solid rgba(255,85,0,0.4)", color: "#FF5500" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,85,0,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,85,0,0.1)"; }}
                  ><div style={{ fontSize: "1.3rem", marginBottom: "3px" }}>👎</div>NON</button>
                  <button onClick={handleOui}
                    className="py-5 rounded-sm font-game text-sm tracking-wide transition-all active:scale-95"
                    style={{ background: "rgba(93,199,229,0.1)", border: "1px solid rgba(93,199,229,0.4)", color: "#5DC7E5" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.1)"; }}
                  ><div style={{ fontSize: "1.3rem", marginBottom: "3px" }}>👍</div>OUI</button>
                </div>
              </div>
            )}

            {callStage === "booked_q" && (
              <div>
                <div className="text-center mb-2">
                  <span className="font-game text-2xl tracking-widest" style={{ color: "#FF5500", fontVariantNumeric: "tabular-nums" }}>
                    {fmtTimer(timerElapsed)}
                  </span>
                </div>
                <div className="font-game text-[10px] tracking-widest text-center mb-3" style={{ color: "#848484" }}>
                  LE CALL EST BOOKÉ ?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleBooked}
                    className="py-5 rounded-sm font-game text-sm tracking-wide transition-all active:scale-95"
                    style={{ background: "rgba(28,228,0,0.1)", border: "1px solid rgba(28,228,0,0.4)", color: "#1CE400" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(28,228,0,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(28,228,0,0.1)"; }}
                  ><div style={{ fontSize: "1.3rem", marginBottom: "3px" }}>🎯</div>BOOKÉ</button>
                  <button onClick={handleNotBooked}
                    className="py-5 rounded-sm font-game text-sm tracking-wide transition-all active:scale-95"
                    style={{ background: "rgba(255,85,0,0.1)", border: "1px solid rgba(255,85,0,0.4)", color: "#FF5500" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,85,0,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,85,0,0.1)"; }}
                  ><div style={{ fontSize: "1.3rem", marginBottom: "3px" }}>❌</div>PAS BOOKÉ</button>
                </div>
              </div>
            )}

            {callStage === "pourquoi_q" && (
              <div>
                <div className="font-game text-[10px] tracking-widest text-center mb-3" style={{ color: "#848484" }}>
                  POURQUOI PAS BOOKÉ ?
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {["Pas intéressé", "Déjà un prestataire", "Pas le bon moment", "Budget insuffisant"].map((reason) => (
                    <button key={reason}
                      onClick={() => {
                        if (currentProspect) dispatch({ type: "UPDATE_PROSPECT", id: currentProspect.id, changes: { pourquoi: reason } });
                        setCallStage("relance_q");
                      }}
                      className="py-3 rounded-sm font-game text-xs tracking-wide transition-all active:scale-95"
                      style={{ background: "#1A1A1A", border: "1px solid #383838", color: "#848484" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF5500"; e.currentTarget.style.color = "#FF5500"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#383838"; e.currentTarget.style.color = "#848484"; }}
                    >{reason}</button>
                  ))}
                </div>
                <button onClick={() => setCallStage("relance_q")}
                  className="w-full py-2 rounded-sm text-xs transition-colors"
                  style={{ color: "#484848", background: "transparent", border: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#848484"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#484848"; }}
                >Passer →</button>
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
                <div className="font-game text-[10px] tracking-widest text-center mb-3" style={{ color: "#848484" }}>ON LE RELANCE ?</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleRelanceOui}
                    className="py-5 rounded-sm font-game text-sm tracking-wide transition-all active:scale-95"
                    style={{ background: "rgba(93,199,229,0.1)", border: "1px solid rgba(93,199,229,0.4)", color: "#5DC7E5" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(93,199,229,0.1)"; }}
                  ><div style={{ fontSize: "1.3rem", marginBottom: "3px" }}>🔄</div>OUI</button>
                  <button onClick={handleRelanceNon}
                    className="py-5 rounded-sm font-game text-sm tracking-wide transition-all active:scale-95"
                    style={{ background: "#1A1A1A", border: "1px solid #383838", color: "#848484" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#2D2D2D"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1A1A"; }}
                  ><div style={{ fontSize: "1.3rem", marginBottom: "3px" }}>🗑</div>NON</button>
                </div>
              </div>
            )}

            {callStage === "relance_date" && (
              <div>
                <div className="font-game text-[10px] tracking-widest text-center mb-3" style={{ color: "#848484" }}>QUAND LE RELANCER ?</div>
                <input type="date" value={relanceDate} onChange={(e) => setRelanceDate(e.target.value)}
                  className="w-full mb-3 rounded-sm px-3 py-2.5 font-game text-sm"
                  style={{ background: "#1A1A1A", border: "1px solid #5DC7E5", color: "#F0F0F0", outline: "none" }}
                />
                <button onClick={handleRelanceConfirm}
                  className="w-full py-3 rounded-sm font-game text-sm tracking-widest transition-all active:scale-95"
                  style={{ background: "#5DC7E5", border: "1px solid #5DC7E5", color: "#000" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#7DD8EC"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#5DC7E5"; }}
                >CONFIRMER</button>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-2">
              {callStage !== "idle" ? (
                <button onClick={resetCallFlow}
                  className="text-xs transition-colors py-1"
                  style={{ color: "#484848", background: "transparent", border: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#848484"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#484848"; }}
                >← annuler</button>
              ) : <span />}
              <span style={{ color: "#484848", fontSize: "0.65rem" }}>
                {callableProspects.length} prospect{callableProspects.length !== 1 ? "s" : ""} en attente
              </span>
            </div>
          </div>
        )}

        {/* ── Resize handle (bottom-right) ─────────────────────────────────── */}
        {!minimized && (
          <div
            onMouseDown={startResize}
            style={{
              position:   "absolute",
              bottom:     0,
              right:      0,
              width:      18,
              height:     18,
              cursor:     "nwse-resize",
              display:    "flex",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              padding:    "3px",
              zIndex:     10,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M9 1L1 9M9 5L5 9M9 9" stroke="#484848" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
    </>
  );
}
