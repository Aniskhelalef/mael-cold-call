"use client";

import { useState, useEffect, useRef } from "react";
import { useGame } from "@/lib/gameContext";
import { ProspectStatus } from "@/lib/types";

const CARD_BG = "#232323";
const BORDER  = "#383838";
const LS_TOKEN = "ccr_apify_token";

// Platforms that don't count as a real website
const PLATFORM_DOMAINS = ["doctolib", "facebook", "instagram", "twitter", "linkedin", "pages.google", "google.com/maps"];

function hasRealWebsite(url?: string): boolean {
  if (!url) return false;
  return !PLATFORM_DOMAINS.some((d) => url.toLowerCase().includes(d));
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
  title?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  neighborhood?: string;
  categoryName?: string;
  totalScore?: number;
  reviewsCount?: number;
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

  const [token,        setToken]        = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem(LS_TOKEN) ?? "") : ""
  );
  const [showToken,    setShowToken]    = useState(false);
  const [searchTerm,   setSearchTerm]   = useState("ostéopathe");
  const [location,     setLocation]     = useState("");
  const [maxResults,   setMaxResults]   = useState(100);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>("idle");
  const [errMsg,       setErrMsg]       = useState("");
  const [elapsed,      setElapsed]      = useState(0);
  const [results,      setResults]      = useState<ApifyItem[]>([]);
  const [filterNoSite, setFilterNoSite] = useState(true);
  const [selected,     setSelected]     = useState<Set<number>>(new Set());
  const [imported,     setImported]     = useState(false);

  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (typeof window !== "undefined" && token) localStorage.setItem(LS_TOKEN, token);
  }, [token]);

  useEffect(() => () => { stopTimers(); }, []);

  function stopTimers() {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function startScrape() {
    if (!token.trim())      return setErrMsg("Entre ton token Apify ci-dessous.");
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
        body: JSON.stringify({ token, searchTerm, location, maxResults }),
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
      const res  = await fetch(`/api/apify?runId=${runId}&token=${encodeURIComponent(tokenRef.current)}`);
      const data = await res.json() as { status: string; items?: ApifyItem[] };

      if (data.status === "SUCCEEDED") {
        stopTimers();
        const items = data.items ?? [];
        setResults(items);
        // Pre-select: has phone + no real website
        const pre = new Set(
          items
            .map((_, i) => i)
            .filter((i) => !!(items[i].phone) && !hasRealWebsite(items[i].website))
        );
        setSelected(pre);
        setScrapeStatus("done");
      } else if (["FAILED", "ABORTED", "TIMED-OUT"].includes(data.status)) {
        stopTimers();
        setScrapeStatus("error");
        setErrMsg(`Run ${data.status.toLowerCase()} — vérifie ton token et réessaie.`);
      }
    } catch {
      // keep polling on transient network errors
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────

  const withPhone   = results.filter((r) => !!r.phone);
  const noSiteLeads = withPhone.filter((r) => !hasRealWebsite(r.website));
  const displayed   = filterNoSite ? noSiteLeads : withPhone;

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
        name:       r.title?.trim() || "Sans nom",
        phone:      r.phone ?? "",
        email:      r.email?.trim() || undefined,
        ville:      extractCity(r, location),
        specialite: guessSpecialite(r.categoryName ?? "", searchTerm),
        status:     "a_appeler" as ProspectStatus,
        notes:      [
          r.website && `Site: ${r.website}`,
          r.reviewsCount && `${r.reviewsCount} avis Google`,
        ].filter(Boolean).join(" · "),
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

        {/* Token */}
        <div className="mb-4">
          <label style={{ display: "block", fontSize: "0.62rem", color: "#848484", letterSpacing: "0.1em", marginBottom: 6 }}>
            TOKEN APIFY <span style={{ color: "#484848" }}>(stocké localement)</span>
          </label>
          <div className="flex gap-2">
            <input
              type={showToken ? "text" : "password"}
              style={{ ...INPUT_STYLE, flex: 1 }}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="apify_api_xxxxxxxxxxxx"
              onFocus={(e) => { e.target.style.borderColor = "#FF5500"; }}
              onBlur={(e)  => { e.target.style.borderColor = BORDER;    }}
            />
            <button
              onClick={() => setShowToken(!showToken)}
              style={{
                background: "#181818", border: `1px solid ${BORDER}`, borderRadius: 3,
                color: "#848484", padding: "0 12px", cursor: "pointer", fontSize: "0.8rem", flexShrink: 0,
              }}
            >
              {showToken ? "🙈" : "👁"}
            </button>
          </div>
          <p style={{ color: "#484848", fontSize: "0.65rem", marginTop: 4 }}>
            Trouve ton token sur{" "}
            <a href="https://console.apify.com/account/integrations" target="_blank" rel="noopener noreferrer"
              style={{ color: "#848484", textDecoration: "underline" }}>
              console.apify.com → Integrations
            </a>
          </p>
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
          <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-game text-xs" style={{ color: "#848484" }}>
                {results.length} fiches Google
              </span>
              <span style={{ color: "#484848" }}>·</span>
              <span className="font-game text-xs" style={{ color: "#60a5fa" }}>
                {withPhone.length} avec tel
              </span>
              <span style={{ color: "#484848" }}>·</span>
              <span className="font-game text-xs" style={{ color: "#1CE400" }}>
                {noSiteLeads.length} sans site
              </span>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setFilterNoSite(!filterNoSite)}
              style={{
                padding: "4px 10px", borderRadius: 3, fontSize: "0.72rem", fontWeight: 700,
                cursor: "pointer", border: "none", fontFamily: "'Rajdhani', sans-serif",
                background: filterNoSite ? "rgba(28,228,0,0.15)" : "rgba(132,132,132,0.1)",
                color: filterNoSite ? "#1CE400" : "#848484",
              }}
            >
              {filterNoSite ? "✓ SANS SITE UNIQUEMENT" : "TOUS AVEC TÉL"}
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#1a1a1a" }}>
                  <th style={{ padding: "8px 12px", width: 36 }}>
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "#FF5500", cursor: "pointer" }} />
                  </th>
                  {["NOM", "TÉL", "VILLE", "CATÉGORIE", "SITE"].map((h) => (
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
                  const real = hasRealWebsite(r.website);
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
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ accentColor: "#FF5500", cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", maxWidth: 180 }}>
                        <div style={{ color: "#f1f5f9", fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.title}
                        </div>
                        {r.reviewsCount ? (
                          <div style={{ color: "#484848", fontSize: "0.65rem" }}>⭐ {r.totalScore?.toFixed(1)} ({r.reviewsCount} avis)</div>
                        ) : null}
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
                      <td style={{ padding: "8px 12px", color: "#848484", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                        {r.categoryName ?? "—"}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        {r.website ? (
                          <span style={{
                            fontSize: "0.68rem", fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                            background: real ? "rgba(239,68,68,0.15)" : "rgba(132,132,132,0.1)",
                            color: real ? "#ef4444" : "#848484",
                          }}>
                            {real ? "SITE" : r.website.includes("doctolib") ? "DOCTOLIB" : "SOCIAL"}
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: "rgba(28,228,0,0.12)", color: "#1CE400" }}>
                            AUCUN
                          </span>
                        )}
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
