"use client";

import { useState, useEffect, useRef } from "react";
import { useGame } from "@/lib/gameContext";
import { ProspectStatus } from "@/lib/types";

const CARD_BG = "#232323";
const BORDER  = "#383838";

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
  title?: string;
  phone?: string;
  email?: string;
  website?: string;
  url?: string;
  address?: string;
  city?: string;
  neighborhood?: string;
  categoryName?: string;
  totalScore?: number;
  reviewsCount?: number;
  reviews?: { publishedAtDate?: string }[];
}

const ONE_YEAR_AGO = () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d; };

function hasRecentReview(item: ApifyItem): boolean {
  if (!item.reviews?.length) return false;
  const date = item.reviews[0].publishedAtDate;
  if (!date) return false;
  return new Date(date) >= ONE_YEAR_AGO();
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

type ScrapeStatus = "idle" | "running" | "done" | "error";

// ── Input ─────────────────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "#181818",
  border: `1px solid ${BORDER}`,
  borderRadius: 3,
  padding: "10px 12px",
  color: "#fff",
  fontSize: "0.85rem",
  outline: "none",
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ScraperTab() {
  const { dispatch, state } = useGame();

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

    setErrMsg("");
    setImported(false);
    setScrapeStatus("running");
    setResults([]);
    setSelected(new Set());
    setElapsed(0);

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    try {
      const res = await fetch("/api/apify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm, location, maxResults }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);

      const { runId } = data as { runId: string };
      pollRef.current = setInterval(() => pollRun(runId), 4000);
    } catch (e) {
      stopTimers();
      setScrapeStatus("error");
      setErrMsg(String(e));
    }
  }

  async function pollRun(runId: string) {
    try {
      const res  = await fetch(`/api/apify?runId=${runId}`);
      const data = await res.json() as { status: string; items?: ApifyItem[]; errorMessage?: string };

      if (data.status === "SUCCEEDED") {
        stopTimers();
        const items = data.items ?? [];
        setResults(items);
        // Pre-select all results with a phone number
        const pre = new Set(items.map((_, i) => i).filter((i) => !!(items[i].phone)));
        setSelected(pre);
        setScrapeStatus("done");
      } else if (["FAILED", "ABORTED", "TIMED-OUT"].includes(data.status)) {
        stopTimers();
        setScrapeStatus("error");
        setErrMsg(data.errorMessage
          ? `Run ${data.status.toLowerCase()} : ${data.errorMessage}`
          : `Run ${data.status.toLowerCase()} — vérifie les paramètres et réessaie.`);
      }
    } catch {
      // keep polling on transient network errors
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────

  const displayed     = results.filter((r) => !!r.phone && hasRecentReview(r));
  const filteredOld   = results.filter((r) => !!r.phone && !hasRecentReview(r)).length;
  const selectedCount = displayed.filter((r) => selected.has(results.indexOf(r))).length;
  const allChecked    = displayed.length > 0 && displayed.every((r) => selected.has(results.indexOf(r)));

  function toggleAll() {
    const idxs = displayed.map((r) => results.indexOf(r));
    const next  = new Set(selected);
    if (allChecked) idxs.forEach((i) => next.delete(i));
    else            idxs.forEach((i) => next.add(i));
    setSelected(next);
  }

  function toggleOne(globalIdx: number) {
    const next = new Set(selected);
    if (next.has(globalIdx)) next.delete(globalIdx);
    else                     next.add(globalIdx);
    setSelected(next);
  }

  function importSelected() {
    const leads = displayed
      .filter((r) => selected.has(results.indexOf(r)))
      .map((r) => ({
        name:          r.title?.trim() || "Sans nom",
        phone:         r.phone ?? "",
        ville:         extractCity(r, location),
        specialite:    guessSpecialite(r.categoryName ?? "", searchTerm),
        status:        "a_appeler" as ProspectStatus,
        notes:         "",
        googleMapsUrl: r.url || undefined,
      }));

    dispatch({ type: "IMPORT_PROSPECTS", data: leads });
    setImported(true);
    setSelected(new Set());
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* Header */}
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "16px 20px" }}>
        <h2 className="font-game text-lg text-white">SCRAPER GOOGLE MAPS</h2>
        <p style={{ color: "#848484", fontSize: "0.72rem", marginTop: 2 }}>
          Trouve les professionnels avec fiche Google mais sans site internet
        </p>
      </div>

      {/* Form */}
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "16px 20px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {/* Métier */}
          <div>
            <label style={{ display: "block", fontSize: "0.62rem", color: "#848484", letterSpacing: "0.1em", marginBottom: 6 }}>
              MÉTIER
            </label>
            <input
              style={INPUT_STYLE}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ostéopathe, sophrologue…"
              onFocus={(e) => { e.target.style.borderColor = "#FF5500"; }}
              onBlur={(e)  => { e.target.style.borderColor = BORDER;    }}
            />
          </div>

          {/* Ville */}
          <div>
            <label style={{ display: "block", fontSize: "0.62rem", color: "#848484", letterSpacing: "0.1em", marginBottom: 6 }}>
              VILLE / RÉGION
            </label>
            <input
              style={INPUT_STYLE}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Albi, Toulouse, Occitanie…"
              onFocus={(e) => { e.target.style.borderColor = "#FF5500"; }}
              onBlur={(e)  => { e.target.style.borderColor = BORDER;    }}
            />
          </div>
        </div>

        {/* Max results */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label style={{ fontSize: "0.62rem", color: "#848484", letterSpacing: "0.1em" }}>
              NB. DE RÉSULTATS MAX
            </label>
            <span className="font-game text-sm" style={{ color: "#FF5500" }}>{maxResults}</span>
          </div>
          <input
            type="range" min={25} max={500} step={25}
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#FF5500" }}
          />
          <div className="flex justify-between" style={{ color: "#484848", fontSize: "0.62rem", marginTop: 2 }}>
            <span>25</span><span>500</span>
          </div>
        </div>

        {errMsg && (
          <div style={{ color: "#ef4444", fontSize: "0.78rem", marginBottom: 12 }}>{errMsg}</div>
        )}

        {/* Launch button */}
        <button
          onClick={startScrape}
          disabled={scrapeStatus === "running"}
          className="w-full py-3 rounded-sm font-game text-sm tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: scrapeStatus === "running" ? "rgba(255,85,0,0.1)" : "#FF5500",
            border: "1px solid #FF5500",
            color: scrapeStatus === "running" ? "#FF5500" : "#fff",
          }}
        >
          {scrapeStatus === "running" ? `⏳ EN COURS… ${elapsed}s` : "▶ LANCER LE SCRAPING"}
        </button>

        {scrapeStatus === "running" && (
          <div className="mt-3">
            <div style={{ height: 3, background: "#2D2D2D", borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%", borderRadius: 2,
                  background: "linear-gradient(90deg, #CC4400, #FF5500)",
                  width: `${Math.min((elapsed / 60) * 100, 95)}%`,
                  transition: "width 1s linear",
                }}
              />
            </div>
            <p style={{ color: "#848484", fontSize: "0.68rem", marginTop: 4 }}>
              Scraping en cours — le temps dépend du nombre de résultats (généralement 30–90s)
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      {scrapeStatus === "done" && results.length > 0 && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden" }}>

          {/* Stats bar */}
          <div className="flex items-center gap-3 px-4 py-3 flex-wrap" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <span className="font-game text-xs" style={{ color: "#848484" }}>
              {results.length} fiches Google
            </span>
            <span style={{ color: "#484848" }}>·</span>
            <span className="font-game text-xs" style={{ color: "#60a5fa" }}>
              {displayed.length} avec téléphone
            </span>
            {filteredOld > 0 && (
              <>
                <span style={{ color: "#484848" }}>·</span>
                <span className="font-game text-xs" style={{ color: "#848484" }}>
                  {filteredOld} ignoré{filteredOld > 1 ? "s" : ""} (avis +1 an)
                </span>
              </>
            )}
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#1a1a1a" }}>
                  <th style={{ padding: "8px 12px", width: 36 }}>
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "#FF5500", cursor: "pointer" }} />
                  </th>
                  {["NOM", "TÉL", "VILLE", "FICHE GOOGLE"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.62rem", color: "#848484", letterSpacing: "0.1em", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((r, displayIdx) => {
                  const globalIdx = results.indexOf(r);
                  const isSelected = selected.has(globalIdx);
                  return (
                    <tr
                      key={globalIdx}
                      onClick={() => toggleOne(globalIdx)}
                      style={{
                        borderTop: "1px solid #252525",
                        background: isSelected ? "rgba(255,85,0,0.04)" : displayIdx % 2 === 0 ? "#1c1c1c" : "#181818",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ padding: "8px 12px" }}>
                        <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ accentColor: "#FF5500", cursor: "pointer" }} />
                      </td>
                      <td style={{ padding: "8px 12px", maxWidth: 200 }}>
                        <div style={{ color: "#f1f5f9", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.title}
                        </div>
                      </td>
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                        <a
                          href={`tel:${(r.phone ?? "").replace(/\s/g, "")}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "#60a5fa", fontSize: "0.78rem", textDecoration: "none", fontFamily: "monospace" }}
                        >
                          {r.phone}
                        </a>
                      </td>
                      <td style={{ padding: "8px 12px", color: "#848484", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        {extractCity(r, location)}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        {r.url ? (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: "#60a5fa", fontSize: "0.72rem", textDecoration: "none" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#93c5fd"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#60a5fa"; }}
                          >
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

          {/* Import bar */}
          <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderTop: `1px solid ${BORDER}`, background: "#1a1a1a" }}>
            {imported ? (
              <span className="font-game text-xs" style={{ color: "#1CE400" }}>
                ✓ Leads importés dans le pipeline !
              </span>
            ) : (
              <span style={{ color: "#848484", fontSize: "0.75rem" }}>
                {selectedCount} lead{selectedCount !== 1 ? "s" : ""} sélectionné{selectedCount !== 1 ? "s" : ""}
              </span>
            )}
            <button
              onClick={importSelected}
              disabled={selectedCount === 0}
              className="font-game text-xs tracking-wider px-5 py-2.5 rounded-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: "rgba(28,228,0,0.12)", border: "1px solid rgba(28,228,0,0.4)",
                color: "#1CE400",
              }}
            >
              📥 IMPORTER {selectedCount > 0 ? selectedCount : ""} LEADS
            </button>
          </div>
        </div>
      )}

      {scrapeStatus === "error" && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, padding: "16px 20px" }}>
          <div className="font-game text-xs" style={{ color: "#ef4444", marginBottom: 4 }}>ERREUR</div>
          <p style={{ color: "#f87171", fontSize: "0.8rem" }}>{errMsg || "Une erreur est survenue."}</p>
          <button
            onClick={() => setScrapeStatus("idle")}
            style={{ marginTop: 10, background: "none", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 3, color: "#ef4444", padding: "6px 14px", cursor: "pointer", fontSize: "0.75rem" }}
          >
            Réessayer
          </button>
        </div>
      )}

    </div>
  );
}
