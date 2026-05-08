"use client";

import { useState } from "react";
import { useGame } from "@/lib/gameContext";
import { Prospect, ProspectStatus } from "@/lib/types";

// ─── Config ────────────────────────────────────────────────────────────────────

const STAGES: { id: ProspectStatus; label: string; icon: string; color: string }[] = [
  { id: "a_appeler", label: "À Appeler", icon: "📋", color: "#3b82f6" },
  { id: "rappel",    label: "Rappel",    icon: "🔄", color: "#f97316" },
  { id: "rdv",       label: "RDV Booké", icon: "🎯", color: "#22c55e" },
  { id: "demo",      label: "Site Montré",icon: "💻", color: "#8b5cf6" },
  { id: "vendu",     label: "Vendu",     icon: "💰", color: "#f59e0b" },
];

const SPECIALITES = [
  "Ostéopathe", "Kinésithérapeute", "Psychologue", "Hypnothérapeute",
  "Sophrologue", "Dentiste", "Médecin généraliste", "Infirmier(e)", "Autre",
];

function stageIndex(status: ProspectStatus) {
  return STAGES.findIndex((s) => s.id === status);
}

function daysAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return "hier";
  return `il y a ${diff}j`;
}

// ─── Add form ──────────────────────────────────────────────────────────────────

const INPUT = {
  width: "100%", boxSizing: "border-box" as const,
  padding: "0.6rem 0.75rem", background: "#0f1117",
  border: "1px solid #343c5e", borderRadius: "0.5rem",
  color: "#f1f5f9", outline: "none",
  fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9rem",
};

function AddProspectForm({ onClose }: { onClose: () => void }) {
  const { dispatch } = useGame();
  const [name, setName] = useState("");
  const [ville, setVille] = useState("");
  const [specialite, setSpecialite] = useState("Ostéopathe");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim() || !ville.trim()) { setError("Prénom/nom et ville requis"); return; }
    dispatch({
      type: "ADD_PROSPECT",
      data: {
        name: name.trim(),
        ville: ville.trim(),
        specialite,
        phone: phone.trim(),
        notes: notes.trim(),
        status: "a_appeler",
      },
    });
    onClose();
  };

  return (
    <div
      className="rounded-xl border p-4 mb-4"
      style={{ background: "rgba(26,29,46,0.98)", borderColor: "#343c5e" }}
    >
      <div className="font-game text-xs tracking-widest text-blue-400 mb-3">
        NOUVEAU PROSPECT
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", color: "#94a3b8", letterSpacing: "0.12em", marginBottom: "0.3rem" }}>
            PRÉNOM NOM *
          </label>
          <input
            style={INPUT}
            placeholder="Dr. Martin"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", color: "#94a3b8", letterSpacing: "0.12em", marginBottom: "0.3rem" }}>
            VILLE *
          </label>
          <input
            style={INPUT}
            placeholder="Lyon"
            value={ville}
            onChange={(e) => { setVille(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", color: "#94a3b8", letterSpacing: "0.12em", marginBottom: "0.3rem" }}>
            SPÉCIALITÉ
          </label>
          <select
            style={{ ...INPUT, cursor: "pointer" }}
            value={specialite}
            onChange={(e) => setSpecialite(e.target.value)}
          >
            {SPECIALITES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.65rem", color: "#94a3b8", letterSpacing: "0.12em", marginBottom: "0.3rem" }}>
            TÉLÉPHONE
          </label>
          <input
            style={INPUT}
            placeholder="06 12 34 56 78"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
      </div>
      <div className="mb-3">
        <label style={{ display: "block", fontSize: "0.65rem", color: "#94a3b8", letterSpacing: "0.12em", marginBottom: "0.3rem" }}>
          NOTES
        </label>
        <textarea
          style={{ ...INPUT, resize: "none", height: "3.5rem", lineHeight: 1.5 }}
          placeholder="Objection soulevée, heure de rappel..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <p style={{ color: "#f87171", fontSize: "0.75rem", marginBottom: "0.5rem" }}>{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          className="flex-1 py-2 rounded-lg font-game text-sm tracking-wider transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
            border: "1px solid #3b82f6", color: "#fff",
          }}
        >
          ➕ AJOUTER
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg font-game text-sm transition-all active:scale-95"
          style={{ background: "transparent", border: "1px solid #343c5e", color: "#64748b" }}
        >
          ANNULER
        </button>
      </div>
    </div>
  );
}

// ─── Prospect Card ─────────────────────────────────────────────────────────────

function ProspectCard({ prospect }: { prospect: Prospect }) {
  const { dispatch } = useGame();
  const [expanded, setExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(prospect.notes);

  const currentIdx = stageIndex(prospect.status);
  const canAdvance = currentIdx < STAGES.length - 1;
  const canGoBack = currentIdx > 0;
  const stage = STAGES[currentIdx];

  const moveTo = (status: ProspectStatus) => {
    dispatch({ type: "UPDATE_PROSPECT", id: prospect.id, changes: { status } });
  };

  const saveNotes = () => {
    dispatch({ type: "UPDATE_PROSPECT", id: prospect.id, changes: { notes } });
    setEditingNotes(false);
  };

  const confirmDelete = () => {
    if (window.confirm(`Supprimer ${prospect.name} ?`)) {
      dispatch({ type: "DELETE_PROSPECT", id: prospect.id });
    }
  };

  return (
    <div
      className="rounded-xl border mb-2 overflow-hidden"
      style={{
        background: "rgba(15,17,23,0.95)",
        borderColor: stage.color + "40",
        borderLeft: `3px solid ${stage.color}`,
      }}
    >
      {/* Main row */}
      <div
        className="p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>
              {prospect.name}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.72rem", marginTop: "0.15rem" }}>
              {prospect.specialite} · {prospect.ville}
            </div>
          </div>
          <div style={{ color: "#374151", fontSize: "0.65rem", flexShrink: 0, marginTop: "0.1rem" }}>
            {daysAgo(prospect.createdAt)}
          </div>
        </div>

        {prospect.notes && !expanded && (
          <div style={{
            color: "#475569", fontSize: "0.72rem", marginTop: "0.4rem",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            💬 {prospect.notes}
          </div>
        )}

        {/* Stage progress dots */}
        <div className="flex items-center gap-1 mt-2">
          {STAGES.map((s, i) => (
            <div
              key={s.id}
              style={{
                width: i === currentIdx ? "16px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: i <= currentIdx ? s.color : "#1f2937",
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div
          className="px-3 pb-3"
          style={{ borderTop: "1px solid #1a1d2e" }}
        >
          {/* Phone */}
          {prospect.phone && (
            <a
              href={`tel:${prospect.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 mt-2 mb-2 px-3 py-2 rounded-lg transition-colors"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid #1e3a8a", color: "#60a5fa", textDecoration: "none", fontSize: "0.85rem" }}
            >
              <span>📞</span>
              <span className="font-game text-sm tracking-wider">{prospect.phone}</span>
            </a>
          )}

          {/* Notes */}
          <div className="mt-2 mb-3">
            {editingNotes ? (
              <div>
                <textarea
                  style={{ ...INPUT, resize: "none", height: "4rem", fontSize: "0.8rem", lineHeight: 1.5 }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    onClick={saveNotes}
                    className="px-3 py-1 rounded font-game text-xs"
                    style={{ background: "rgba(30,58,138,0.5)", border: "1px solid #3b82f6", color: "#60a5fa" }}
                  >
                    SAUVER
                  </button>
                  <button
                    onClick={() => { setNotes(prospect.notes); setEditingNotes(false); }}
                    className="px-3 py-1 rounded font-game text-xs"
                    style={{ background: "transparent", border: "1px solid #343c5e", color: "#64748b" }}
                  >
                    ANNULER
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingNotes(true)}
                className="cursor-pointer rounded-lg p-2 min-h-[2rem]"
                style={{ background: "rgba(15,17,23,0.8)", border: "1px dashed #272d4a" }}
              >
                <span style={{ color: prospect.notes ? "#94a3b8" : "#374151", fontSize: "0.78rem" }}>
                  {prospect.notes || "Ajouter une note..."}
                </span>
              </div>
            )}
          </div>

          {/* Stage buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {canGoBack && (
              <button
                onClick={() => moveTo(STAGES[currentIdx - 1].id)}
                className="px-2 py-1.5 rounded-lg font-game text-[10px] tracking-wide transition-all active:scale-95"
                style={{
                  background: "rgba(30,41,59,0.6)",
                  border: `1px solid ${STAGES[currentIdx - 1].color}40`,
                  color: STAGES[currentIdx - 1].color,
                }}
              >
                ← {STAGES[currentIdx - 1].label}
              </button>
            )}

            {canAdvance && (
              <button
                onClick={() => moveTo(STAGES[currentIdx + 1].id)}
                className="flex-1 py-1.5 rounded-lg font-game text-[10px] tracking-wide transition-all active:scale-95"
                style={{
                  background: `${STAGES[currentIdx + 1].color}18`,
                  border: `1px solid ${STAGES[currentIdx + 1].color}60`,
                  color: STAGES[currentIdx + 1].color,
                }}
              >
                {STAGES[currentIdx + 1].icon} {STAGES[currentIdx + 1].label} →
              </button>
            )}

            <button
              onClick={() => moveTo("perdu")}
              className="px-2 py-1.5 rounded-lg font-game text-[10px] tracking-wide transition-all active:scale-95"
              style={{
                background: "rgba(127,29,29,0.3)",
                border: "1px solid #ef444440",
                color: "#f87171",
              }}
            >
              ✕ Perdu
            </button>

            <button
              onClick={confirmDelete}
              className="px-2 py-1.5 rounded-lg text-xs transition-all"
              style={{ background: "transparent", border: "1px solid #1f2937", color: "#374151" }}
              title="Supprimer"
            >
              🗑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pipeline Column ────────────────────────────────────────────────────────────

function PipelineColumn({
  stage,
  prospects,
}: {
  stage: typeof STAGES[0];
  prospects: Prospect[];
}) {
  return (
    <div
      style={{
        minWidth: "220px",
        maxWidth: "260px",
        flex: "0 0 220px",
      }}
    >
      {/* Column header */}
      <div
        className="rounded-xl px-3 py-2.5 mb-3 flex items-center justify-between"
        style={{
          background: `${stage.color}12`,
          border: `1px solid ${stage.color}30`,
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "0.9rem" }}>{stage.icon}</span>
          <span className="font-game text-xs tracking-wider" style={{ color: stage.color }}>
            {stage.label.toUpperCase()}
          </span>
        </div>
        <span
          className="font-game text-sm"
          style={{
            color: prospects.length > 0 ? stage.color : "#374151",
            background: prospects.length > 0 ? `${stage.color}20` : "transparent",
            padding: "0.1rem 0.5rem",
            borderRadius: "9999px",
          }}
        >
          {prospects.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ minHeight: "3rem" }}>
        {prospects.length === 0 ? (
          <div
            className="rounded-xl border-2 border-dashed flex items-center justify-center py-6"
            style={{ borderColor: "#1f2937" }}
          >
            <span style={{ color: "#1f2937", fontSize: "0.75rem" }}>Vide</span>
          </div>
        ) : (
          prospects.map((p) => <ProspectCard key={p.id} prospect={p} />)
        )}
      </div>
    </div>
  );
}

// ─── Main Tab ──────────────────────────────────────────────────────────────────

export default function PipelineTab() {
  const { state } = useGame();
  const [showAdd, setShowAdd] = useState(false);
  const [showLost, setShowLost] = useState(false);

  const prospects = state.prospects ?? [];
  const active = prospects.filter((p) => p.status !== "perdu");
  const lost = prospects.filter((p) => p.status === "perdu");

  const totalByStage = (id: ProspectStatus) => active.filter((p) => p.status === id).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-game text-lg text-white">PIPELINE</h2>
            <p className="text-xs text-gray-500">
              {active.length} prospect{active.length > 1 ? "s" : ""} actif{active.length > 1 ? "s" : ""}
              {lost.length > 0 && ` · ${lost.length} perdu${lost.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 rounded-xl font-game text-sm tracking-wider transition-all active:scale-95"
            style={{
              background: showAdd ? "transparent" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
              border: "1px solid #3b82f6",
              color: showAdd ? "#64748b" : "#fff",
            }}
          >
            {showAdd ? "ANNULER" : "＋ PROSPECT"}
          </button>
        </div>

        {/* Stage totals */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {STAGES.map((s) => {
            const count = totalByStage(s.id);
            return count > 0 ? (
              <div
                key={s.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}30` }}
              >
                <span style={{ fontSize: "0.75rem" }}>{s.icon}</span>
                <span className="font-game text-xs" style={{ color: s.color }}>{count}</span>
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* Add form */}
      {showAdd && <AddProspectForm onClose={() => setShowAdd(false)} />}

      {/* Kanban board */}
      <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
        <div style={{ display: "flex", gap: "12px", paddingBottom: "4px" }}>
          {STAGES.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              prospects={active.filter((p) => p.status === stage.id)}
            />
          ))}
        </div>
      </div>

      {/* Lost section */}
      {lost.length > 0 && (
        <div className="bg-game-card border border-game-border rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3"
            onClick={() => setShowLost(!showLost)}
          >
            <div className="flex items-center gap-2">
              <span>❌</span>
              <span className="font-game text-xs tracking-wider text-gray-500">
                PERDUS ({lost.length})
              </span>
            </div>
            <span style={{ color: "#374151", fontSize: "0.8rem" }}>{showLost ? "▲" : "▼"}</span>
          </button>
          {showLost && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {lost.map((p) => (
                <LostCard key={p.id} prospect={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Lost Card ─────────────────────────────────────────────────────────────────

function LostCard({ prospect }: { prospect: Prospect }) {
  const { dispatch } = useGame();

  return (
    <div
      className="rounded-lg border p-3 flex items-center justify-between gap-2"
      style={{ background: "rgba(15,17,23,0.8)", borderColor: "#ef444420" }}
    >
      <div className="min-w-0">
        <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600 }}>{prospect.name}</div>
        <div style={{ color: "#374151", fontSize: "0.7rem" }}>{prospect.specialite} · {prospect.ville}</div>
      </div>
      <button
        onClick={() => dispatch({ type: "UPDATE_PROSPECT", id: prospect.id, changes: { status: "a_appeler" } })}
        className="flex-shrink-0 px-2 py-1 rounded font-game text-[10px] tracking-wide transition-all"
        style={{ background: "rgba(30,58,138,0.3)", border: "1px solid #1e3a8a", color: "#60a5fa" }}
      >
        ↩ RELANCER
      </button>
    </div>
  );
}
