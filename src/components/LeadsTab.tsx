"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useGame } from "@/lib/gameContext";
import { Prospect, ProspectStatus } from "@/lib/types";

const BORDER = "#383838";

const STATUS_CFG: Record<ProspectStatus, { label: string; color: string }> = {
  a_appeler:      { label: "—",                 color: "#848484" },
  rappel:         { label: "Relance effectuée", color: "#f97316" },
  rdv:            { label: "RDV Booké",         color: "#22c55e" },
  demo:           { label: "Site montré",       color: "#8b5cf6" },
  vente_en_cours: { label: "Vente en cours",    color: "#f59e0b" },
  vendu:          { label: "Vendu",             color: "#1CE400" },
  perdu:          { label: "No close",          color: "#ef4444" },
};

const STATUS_LIST: ProspectStatus[] = [
  "a_appeler", "rappel", "rdv", "demo", "vente_en_cours", "vendu", "perdu",
];

// ── Seed data ─────────────────────────────────────────────────────────────────

type SeedLead = Omit<Prospect, "id" | "createdAt" | "updatedAt">;

const SEED: SeedLead[] = [
  { name: "Damien Bertrand",              email: "jeanbauche.info@gmail.com",           phone: "06 77 77 77 77", ville: "", specialite: "Autre",              status: "perdu",         reponse: "Non", notes: "faux num" },
  { name: "Marie Parinet",                email: "parinet.marie@gmail.com",             phone: "06 82 03 31 89", ville: "", specialite: "Autre",              status: "vente_en_cours", reponse: "Non", notes: "en attente avec philippe" },
  { name: "Zakarya Hadir",                email: "hadirzakarya@outlook.fr",             phone: "06 28 13 61 67", ville: "", specialite: "Autre",              status: "rappel",        reponse: "Oui", rappelDate: "2026-05-07", premierContact: "2026-05-06", notes: "j'ai envoyé mon calendrier, il va prendre rdv" },
  { name: "Tristan Bartoli",              email: "tristan.bartoli@gmail.com",           phone: "06 51 59 54 59", ville: "", specialite: "Autre",              status: "vente_en_cours", reponse: "Non", notes: "en attente avec etienne s" },
  { name: "Jordi BAUX",                   email: "baux.jordi@gmail.com",                phone: "06 60 18 59 30", ville: "", specialite: "Autre",              status: "vente_en_cours", reponse: "Non", notes: "en attente avec philippe" },
  { name: "Ibtihel belghith",             email: "ibtisophrologie@gmail.com",           phone: "06 16 93 67 31", ville: "", specialite: "Sophrologue",        status: "vente_en_cours", reponse: "Oui", rappelDate: "2026-05-07", premierContact: "2026-05-06", notes: "ancienne prospect btc à moi, va prendre rdv sur mon calendrier" },
  { name: "Nada Smili",                   email: "nadaasmili@gmail.com",                phone: "04 37 24 00 00", ville: "", specialite: "Autre",              status: "perdu",         reponse: "Non", premierContact: "2026-05-06", notes: "ne rep pas, c'est une ligne fixe" },
  { name: "Hervé Klinski",                email: "contact@wellness-massages.fr",        phone: "07 77 37 17 81", ville: "", specialite: "Autre",              status: "rappel",        reponse: "Non", rappelDate: "2026-05-07", premierContact: "2026-05-06", notes: "message laissé + sms" },
  { name: "Laurène SALVAYRE",             email: "lsalvayre.sophro@gmail.com",          phone: "06 29 05 97 10", ville: "", specialite: "Sophrologue",        status: "rappel",        reponse: "Non", rappelDate: "2026-05-07", premierContact: "2026-05-06", notes: "message laissé + sms" },
  { name: "Arnold Breton",                email: "a.breton.osteopathe@gmail.com",       phone: "07 56 91 21 67", ville: "", specialite: "Ostéopathe",         status: "rappel",        reponse: "Non", rappelDate: "2026-05-07", premierContact: "2026-05-06", notes: "message laissé + sms" },
  { name: "Stéphane Jaffrain",            email: "stefjaffrain@hotmail.fr",             phone: "07 82 29 46 97", ville: "", specialite: "Autre",              status: "rappel",        reponse: "Non", rappelDate: "2026-05-07", premierContact: "2026-05-06", notes: "message laissé + sms" },
  { name: "Olivia Vincent",               email: "oliviavincent26@gmail.com",           phone: "06 61 62 98 52", ville: "", specialite: "Autre",              status: "vente_en_cours", reponse: "Oui", notes: "futur client BTC à moi, termine son engagement ailleurs et lance théralys avec nous" },
  { name: "Gérard Larcher",               email: "grelledogreto-6455@yopmail.com",      phone: "06 50 50 28 30", ville: "", specialite: "Autre",              status: "rappel",        reponse: "Non", rappelDate: "2026-05-07", premierContact: "2026-05-06", notes: "ancien rdv à david, il a mis un faux nom+prenom, message laissé + sms" },
  { name: "Celine Péron",                 email: "celine.medium17@gmail.com",           phone: "07 83 87 13 18", ville: "", specialite: "Autre",              status: "perdu",         reponse: "Oui", premierContact: "2026-05-06", notes: "n'a pas réussi à comprendre l'interface, ne veut pas d'aide" },
  { name: "Docteur Steve Abadie Rosier",  email: "cassandre.75@hotmail.fr",             phone: "06 24 67 08 57", ville: "", specialite: "Médecin généraliste", status: "a_appeler",    notes: "" },
  { name: "Irvin Clemendot",              email: "irvin.osteo@gmail.com",               phone: "06 29 97 44 15", ville: "", specialite: "Ostéopathe",         status: "rappel",        reponse: "Non", rappelDate: "2026-05-07", premierContact: "2026-05-06", notes: "message laissé + sms" },
  { name: "Charlotte Blondeau danne",     email: "charlotte.fkav@outlook.com",          phone: "06 87 75 42 06", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "stephanie carlier",            email: "geraldcarlierplomberie13@gmail.com",  phone: "06 08 31 15 03", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "Magali Sarim",                 email: "magali.sarim@outlook.fr",             phone: "06 07 63 33 89", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "Elsa Lentini",                 email: "alpha-therapie-e.lentini@outlook.fr", phone: "06 50 94 42 67", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "Nadia Papin",                  email: "nadmedium@hotmail.fr",                phone: "07 87 89 40 71", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "Mohamed-Amine OUALI",          email: "ouali.osteopathe@hotmail.com",        phone: "06 13 73 68 39", ville: "", specialite: "Ostéopathe",         status: "perdu",         reponse: "Non", notes: "il a déjà un site avec nous" },
  { name: "Marine Biggio",                email: "biggio.marine@gmail.com",             phone: "06 61 07 98 35", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "Lisa Sieber",                  email: "siel.organic@gmail.com",              phone: "06 46 91 74 95", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "Jean LAFFONT",                 email: "jeanlaffont.pro@gmail.com",           phone: "06 19 70 08 50", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "tony montoya",                 email: "mysfrance@gmail.com",                 phone: "01 42 45 63 59", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "Laura Sonntag",                email: "laurasyogapro@gmail.com",             phone: "06 51 95 90 39", ville: "", specialite: "Autre",              status: "vente_en_cours", reponse: "Oui", rappelDate: "2026-05-18", premierContact: "2026-05-06", notes: "elle finalise en milieu de mois" },
  { name: "Florentin Depardieu",          email: "florentin.depardi@gmail.com",         phone: "06 23 49 65 04", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "Vincent Jourdan",              email: "vincentjourdandiet@gmail.com",        phone: "06 49 31 97 88", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "PASCAL Bornarel",              email: "medecinechinoisefleurance@gmail.com", phone: "06 12 30 97 53", ville: "", specialite: "Médecin généraliste", status: "a_appeler",    notes: "" },
  { name: "Pascal Bornarel",              email: "sanatoma.25@gmail.com",               phone: "06 12 30 97 53", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "Jean dubois",                  email: "novode7947@bmoar.com",                phone: "06 80 78 65 45", ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "Florian Carreras",             email: "f.err.er.t.ony46@gmail.com",          phone: "14388775135",    ville: "", specialite: "Autre",              status: "a_appeler",     notes: "" },
  { name: "Nicolas Beaugrand",            email: "nicolas.beaugranddiet@gmail.com",     phone: "06 85 59 98 24", ville: "", specialite: "Autre",              status: "perdu",         reponse: "Oui", premierContact: "2026-05-06", notes: "4 no show sur des R1 BTC, n'achetera jamais rien" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ── Inline editable cell ──────────────────────────────────────────────────────

function Cell({ value, onSave, type = "text" }: {
  value?: string;
  onSave: (v: string) => void;
  type?: "text" | "date";
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value ?? "");

  const commit = (v: string) => { onSave(v); setEditing(false); };

  if (editing) return (
    <input
      autoFocus
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => commit(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter")  commit(draft);
        if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
      }}
      style={{
        width: "100%", minWidth: type === "date" ? 130 : 80,
        background: "#181818", border: "1px solid #FF5500", borderRadius: 2,
        color: "#fff", padding: "2px 4px", fontSize: "0.78rem", outline: "none",
      }}
    />
  );

  const display = type === "date" ? fmtDate(value) : (value || null);

  return (
    <div
      onClick={() => { setDraft(value ?? ""); setEditing(true); }}
      style={{
        cursor: "pointer", fontSize: "0.78rem", minHeight: 20,
        color: display ? "#D0D0D0" : "#383838",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}
    >
      {display ?? "—"}
    </div>
  );
}

// ── Lead row ──────────────────────────────────────────────────────────────────

function LeadRow({ prospect, idx, checked, onToggle }: {
  prospect: Prospect;
  idx: number;
  checked: boolean;
  onToggle: () => void;
}) {
  const { dispatch } = useGame();

  const update = (
    changes: Partial<Pick<Prospect, "status" | "notes" | "rappelDate" | "reponse" | "premierContact" | "pourquoi" | "website" | "googleMapsUrl" | "reviewsCount">>
  ) => dispatch({ type: "UPDATE_PROSPECT", id: prospect.id, changes });

  const cycleReponse = () => {
    const next = prospect.reponse === "Oui" ? "Non" : prospect.reponse === "Non" ? undefined : "Oui";
    update({ reponse: next });
  };

  const sc = STATUS_CFG[prospect.status] ?? STATUS_CFG.a_appeler;

  const rowBg = idx % 2 === 0 ? "#1c1c1c" : "#181818";

  return (
    <tr style={{ borderBottom: `1px solid #252525`, background: checked ? "rgba(255,85,0,0.04)" : rowBg }}>

      {/* CHECKBOX */}
      <td style={{ padding: "8px 12px" }}>
        <input type="checkbox" checked={checked} onChange={onToggle} style={{ accentColor: "#FF5500", cursor: "pointer" }} />
      </td>

      {/* NOM */}
      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
        <span style={{ color: "#f1f5f9", fontSize: "0.83rem", fontWeight: 600 }}>
          {prospect.name}
        </span>
      </td>

      {/* MAIL */}
      <td style={{ padding: "8px 12px", maxWidth: 200 }}>
        {prospect.email ? (
          <a
            href={`mailto:${prospect.email}`}
            style={{ color: "#848484", fontSize: "0.75rem", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#FF5500"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#848484"; }}
          >
            {prospect.email}
          </a>
        ) : <span style={{ color: "#383838", fontSize: "0.75rem" }}>—</span>}
      </td>

      {/* TÉL */}
      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
        {prospect.phone ? (
          <a
            href={`tel:${prospect.phone.replace(/\s/g, "")}`}
            style={{ color: "#60a5fa", fontSize: "0.78rem", textDecoration: "none", fontFamily: "monospace" }}
          >
            {prospect.phone}
          </a>
        ) : <span style={{ color: "#383838", fontSize: "0.78rem" }}>—</span>}
      </td>

      {/* 1er CONTACT */}
      <td style={{ padding: "8px 12px", minWidth: 110 }}>
        <Cell
          value={prospect.premierContact}
          onSave={(v) => update({ premierContact: v || undefined })}
          type="date"
        />
      </td>

      {/* RÉPONSE */}
      <td style={{ padding: "8px 12px", textAlign: "center" }}>
        <button
          onClick={cycleReponse}
          style={{
            padding: "2px 10px", borderRadius: 3, fontSize: "0.72rem", fontWeight: 700,
            cursor: "pointer", border: "none", letterSpacing: "0.04em",
            background:
              prospect.reponse === "Oui" ? "rgba(34,197,94,0.18)" :
              prospect.reponse === "Non" ? "rgba(239,68,68,0.15)" :
              "rgba(132,132,132,0.08)",
            color:
              prospect.reponse === "Oui" ? "#22c55e" :
              prospect.reponse === "Non" ? "#ef4444" :
              "#484848",
          }}
        >
          {prospect.reponse ?? "—"}
        </button>
      </td>

      {/* STATUT */}
      <td style={{ padding: "8px 12px" }}>
        <select
          value={prospect.status}
          onChange={(e) => update({ status: e.target.value as ProspectStatus })}
          style={{
            background: sc.color + "18",
            border: `1px solid ${sc.color}50`,
            borderRadius: 3,
            color: sc.color,
            fontSize: "0.72rem",
            fontWeight: 700,
            padding: "3px 6px",
            cursor: "pointer",
            outline: "none",
            maxWidth: 155,
          }}
        >
          {STATUS_LIST.map((s) => (
            <option key={s} value={s} style={{ background: "#232323", color: STATUS_CFG[s].color }}>
              {STATUS_CFG[s].label}
            </option>
          ))}
        </select>
      </td>

      {/* DATE RELANCE */}
      <td style={{ padding: "8px 12px", minWidth: 110 }}>
        <Cell
          value={prospect.rappelDate}
          onSave={(v) => update({ rappelDate: v || undefined })}
          type="date"
        />
      </td>

      {/* POURQUOI */}
      <td style={{ padding: "8px 12px", minWidth: 160, maxWidth: 220 }}>
        <Cell
          value={prospect.pourquoi}
          onSave={(v) => update({ pourquoi: v || undefined })}
        />
      </td>

      {/* FICHE GOOGLE */}
      <td style={{ padding: "8px 12px", textAlign: "center" }}>
        {prospect.googleMapsUrl ? (
          <a
            href={prospect.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#60a5fa", fontSize: "0.72rem", textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#93c5fd"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#60a5fa"; }}
          >
            Maps ↗
          </a>
        ) : <span style={{ color: "#383838", fontSize: "0.72rem" }}>—</span>}
      </td>

      {/* COMMENTAIRES */}
      <td style={{ padding: "8px 12px", minWidth: 180, maxWidth: 260 }}>
        <Cell
          value={prospect.notes || undefined}
          onSave={(v) => update({ notes: v })}
        />
      </td>

      {/* DELETE */}
      <td style={{ padding: "8px 12px", textAlign: "center" }}>
        <button
          onClick={() => {
            if (window.confirm(`Supprimer ${prospect.name} ?`)) {
              dispatch({ type: "DELETE_PROSPECT", id: prospect.id });
            }
          }}
          style={{ background: "none", border: "none", color: "#383838", cursor: "pointer", fontSize: "0.9rem" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#383838"; }}
        >
          🗑
        </button>
      </td>
    </tr>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LeadsTab() {
  const { state, dispatch } = useGame();
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | "all">("all");
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const autoImported = useRef(false);

  // Auto-import seed data on first render if no prospects exist
  useEffect(() => {
    if (!autoImported.current && (state.prospects ?? []).length === 0) {
      autoImported.current = true;
      dispatch({ type: "IMPORT_PROSPECTS", data: SEED });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prospects = state.prospects ?? [];

  // KPIs
  const total        = prospects.length;
  const reached      = prospects.filter((p) => p.reponse === "Oui" || p.reponse === "Non").length;
  const oui          = prospects.filter((p) => p.reponse === "Oui").length;
  const relancePend  = prospects.filter((p) => p.status === "rappel").length;
  const enCours      = prospects.filter((p) => p.status === "vente_en_cours" || p.status === "vendu").length;

  const tauxReponse   = reached > 0 ? Math.round((oui / reached) * 100) : 0;
  const tauxConv      = total   > 0 ? Math.round((enCours / total) * 100) : 0;

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = prospects;
    if (filterStatus !== "all") list = list.filter((p) => p.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.email ?? "").toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.notes.toLowerCase().includes(q)
      );
    }
    return list;
  }, [prospects, filterStatus, search]);

  const allChecked  = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someChecked = filtered.some((p) => selected.has(p.id));
  const selectedCount = filtered.filter((p) => selected.has(p.id)).length;

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) filtered.forEach((p) => next.delete(p.id));
      else            filtered.forEach((p) => next.add(p.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function deleteSelected() {
    selected.forEach((id) => dispatch({ type: "DELETE_PROSPECT", id }));
    setSelected(new Set());
  }

  const TH = ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
    <th
      style={{
        padding: "10px 12px",
        textAlign: "left",
        fontSize: "0.65rem",
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: "#848484",
        borderBottom: `1px solid ${BORDER}`,
        background: "#1a1a1a",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </th>
  );

  return (
    <div className="space-y-4">

      {/* Header */}
      <div style={{ background: "#232323", border: `1px solid ${BORDER}`, borderRadius: 4, padding: "16px 20px" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-game text-lg text-white">FEUILLE DE SUIVI DES LEADS</h2>
            <p style={{ color: "#848484", fontSize: "0.72rem", marginTop: 2 }}>
              {total} lead{total !== 1 ? "s" : ""} · cliquer une cellule pour éditer
            </p>
          </div>
          {total === 0 && (
            <button
              onClick={() => dispatch({ type: "IMPORT_PROSPECTS", data: SEED })}
              style={{
                background: "rgba(255,85,0,0.1)", border: "1px solid rgba(255,85,0,0.4)",
                color: "#FF5500", borderRadius: 3, padding: "8px 14px",
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                fontSize: "0.8rem", letterSpacing: "0.08em", cursor: "pointer",
              }}
            >
              📥 CHARGER LES 34 LEADS
            </button>
          )}
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "TAUX DE RÉPONSE",      value: `${tauxReponse}%`,   sub: `${oui} OUI / ${reached} contactés`,    color: "#22c55e" },
            { label: "RELANCES EN ATTENTE",   value: relancePend,          sub: "leads à rappeler",                     color: "#f97316" },
            { label: "TAUX DE CONVERSION",    value: `${tauxConv}%`,       sub: `${enCours} ventes en cours`,           color: "#f59e0b" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                background: "#181818", border: `1px solid ${BORDER}`, borderRadius: 4, padding: "12px 16px",
              }}
            >
              <div style={{ color: "#848484", fontSize: "0.62rem", letterSpacing: "0.1em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                {kpi.label}
              </div>
              <div style={{ color: kpi.color, fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>
                {kpi.value}
              </div>
              <div style={{ color: "#484848", fontSize: "0.7rem", marginTop: 2 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          style={{
            flex: "1 1 180px", background: "#232323", border: `1px solid ${BORDER}`,
            borderRadius: 3, padding: "8px 12px", color: "#fff", fontSize: "0.83rem", outline: "none",
          }}
          onFocus={(e) => { e.target.style.borderColor = "#FF5500"; }}
          onBlur={(e)  => { e.target.style.borderColor = BORDER;    }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ProspectStatus | "all")}
          style={{
            background: "#232323", border: `1px solid ${BORDER}`, borderRadius: 3,
            padding: "8px 10px", color: "#C0C0C0", fontSize: "0.8rem", outline: "none", cursor: "pointer",
          }}
        >
          <option value="all">Tous les statuts</option>
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>{STATUS_CFG[s].label}</option>
          ))}
        </select>
        <div style={{ color: "#484848", fontSize: "0.72rem", marginLeft: 4 }}>
          {filtered.length} affiché{filtered.length !== 1 ? "s" : ""}
        </div>

        {/* Bulk action bar */}
        {someChecked && (
          <div className="flex items-center gap-3 ml-auto">
            <span className="font-game text-xs" style={{ color: "#FF5500" }}>
              {selectedCount} sélectionné{selectedCount !== 1 ? "s" : ""}
            </span>
            <button
              onClick={deleteSelected}
              className="font-game text-xs tracking-wider px-4 py-2 rounded-sm"
              style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)",
                color: "#ef4444", cursor: "pointer",
              }}
            >
              🗑 SUPPRIMER
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: 4, border: `1px solid ${BORDER}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH style={{ width: 36 }}>
                <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "#FF5500", cursor: "pointer" }} />
              </TH>
              <TH>NOM</TH>
              <TH>MAIL</TH>
              <TH>TÉL</TH>
              <TH>1er CONTACT</TH>
              <TH style={{ textAlign: "center" }}>RÉPONSE</TH>
              <TH>STATUT</TH>
              <TH>DATE RELANCE</TH>
              <TH>POURQUOI</TH>
              <TH style={{ textAlign: "center" }}>FICHE</TH>
              <TH>COMMENTAIRES</TH>
              <TH></TH>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: "32px", textAlign: "center", color: "#484848", fontSize: "0.85rem" }}>
                  {total === 0 ? "Aucun lead — cliquer sur « Charger les 34 leads »" : "Aucun résultat"}
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <LeadRow
                  key={p.id}
                  prospect={p}
                  idx={i}
                  checked={selected.has(p.id)}
                  onToggle={() => toggleOne(p.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
