"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useGame } from "@/lib/gameContext";
import { Prospect, ProspectStatus } from "@/lib/types";

const BORDER = "#383838";
const CARD_BG = "#232323";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ProspectStatus, { label: string; color: string }> = {
  a_appeler: { label: "À appeler",  color: "#848484" },
  rappel:    { label: "Relance",    color: "#f97316" },
  rdv:       { label: "RDV Booké", color: "#22c55e" },
  perdu:     { label: "Perdu",     color: "#ef4444" },
};

const STATUS_LIST: ProspectStatus[] = ["a_appeler", "rappel", "rdv", "perdu"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function guessSpecialite(category: string, searchTerm: string): string {
  const s = (category || searchTerm).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (s.includes("osteo"))  return "Ostéopathe";
  if (s.includes("kine") || s.includes("physio")) return "Kinésithérapeute";
  if (s.includes("psycho")) return "Psychologue";
  if (s.includes("hypno"))  return "Hypnothérapeute";
  if (s.includes("sophro")) return "Sophrologue";
  if (s.includes("dent"))   return "Dentiste";
  if (s.includes("medecin") || s.includes("doctor") || s.includes("general")) return "Médecin généraliste";
  if (s.includes("infirm")) return "Infirmier(e)";
  return "Autre";
}

interface ApifyItem {
  title?: string; phone?: string; email?: string; website?: string;
  url?: string; address?: string; city?: string; neighborhood?: string;
  categoryName?: string; totalScore?: number; reviewsCount?: number;
}

function extractCity(item: ApifyItem, fallback: string): string {
  if (item.city) return item.city;
  if (item.address) {
    const parts = item.address.split(",");
    const last = (parts[parts.length - 1] ?? "").trim();
    return last.replace(/^\d{5}\s*/, "").trim();
  }
  return fallback;
}

// ── Inline editable cell ──────────────────────────────────────────────────────

function Cell({ value, onSave, type = "text" }: {
  value?: string; onSave: (v: string) => void; type?: "text" | "date";
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value ?? "");
  const commit = (v: string) => { onSave(v); setEditing(false); };

  if (editing) return (
    <input
      autoFocus type={type} value={draft}
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
  prospect: Prospect; idx: number; checked: boolean; onToggle: () => void;
}) {
  const { dispatch } = useGame();
  const update = (changes: Partial<Pick<Prospect, "status" | "notes" | "rappelDate" | "reponse" | "premierContact" | "pourquoi" | "website" | "googleMapsUrl" | "reviewsCount">>) =>
    dispatch({ type: "UPDATE_PROSPECT", id: prospect.id, changes });

  const cycleReponse = () => {
    const next = prospect.reponse === "Oui" ? "Non" : prospect.reponse === "Non" ? undefined : "Oui";
    update({ reponse: next });
  };

  const sc  = STATUS_CFG[prospect.status] ?? STATUS_CFG.a_appeler;
  const rowBg = idx % 2 === 0 ? "#1c1c1c" : "#181818";

  return (
    <tr style={{ borderBottom: "1px solid #252525", background: checked ? "rgba(255,85,0,0.04)" : rowBg }}>
      <td style={{ padding: "8px 12px" }}>
        <input type="checkbox" checked={checked} onChange={onToggle} style={{ accentColor: "#FF5500", cursor: "pointer" }} />
      </td>
      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
        {(prospect.googleMapsUrl || prospect.website) ? (
          <a
            href={prospect.googleMapsUrl || prospect.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#f1f5f9", fontSize: "0.83rem", fontWeight: 600, textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#60a5fa"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#f1f5f9"; }}
          >
            {prospect.name} <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>↗</span>
          </a>
        ) : (
          <span style={{ color: "#f1f5f9", fontSize: "0.83rem", fontWeight: 600 }}>{prospect.name}</span>
        )}
      </td>
      <td style={{ padding: "8px 12px", maxWidth: 200 }}>
        {prospect.email ? (
          <a href={`mailto:${prospect.email}`} style={{ color: "#848484", fontSize: "0.75rem", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#FF5500"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#848484"; }}>
            {prospect.email}
          </a>
        ) : <span style={{ color: "#383838", fontSize: "0.75rem" }}>—</span>}
      </td>
      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
        {prospect.phone ? (
          <a href={`tel:${prospect.phone.replace(/\s/g, "")}`} style={{ color: "#60a5fa", fontSize: "0.78rem", textDecoration: "none", fontFamily: "monospace" }}>
            {prospect.phone}
          </a>
        ) : <span style={{ color: "#383838", fontSize: "0.78rem" }}>—</span>}
      </td>
      <td style={{ padding: "8px 12px", minWidth: 110 }}>
        <Cell value={prospect.premierContact} onSave={(v) => update({ premierContact: v || undefined })} type="date" />
      </td>
      <td style={{ padding: "8px 12px", textAlign: "center" }}>
        <button onClick={cycleReponse} style={{
          padding: "2px 10px", borderRadius: 3, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", border: "none", letterSpacing: "0.04em",
          background: prospect.reponse === "Oui" ? "rgba(34,197,94,0.18)" : prospect.reponse === "Non" ? "rgba(239,68,68,0.15)" : "rgba(132,132,132,0.08)",
          color: prospect.reponse === "Oui" ? "#22c55e" : prospect.reponse === "Non" ? "#ef4444" : "#484848",
        }}>
          {prospect.reponse ?? "—"}
        </button>
      </td>
      <td style={{ padding: "8px 12px" }}>
        <select value={prospect.status} onChange={(e) => update({ status: e.target.value as ProspectStatus })}
          style={{ background: sc.color + "18", border: `1px solid ${sc.color}50`, borderRadius: 3, color: sc.color, fontSize: "0.72rem", fontWeight: 700, padding: "3px 6px", cursor: "pointer", outline: "none", maxWidth: 155 }}>
          {STATUS_LIST.map((s) => (
            <option key={s} value={s} style={{ background: "#232323", color: STATUS_CFG[s].color }}>{STATUS_CFG[s].label}</option>
          ))}
        </select>
      </td>
      <td style={{ padding: "8px 12px", minWidth: 110 }}>
        <Cell value={prospect.rappelDate} onSave={(v) => update({ rappelDate: v || undefined })} type="date" />
      </td>
      <td style={{ padding: "8px 12px", minWidth: 160, maxWidth: 220 }}>
        <Cell value={prospect.pourquoi} onSave={(v) => update({ pourquoi: v || undefined })} />
      </td>
      <td style={{ padding: "8px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
        {prospect.callDuration
          ? <span style={{ color: "#f59e0b", fontSize: "0.75rem", fontFamily: "monospace" }}>
              {String(Math.floor(prospect.callDuration / 60)).padStart(2, "0")}:{String(prospect.callDuration % 60).padStart(2, "0")}
            </span>
          : <span style={{ color: "#383838", fontSize: "0.75rem" }}>—</span>}
      </td>
      <td style={{ padding: "8px 12px", minWidth: 180, maxWidth: 260 }}>
        <Cell value={prospect.notes || undefined} onSave={(v) => update({ notes: v })} />
      </td>
      <td style={{ padding: "8px 12px", textAlign: "center" }}>
        <button
          onClick={() => { if (window.confirm(`Supprimer ${prospect.name} ?`)) dispatch({ type: "DELETE_PROSPECT", id: prospect.id }); }}
          style={{ background: "none", border: "none", color: "#383838", cursor: "pointer", fontSize: "0.9rem" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#383838"; }}>
          🗑
        </button>
      </td>
    </tr>
  );
}

// ── Pipeline panel ────────────────────────────────────────────────────────────

function PipelinePanel() {
  const { state, dispatch } = useGame();
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | "all">("all");
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const prospects = state.prospects ?? [];
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
        p.notes.toLowerCase().includes(q)
      );
    }
    return list;
  }, [prospects, filterStatus, search]);

  const allChecked    = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someChecked   = filtered.some((p) => selected.has(p.id));
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
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function deleteSelected() { selected.forEach((id) => dispatch({ type: "DELETE_PROSPECT", id })); setSelected(new Set()); }

  const TH = ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.65rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.1em", color: "#848484", borderBottom: `1px solid ${BORDER}`, background: "#1a1a1a", whiteSpace: "nowrap", ...style }}>
      {children}
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "16px 20px" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-game text-lg text-white">FEUILLE DE SUIVI DES LEADS</h2>
            <p style={{ color: "#848484", fontSize: "0.72rem", marginTop: 2 }}>
              {total} lead{total !== 1 ? "s" : ""} · cliquer une cellule pour éditer
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "TAUX DE RÉPONSE",    value: `${tauxReponse}%`, sub: `${oui} OUI / ${reached} contactés`, color: "#22c55e" },
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

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
          style={{ flex: "1 1 180px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 3, padding: "8px 12px", color: "#fff", fontSize: "0.83rem", outline: "none" }}
          onFocus={(e) => { e.target.style.borderColor = "#FF5500"; }}
          onBlur={(e)  => { e.target.style.borderColor = BORDER;    }} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ProspectStatus | "all")}
          style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 3, padding: "8px 10px", color: "#C0C0C0", fontSize: "0.8rem", outline: "none", cursor: "pointer" }}>
          <option value="all">Tous les statuts</option>
          {STATUS_LIST.map((s) => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>
        <div style={{ color: "#484848", fontSize: "0.72rem", marginLeft: 4 }}>
          {filtered.length} affiché{filtered.length !== 1 ? "s" : ""}
        </div>
        {someChecked && (
          <div className="flex items-center gap-3 ml-auto">
            <span className="font-game text-xs" style={{ color: "#FF5500" }}>{selectedCount} sélectionné{selectedCount !== 1 ? "s" : ""}</span>
            <button onClick={deleteSelected} className="font-game text-xs tracking-wider px-4 py-2 rounded-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", cursor: "pointer" }}>
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
              <TH>NOM</TH><TH>MAIL</TH><TH>TÉL</TH><TH>1er CONTACT</TH>
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
                  {total === 0 ? "Aucun lead — ajoute-en depuis l'onglet SCRAPER" : "Aucun résultat"}
                </td>
              </tr>
            ) : filtered.map((p, i) => (
              <LeadRow key={p.id} prospect={p} idx={i} checked={selected.has(p.id)} onToggle={() => toggleOne(p.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Scraper panel ─────────────────────────────────────────────────────────────

type ScrapeStatus = "idle" | "running" | "done" | "error";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", background: "#181818", border: `1px solid ${BORDER}`,
  borderRadius: 3, padding: "10px 12px", color: "#fff", fontSize: "0.85rem", outline: "none",
};

function ScraperPanel() {
  const { dispatch } = useGame();
  const [searchTerm,   setSearchTerm]   = useState("ostéopathe");
  const [location,     setLocation]     = useState("");
  const [maxResults,   setMaxResults]   = useState(100);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>("idle");
  const [errMsg,       setErrMsg]       = useState("");
  const [elapsed,      setElapsed]      = useState(0);
  const [results,      setResults]      = useState<ApifyItem[]>([]);
  const [selected,     setSelected]     = useState<Set<number>>(new Set());
  const [imported,     setImported]     = useState(false);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { stopTimers(); }, []);

  function stopTimers() {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function startScrape() {
    if (!searchTerm.trim()) return setErrMsg("Entre un métier à chercher.");
    if (!location.trim())   return setErrMsg("Entre une ville ou région.");
    setErrMsg(""); setImported(false); setScrapeStatus("running"); setResults([]); setSelected(new Set()); setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    try {
      const res = await fetch("/api/apify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ searchTerm, location, maxResults }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      const { runId } = data as { runId: string };
      pollRef.current = setInterval(() => pollRun(runId), 4000);
    } catch (e) { stopTimers(); setScrapeStatus("error"); setErrMsg(String(e)); }
  }

  async function pollRun(runId: string) {
    try {
      const res  = await fetch(`/api/apify?runId=${runId}`);
      const data = await res.json() as { status: string; items?: ApifyItem[]; errorMessage?: string };
      if (data.status === "SUCCEEDED") {
        stopTimers();
        const items = data.items ?? [];
        setResults(items);
        setSelected(new Set(items.map((_, i) => i).filter((i) => !!(items[i].phone))));
        setScrapeStatus("done");
      } else if (["FAILED", "ABORTED", "TIMED-OUT"].includes(data.status)) {
        stopTimers(); setScrapeStatus("error");
        setErrMsg(data.errorMessage ? `Run ${data.status.toLowerCase()} : ${data.errorMessage}` : `Run ${data.status.toLowerCase()} — vérifie les paramètres et réessaie.`);
      }
    } catch { /* keep polling */ }
  }

  const NON_PERSONAL_DOMAINS = [
    // Plateformes de réservation santé
    "doctolib.fr", "resalib.fr", "mondocteur.fr", "kine-direct.fr",
    "clicrdv.com", "livi.fr", "maiia.com", "qare.fr", "soignez-moi.fr",
    "calendly.com", "cal.com",
    // Annuaires santé
    "oosteo.com", "reflexosteo.com", "therapeutes.com", "praticiens.fr", "annuairesante.fr",
    "kiné-direct.fr", "psychologue.net", "psychologue.fr",
    "annuaire-sophrologie.fr", "osteopathe-france.fr", "kinegarde.com",
    "paramedicaux.fr", "sante.fr",
    // Annuaires généralistes
    "pagesjaunes.fr", "pagesjaunesante.fr", "118000.fr", "118218.fr",
    "yelp.fr", "justacote.com", "hoodspot.fr", "local.fr",
    "kompass.com", "europages.fr", "trouvez.com", "annuaire.fr",
    "hotfrog.fr", "cylex.fr", "enrollbusiness.com",
    // Builders bas de gamme
    "wix.com", "wixsite.com", "jimdo.com", "jimdosite.com",
    "weebly.com", "webnode.fr", "webnode.com", "site123.com",
    "strikingly.com", "yola.com", "over-blog.com", "blogspot.com",
    "wordpress.com", "tumblr.com",
    // Réseaux sociaux utilisés comme site
    "facebook.com", "instagram.com", "linkedin.com", "linktr.ee",
  ];
  function isTargetable(website?: string): boolean {
    if (!website) return true;
    const w = website.toLowerCase();
    return NON_PERSONAL_DOMAINS.some((p) => w.includes(p));
  }
  const displayed     = results.filter((r) => !!r.phone && isTargetable(r.website));
  const selectedCount = displayed.filter((r) => selected.has(results.indexOf(r))).length;
  const allChecked    = displayed.length > 0 && displayed.every((r) => selected.has(results.indexOf(r)));

  function toggleAll() {
    const idxs = displayed.map((r) => results.indexOf(r));
    const next = new Set(selected);
    if (allChecked) idxs.forEach((i) => next.delete(i)); else idxs.forEach((i) => next.add(i));
    setSelected(next);
  }
  function toggleOne(globalIdx: number) {
    const next = new Set(selected); if (next.has(globalIdx)) next.delete(globalIdx); else next.add(globalIdx); setSelected(next);
  }
  function importSelected() {
    const leads = displayed.filter((r) => selected.has(results.indexOf(r))).map((r) => ({
      name: r.title?.trim() || "Sans nom", phone: r.phone ?? "",
      ville: extractCity(r, location), specialite: guessSpecialite(r.categoryName ?? "", searchTerm),
      status: "a_appeler" as ProspectStatus, notes: "", googleMapsUrl: r.url || undefined,
    }));
    dispatch({ type: "IMPORT_PROSPECTS", data: leads });
    setImported(true); setSelected(new Set());
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "16px 20px" }}>
        <h2 className="font-game text-lg text-white">SCRAPER GOOGLE MAPS</h2>
        <p style={{ color: "#848484", fontSize: "0.72rem", marginTop: 2 }}>Trouve les professionnels avec fiche Google</p>
      </div>

      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "16px 20px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label style={{ display: "block", fontSize: "0.62rem", color: "#848484", letterSpacing: "0.1em", marginBottom: 6 }}>MÉTIER</label>
            <input style={INPUT_STYLE} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ostéopathe, sophrologue…"
              onFocus={(e) => { e.target.style.borderColor = "#FF5500"; }} onBlur={(e) => { e.target.style.borderColor = BORDER; }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.62rem", color: "#848484", letterSpacing: "0.1em", marginBottom: 6 }}>VILLE / RÉGION</label>
            <input style={INPUT_STYLE} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Albi, Toulouse, Occitanie…"
              onFocus={(e) => { e.target.style.borderColor = "#FF5500"; }} onBlur={(e) => { e.target.style.borderColor = BORDER; }} />
          </div>
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label style={{ fontSize: "0.62rem", color: "#848484", letterSpacing: "0.1em" }}>NB. DE RÉSULTATS MAX</label>
            <span className="font-game text-sm" style={{ color: "#FF5500" }}>{maxResults}</span>
          </div>
          <input type="range" min={25} max={500} step={25} value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))} style={{ width: "100%", accentColor: "#FF5500" }} />
          <div className="flex justify-between" style={{ color: "#484848", fontSize: "0.62rem", marginTop: 2 }}><span>25</span><span>500</span></div>
        </div>
        {errMsg && <div style={{ color: "#ef4444", fontSize: "0.78rem", marginBottom: 12 }}>{errMsg}</div>}
        <button onClick={startScrape} disabled={scrapeStatus === "running"}
          className="w-full py-3 rounded-sm font-game text-sm tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: scrapeStatus === "running" ? "rgba(255,85,0,0.1)" : "#FF5500", border: "1px solid #FF5500", color: scrapeStatus === "running" ? "#FF5500" : "#fff" }}>
          {scrapeStatus === "running" ? `⏳ EN COURS… ${elapsed}s` : "▶ LANCER LE SCRAPING"}
        </button>
        {scrapeStatus === "running" && (
          <div className="mt-3">
            <div style={{ height: 3, background: "#2D2D2D", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#CC4400,#FF5500)", width: `${Math.min((elapsed / 60) * 100, 95)}%`, transition: "width 1s linear" }} />
            </div>
            <p style={{ color: "#848484", fontSize: "0.68rem", marginTop: 4 }}>Scraping en cours — généralement 30–90s</p>
          </div>
        )}
      </div>

      {scrapeStatus === "done" && results.length > 0 && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden" }}>
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <span className="font-game text-xs" style={{ color: "#848484" }}>{results.length} fiches Google</span>
            <span style={{ color: "#484848" }}>·</span>
            <span className="font-game text-xs" style={{ color: "#60a5fa" }}>{displayed.length} ciblables</span>
            <span style={{ color: "#484848" }}>·</span>
            <span className="font-game text-xs" style={{ color: "#484848" }}>{results.filter((r) => !!r.phone && !isTargetable(r.website)).length} exclus</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#1a1a1a" }}>
                  <th style={{ padding: "8px 12px", width: 36 }}>
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "#FF5500", cursor: "pointer" }} />
                  </th>
                  {["NOM", "TÉL", "VILLE", "FICHE GOOGLE"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.62rem", color: "#848484", letterSpacing: "0.1em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((r, displayIdx) => {
                  const globalIdx  = results.indexOf(r);
                  const isSelected = selected.has(globalIdx);
                  return (
                    <tr key={globalIdx} onClick={() => toggleOne(globalIdx)}
                      style={{ borderTop: "1px solid #252525", background: isSelected ? "rgba(255,85,0,0.04)" : displayIdx % 2 === 0 ? "#1c1c1c" : "#181818", cursor: "pointer" }}>
                      <td style={{ padding: "8px 12px" }}>
                        <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ accentColor: "#FF5500", cursor: "pointer" }} />
                      </td>
                      <td style={{ padding: "8px 12px", maxWidth: 200 }}>
                        <div style={{ color: "#f1f5f9", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                      </td>
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                        <a href={`tel:${(r.phone ?? "").replace(/\s/g, "")}`} onClick={(e) => e.stopPropagation()}
                          style={{ color: "#60a5fa", fontSize: "0.78rem", textDecoration: "none", fontFamily: "monospace" }}>{r.phone}</a>
                      </td>
                      <td style={{ padding: "8px 12px", color: "#848484", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{extractCity(r, location)}</td>
                      <td style={{ padding: "8px 12px" }}>
                        {r.url ? (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                            style={{ color: "#60a5fa", fontSize: "0.72rem", textDecoration: "none" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#93c5fd"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#60a5fa"; }}>
                            Maps ↗
                          </a>
                        ) : <span style={{ color: "#383838", fontSize: "0.72rem" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderTop: `1px solid ${BORDER}`, background: "#1a1a1a" }}>
            {imported
              ? <span className="font-game text-xs" style={{ color: "#1CE400" }}>✓ Leads importés dans le pipeline !</span>
              : <span style={{ color: "#848484", fontSize: "0.75rem" }}>{selectedCount} lead{selectedCount !== 1 ? "s" : ""} sélectionné{selectedCount !== 1 ? "s" : ""}</span>}
            <button onClick={importSelected} disabled={selectedCount === 0}
              className="font-game text-xs tracking-wider px-5 py-2.5 rounded-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "rgba(28,228,0,0.12)", border: "1px solid rgba(28,228,0,0.4)", color: "#1CE400" }}>
              📥 IMPORTER {selectedCount > 0 ? selectedCount : ""} LEADS
            </button>
          </div>
        </div>
      )}

      {scrapeStatus === "error" && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, padding: "16px 20px" }}>
          <div className="font-game text-xs" style={{ color: "#ef4444", marginBottom: 4 }}>ERREUR</div>
          <p style={{ color: "#f87171", fontSize: "0.8rem" }}>{errMsg || "Une erreur est survenue."}</p>
          <button onClick={() => setScrapeStatus("idle")}
            style={{ marginTop: 10, background: "none", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 3, color: "#ef4444", padding: "6px 14px", cursor: "pointer", fontSize: "0.75rem" }}>
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

type SubTab = "pipeline" | "scraper";

export default function LeadsTab({ defaultSub = "pipeline" }: { defaultSub?: SubTab }) {
  const [sub, setSub] = useState<SubTab>(defaultSub);

  return (
    <div className="space-y-3">
      {/* Sub-tab switcher */}
      <div className="flex gap-1.5">
        {([
          { id: "pipeline", label: "👥 PIPELINE" },
          { id: "scraper",  label: "🔍 SCRAPER"  },
        ] as { id: SubTab; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className="px-5 py-2 rounded-sm font-game text-xs tracking-wider transition-all duration-100"
            style={{
              background: sub === t.id ? "#FF5500" : CARD_BG,
              border:     `1px solid ${sub === t.id ? "#FF5500" : BORDER}`,
              color:      sub === t.id ? "#fff" : "#C0C0C0",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "pipeline" && <PipelinePanel />}
      {sub === "scraper"  && <ScraperPanel />}
    </div>
  );
}
