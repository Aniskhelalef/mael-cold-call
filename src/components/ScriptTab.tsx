"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchScriptVotes, castScriptVote, ScriptVote, isSupabaseConfigured,
  fetchScriptVariants, addScriptVariant, likeScriptVariant, dislikeScriptVariant, deleteScriptVariant, ScriptVariant,
} from "@/lib/supabase";
import { useGame } from "@/lib/gameContext";

const CARD_BG = "#232323";
const BORDER  = "#383838";

// ── Votes ─────────────────────────────────────────────────────────────────────

const LS_KEY = "script_votes_local";

function loadLocalVotes(): Record<string, "like" | "dislike"> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}"); } catch { return {}; }
}
function saveLocalVotes(v: Record<string, "like" | "dislike">) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(v));
}

// ── Active variants (per-step localStorage) ───────────────────────────────────

const LS_ACTIVE_KEY = "script_active_variants";
function loadActiveVariants(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_ACTIVE_KEY) ?? "{}"); } catch { return {}; }
}
function saveActiveVariants(v: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_ACTIVE_KEY, JSON.stringify(v));
}

// ── Author color ──────────────────────────────────────────────────────────────

const AUTHOR_PALETTE = ["#FF5500", "#5DC7E5", "#1CE400", "#FF9500", "#AE00FC", "#f59e0b", "#06b6d4", "#f43f5e"];
function authorColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AUTHOR_PALETTE[Math.abs(hash) % AUTHOR_PALETTE.length];
}

function useVotes() {
  const [votes,      setVotes]      = useState<Record<string, ScriptVote>>({});
  const [myVotes,    setMyVotes]    = useState<Record<string, "like" | "dislike">>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMyVotes(loadLocalVotes());
    fetchScriptVotes().then(setVotes);
  }, [refreshKey]);

  const vote = useCallback(async (id: string, type: "like" | "dislike") => {
    const prev = myVotes[id];
    const newMyVotes = { ...myVotes };

    if (prev === type) {
      delete newMyVotes[id];
      saveLocalVotes(newMyVotes);
      setMyVotes(newMyVotes);
      setVotes((cur) => {
        const base = cur[id] ?? { id, likes: 0, dislikes: 0 };
        return { ...cur, [id]: { ...base, [type === "like" ? "likes" : "dislikes"]: Math.max(0, (base[type === "like" ? "likes" : "dislikes"]) - 1) } };
      });
      await castScriptVote(id, type, -1);
    } else {
      if (prev) {
        setVotes((cur) => {
          const base = cur[id] ?? { id, likes: 0, dislikes: 0 };
          return { ...cur, [id]: { ...base, [prev === "like" ? "likes" : "dislikes"]: Math.max(0, (base[prev === "like" ? "likes" : "dislikes"]) - 1) } };
        });
        await castScriptVote(id, prev, -1);
      }
      newMyVotes[id] = type;
      saveLocalVotes(newMyVotes);
      setMyVotes(newMyVotes);
      setVotes((cur) => {
        const base = cur[id] ?? { id, likes: 0, dislikes: 0 };
        return { ...cur, [id]: { ...base, [type === "like" ? "likes" : "dislikes"]: (base[type === "like" ? "likes" : "dislikes"]) + 1 } };
      });
      await castScriptVote(id, type, 1);
    }
    setTimeout(() => setRefreshKey((k) => k + 1), 800);
  }, [myVotes]);

  return { votes, myVotes, vote };
}

function VoteBar({ id, votes, myVotes, vote }: {
  id: string;
  votes:   Record<string, ScriptVote>;
  myVotes: Record<string, "like" | "dislike">;
  vote:    (id: string, type: "like" | "dislike") => void;
}) {
  const v = votes[id] ?? { likes: 0, dislikes: 0 };
  const my = myVotes[id];

  if (!isSupabaseConfigured) return null;

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); void vote(id, "like"); }}
        className="flex items-center gap-1 px-2 py-0.5 rounded-sm font-game text-[9px] tracking-wider transition-all"
        style={{
          background: my === "like" ? "rgba(28,228,0,0.15)" : "rgba(255,255,255,0.03)",
          border:     `1px solid ${my === "like" ? "rgba(28,228,0,0.5)" : "#383838"}`,
          color:      my === "like" ? "#1CE400" : "#848484",
        }}
      >
        👍 {v.likes > 0 ? v.likes : ""}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); void vote(id, "dislike"); }}
        className="flex items-center gap-1 px-2 py-0.5 rounded-sm font-game text-[9px] tracking-wider transition-all"
        style={{
          background: my === "dislike" ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.03)",
          border:     `1px solid ${my === "dislike" ? "rgba(239,68,68,0.45)" : "#383838"}`,
          color:      my === "dislike" ? "#ef4444" : "#848484",
        }}
      >
        👎 {v.dislikes > 0 ? v.dislikes : ""}
      </button>
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const OPENER_PRESETS = [
  { id: "pre_1",  name: "POP Classique",         profil: "Défaut — tous profils",                    text: "« POP ! Allô, je suis bien avec le meilleur ostéo de [ville] ? »" },
  { id: "pre_2",  name: "L'Aveu Direct",          profil: "Profils méfiants, qui filtrent",            text: "« Allô [Prénom] ? Si je vous dit que c'est un appel de prospection, vous me raccrochez au nez ou vous me laissez 10 secondes ? »" },
  { id: "pre_3",  name: "Trigger Doctolib",       profil: "Profils avec beaucoup d'avis Doctolib",     text: "« Allô [Prénom] ? Vous avez 4.8 étoiles sur 80 avis, c'est solide. Par contre quand je tape «ostéo [ville]» sur Google, vous sortez nulle part. C'est pour ça que je vous appelle, vous me laissez 30 secondes ? »" },
  { id: "pre_4",  name: "Faux Numéro Confus",     profil: "Cabinets avec secrétariat, surbookés",      text: "« Allô ? Je suis bien chez Dr [Nom] ? L'ostéo ? ... Ah ouf. Bon, je vais être transparent : c'est un appel de prospection. Mais avant que vous raccrochiez, je vous propose un truc : 20 secondes pour expliquer, après c'est vous qui décidez. Deal ? »" },
  { id: "pre_5",  name: "Curiosité Chirurgicale", profil: "Seniors installés, se croient à l'abri",    text: "« Allô [Prénom] ? Sur 10 nouveaux patients, vous sauriez me dire combien viennent du bouche à oreille, combien de Google, combien de Doctolib ? ... La plupart des ostéos pensaient 80% bouche à oreille — quand on a tracké, c'était 40%. Le reste leur passait sous le nez. C'est pour ça que je vous appelle. 5 minutes ? »" },
  { id: "pre_6",  name: "Compliment Ultra Ciblé", profil: "Profils premium, nombreux avis",            text: "« Allô [Prénom] ? 4.8 sur 127 avis, tout en haut de [ville], franchement bravo. Mais quand je tape «ostéo [ville]» sur Google, vous sortez en 7e position. Vous avez 5 minutes pour que je vous montre ce que ça pourrait donner ? »" },
  { id: "pre_7",  name: "J'ai un Cadeau",         profil: "Leads froids qui détestent la vente",       text: "« Allô [Prénom] ? Je vous appelle pas pour vous vendre un truc tout de suite, je vous appelle pour vous offrir quelque chose. J'ai créé un site web complet pour votre cabinet, gratuitement, juste pour vous le montrer. 3 minutes ? »" },
  { id: "pre_8",  name: "Constat Factuel",         profil: "Ostéo, kiné, dentiste — profils concrets", text: "« Allô [Prénom] ? 30 secondes : j'ai audité les 50 ostéos de [ville], 78% n'apparaissent pas en page 1. Vous, vous êtes en [position], et c'est pas une fatalité, ça se règle. 5 minutes ? »" },
  { id: "pre_9",  name: "Patient Déçu",            profil: "Psy, hypno, sophro — profils empathiques",  text: "« Allô [Prénom] ? La semaine dernière, ma copine cherchait un ostéo à [ville]. Elle a pris RDV chez le 4e, qui avait un site moche mais référencé. Vous, votre Doctolib est top, mais sur Google vous existez pas. 5 minutes ? »" },
  { id: "pre_10", name: "Challenge Inversé",       profil: "Profils à ego, chefs de cabinet",           text: "« Allô [Prénom] ? Si je vous dis «Theralys», ça vous dit quelque chose ? On commence à équiper pas mal d'ostéos sur [région]. J'ai 3 questions rapides pour qualifier, ensuite je vous montre le site créé pour vous. Ça vous va ? »" },
  { id: "pre_11", name: "Le Confrère",             profil: "Dès que tu as un client sur la même zone",  text: "« Allô [Prénom] ? Je viens de finir d'installer le site de [Confrère sur même ville], on a doublé son trafic en 8 semaines. Il m'a dit «appelle [Prénom] aussi». Bon, il vous a pas vraiment recommandé parce que vous êtes concurrents (rire), mais j'ai trouvé que c'était une bonne idée. 5 minutes ? »" },
];

const SCRIPT_STEPS = [
  {
    tag: "OPENER", color: "#FF5500",
    text: "« Allô, je suis bien avec le meilleur ostéo de [VILLE] ? »",
    note: "(rire / « ah ah pas vraiment »)",
    objIdxs: [9, 3],
    presets: OPENER_PRESETS,
  },
  {
    tag: "PERMISSION", color: "#5DC7E5",
    text: "« Super. Si je vous dis que c'est un appel de prospection, vous jetez le téléphone par la fenêtre ou vous me laissez 10 petites secondes pour expliquer ? »",
    note: "(attendre la réponse)",
    objIdxs: [6, 3], presets: [] as typeof OPENER_PRESETS,
  },
  {
    tag: "ACCROCHE", color: "#1CE400",
    text: "« Cool, merci. J'étais en train de me promener sur internet, je cherchais un ostéo sur [VILLE], et j'ai vu que vous n'aviez pas de site web. Je me doute qu'on vous appelle déjà tout le temps pour vous en vendre un, hein ? »",
    note: "(réaction)",
    objIdxs: [0, 2, 1], presets: [] as typeof OPENER_PRESETS,
  },
  {
    tag: "DIFFÉRENCIATION", color: "#FF9500",
    text: "« Voilà, la grande différence avec les agences classiques, c'est que moi j'ai déjà pris la liberté de vous le créer directement, juste pour que vous voyiez à quoi ça ressemble. Vous avez 5 petites minutes pour y jeter un petit coup d'œil ? »",
    note: null,
    objIdxs: [4, 7, 3, 5, 8], presets: [] as typeof OPENER_PRESETS,
  },
  {
    tag: "SI OUI ✓", color: "#1CE400",
    text: "→ Tu envoies le lien WhatsApp ou SMS sur l'instant, tu restes au tél.",
    note: null,
    objIdxs: [] as number[], presets: [] as typeof OPENER_PRESETS,
  },
  {
    tag: "CLOSE RAPPEL", color: "#AE00FC",
    text: "« Top, alors je vous rappelle à 18h, je vous envoie le lien et je prends 5 minutes pour vous le montrer. »",
    note: null,
    objIdxs: [], presets: [] as typeof OPENER_PRESETS,
  },
];

const OBJECTIONS = [
  { trigger: "« J'ai déjà un site »", response: "Ah bon ? C'est marrant, je l'ai pas trouvé sur Google quand j'ai cherché ostéo [ville]. Vous savez à quelle position vous sortez exactement ? Parce que si vous êtes pas en page 1, c'est comme si vous existiez pas. C'est exactement ça que mon outil règle automatiquement." },
  { trigger: "« J'ai déjà plein de patients »", response: "Top, c'est ce que j'aime entendre. Sérieusement, si je peux vous ramener 5 à 10 nouveaux patients par mois en pilote automatique, vous me dites non ? Un patient qui annule à la dernière minute c'est 60 balles dans le vent. Avoir un peu de marge dans le planning, ça soulage." },
  { trigger: "« J'ai déjà Doctolib »", response: "Doctolib c'est très bien pour la prise de RDV, mais c'est pas votre site, c'est le leur. Vos patients tombent sur une page avec 12 autres ostéos juste à côté de vous. Avec votre propre site, vous captez le patient AVANT qu'il compare. Et nous on est intégré à Doctolib, vous gardez vos habitudes." },
  { trigger: "« Pas le temps là »", response: "Je vous prends en dépourvu, c'est de ma faute. Quand est-ce que ça vous arrange ce soir ou demain ? Vers quelle heure ? Si je vous dis 18h c'est bon ou pas ?" },
  { trigger: "« C'est cher »", response: "48 euros par mois, c'est UN patient. Si je vous en ramène pas au moins 1 dans le mois, vous résiliez. Mais regardez les avis Trustpilot, on est à 4.9/5 sur 40 et quelques thérapeutes. C'est pas un hasard." },
  { trigger: "« Je veux réfléchir »", response: "Carré, je comprends. Mais juste, qu'est-ce qui empêche de tester gratuitement pendant 7 jours pendant que vous réfléchissez ? Vous parlez à votre associé, vous lui montrez le site en vrai, et au bout de 7 jours vous décidez. Y'a aucun engagement. Ça vous coûte rien." },
  { trigger: "« Envoyez-moi un mail »", response: "Avec plaisir, mais si je vous envoie un PDF générique ça finit dans la corbeille. Donnez-moi 2 minutes là maintenant, je vous envoie le lien direct du site déjà créé pour vous, ça vous prend 30 secondes à regarder, et après vous décidez. C'est plus utile comme ça non ?" },
  { trigger: "« C'est ma secrétaire qui gère »", response: "C'est votre secrétaire qui décide de comment vous remplissez votre agenda et combien vous gagnez à la fin du mois ? (rire) Je vais vous montrer en 2 minutes pour que vous puissiez décider en connaissance de cause, et après vous lui transférerez si vous voulez." },
  { trigger: "« Rappelez-moi dans 6 mois »", response: "Je vais le faire. Mais juste, soyez franc avec moi : pourquoi 6 mois ? Parce que si c'est pour repousser, autant tester gratuitement 7 jours pendant ce temps. Y'a aucun engagement, aucun prélèvement. Ça vous coûte rien." },
  { trigger: "« C'est pas éthique »", response: "Je vous comprends, c'est pour ça que j'ai été cash dès le début. Mais c'est pas plus éthique d'avoir un site bien fait pour qu'un patient qui a mal au dos vous trouve, plutôt que de le laisser aller chez un concurrent moins compétent que vous ? Mon outil sert à ce que les bons thérapeutes soient trouvés." },
];

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className="flex-shrink-0 px-2 py-0.5 rounded-sm font-game text-[9px] tracking-wider transition-all"
      style={{
        background: copied ? "rgba(28,228,0,0.12)" : "rgba(255,255,255,0.04)",
        border:     `1px solid ${copied ? "rgba(28,228,0,0.4)" : "#383838"}`,
        color:      copied ? "#1CE400" : "#848484",
      }}
      title="Copier"
    >
      {copied ? "✓" : "COPIER"}
    </button>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────

type VoteProps = { votes: Record<string, ScriptVote>; myVotes: Record<string, "like" | "dislike">; vote: (id: string, type: "like" | "dislike") => void; };

interface ScriptSectionProps extends VoteProps {
  variants:       ScriptVariant[];
  activeVariants: Record<string, string>;
  playerName:     string;
  onLike:         (id: string) => void;
  onDislike:      (id: string) => void;
  onDelete:       (id: string) => void;
  onSetActive:    (step_id: string, variant_id: string | null) => void;
  onAdd:          (step_id: string, text: string) => Promise<void>;
}

function ScriptSection({ votes, myVotes, vote, variants, activeVariants, playerName, onLike, onDislike, onDelete, onSetActive, onAdd }: ScriptSectionProps) {
  const [openVarFor,  setOpenVarFor]  = useState<number | null>(null);
  const [addingFor,   setAddingFor]   = useState<number | null>(null);
  const [draftText,   setDraftText]   = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [openObj,     setOpenObj]     = useState<string | null>(null);

  async function handleSubmit(i: number, step_id: string) {
    if (!draftText.trim()) return;
    setSubmitting(true);
    await onAdd(step_id, draftText.trim());
    setDraftText("");
    setAddingFor(null);
    setSubmitting(false);
  }

  return (
    <div className="space-y-2">
      {SCRIPT_STEPS.map((step, i) => {
        const step_id      = `script_${i}`;
        const activeVarId  = activeVariants[step_id];
        const activePreset = step.presets.find((p) => p.id === activeVarId);
        const activeComVar = !activePreset && activeVarId ? variants.find((v) => v.id === activeVarId) : null;
        const activeName   = activePreset?.name ?? activeComVar?.author ?? null;
        const displayText  = activePreset?.text ?? activeComVar?.text ?? step.text;
        const stepVars     = variants.filter((v) => v.step_id === step_id);
        const isVarOpen    = openVarFor === i;

        return (
          <div
            key={i}
            className="rounded-sm p-4"
            style={{
              background:  CARD_BG,
              border:      `1px solid ${BORDER}`,
              borderLeft:  `3px solid ${activeName ? (activePreset ? step.color : authorColor(activeName)) : step.color}`,
            }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-game text-[9px] tracking-widest px-2 py-0.5 rounded-sm flex-shrink-0"
                  style={{ color: step.color, background: `${step.color}14` }}
                >
                  {step.tag}
                </span>
                {activeName && (
                  <span
                    className="font-game text-[9px] tracking-widest px-2 py-0.5 rounded-sm flex-shrink-0"
                    style={{
                      color:      activePreset ? step.color : authorColor(activeName),
                      background: activePreset ? `${step.color}18` : `${authorColor(activeName)}18`,
                      border:     `1px solid ${activePreset ? `${step.color}40` : `${authorColor(activeName)}40`}`,
                    }}
                  >
                    {activeName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <VoteBar id={`script_${i}`} votes={votes} myVotes={myVotes} vote={vote} />
                <CopyBtn text={displayText} />
              </div>
            </div>

            {/* Text */}
            <p style={{ color: "#FFFFFF", fontSize: "0.88rem", lineHeight: 1.7, margin: 0 }}>
              {displayText}
            </p>
            {!activeName && step.note && (
              <p style={{ color: "#848484", fontSize: "0.72rem", marginTop: "6px", fontStyle: "italic" }}>
                {step.note}
              </p>
            )}

            {/* Objection shortcuts */}
            {step.objIdxs.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1.5">
                  {step.objIdxs.map((oi) => {
                    const obj    = OBJECTIONS[oi];
                    const key    = `${i}_${oi}`;
                    const isOpen = openObj === key;
                    return (
                      <button
                        key={oi}
                        onClick={() => setOpenObj(isOpen ? null : key)}
                        className="px-2 py-0.5 rounded-sm font-game text-[9px] tracking-wider transition-all"
                        style={{
                          background: isOpen ? "rgba(93,199,229,0.12)" : "rgba(255,255,255,0.04)",
                          border:     `1px solid ${isOpen ? "rgba(93,199,229,0.45)" : "#383838"}`,
                          color:      isOpen ? "#5DC7E5" : "#848484",
                        }}
                      >
                        {obj.trigger}
                      </button>
                    );
                  })}
                </div>
                {step.objIdxs.map((oi) => {
                  const obj    = OBJECTIONS[oi];
                  const key    = `${i}_${oi}`;
                  if (openObj !== key) return null;
                  return (
                    <div
                      key={oi}
                      className="mt-2 rounded-sm px-3 py-2.5"
                      style={{ background: "rgba(93,199,229,0.06)", border: "1px solid rgba(93,199,229,0.2)" }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-game text-[9px] tracking-widest" style={{ color: "#5DC7E5" }}>RÉPONSE</span>
                        <CopyBtn text={obj.response} />
                      </div>
                      <p style={{ color: "#D0D0D0", fontSize: "0.82rem", lineHeight: 1.65, margin: 0 }}>
                        {obj.response}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Variants toggle */}
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                <button
                  onClick={() => { setOpenVarFor(isVarOpen ? null : i); setAddingFor(null); setDraftText(""); }}
                  className="font-game text-[9px] tracking-widest transition-colors"
                  style={{ color: isVarOpen ? "#FF5500" : "#686868", background: "transparent", border: "none", cursor: "pointer" }}
                >
                  {isVarOpen ? "▼" : "▶"} VARIANTES ({step.presets.length + stepVars.length})
                </button>

                {isVarOpen && (
                  <div className="mt-2 space-y-2">
                    {/* Official presets */}
                    {step.presets.map((p) => {
                      const isActive = activeVarId === p.id;
                      return (
                        <div key={p.id} className="rounded-sm p-3"
                          style={{ background: isActive ? `${step.color}0a` : "#1a1a1a", border: `1px solid ${isActive ? `${step.color}40` : "#2e2e2e"}` }}
                        >
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-game text-[9px] tracking-widest px-1.5 py-0.5 rounded-sm"
                              style={{ color: step.color, background: `${step.color}18`, border: `1px solid ${step.color}30` }}>
                              {p.name}
                            </span>
                            <span style={{ color: "#686868", fontSize: "0.65rem", flex: 1 }}>{p.profil}</span>
                            <div className="flex items-center gap-1.5">
                              <CopyBtn text={p.text} />
                              <button
                                onClick={() => onSetActive(step_id, isActive ? null : p.id)}
                                className="px-2 py-0.5 rounded-sm font-game text-[9px] tracking-wider transition-all"
                                style={{
                                  background: isActive ? `${step.color}20` : "rgba(255,255,255,0.03)",
                                  border:     `1px solid ${isActive ? `${step.color}60` : "#383838"}`,
                                  color:      isActive ? step.color : "#848484",
                                }}
                              >
                                {isActive ? "✓ ACTIF" : "UTILISER"}
                              </button>
                            </div>
                          </div>
                          <p style={{ color: "#C0C0C0", fontSize: "0.82rem", lineHeight: 1.65, margin: 0 }}>{p.text}</p>
                        </div>
                      );
                    })}

                    {/* Community variants */}
                    {stepVars.length > 0 && (
                      <div className="font-game text-[9px] tracking-widest pt-1" style={{ color: "#484848" }}>
                        — COMMUNAUTAIRES —
                      </div>
                    )}
                    {stepVars.map((v) => {
                      const isActive = activeVarId === v.id;
                      const col      = authorColor(v.author);
                      return (
                        <div
                          key={v.id}
                          className="rounded-sm p-3"
                          style={{
                            background: isActive ? `${col}0a` : "#1a1a1a",
                            border:     `1px solid ${isActive ? `${col}40` : "#2e2e2e"}`,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span
                              className="font-game text-[9px] tracking-widest px-1.5 py-0.5 rounded-sm"
                              style={{ color: col, background: `${col}18`, border: `1px solid ${col}30` }}
                            >
                              {v.author}
                            </span>
                            <div className="flex items-center gap-1.5 ml-auto">
                              <button
                                onClick={() => onLike(v.id)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-sm font-game text-[9px] tracking-wider transition-all"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #383838", color: "#848484" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#1CE400"; e.currentTarget.style.borderColor = "rgba(28,228,0,0.4)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "#848484"; e.currentTarget.style.borderColor = "#383838"; }}
                              >
                                👍 {v.likes > 0 ? v.likes : ""}
                              </button>
                              <button
                                onClick={() => onDislike(v.id)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-sm font-game text-[9px] tracking-wider transition-all"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #383838", color: "#848484" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "#848484"; e.currentTarget.style.borderColor = "#383838"; }}
                              >
                                👎 {(v.dislikes ?? 0) > 0 ? v.dislikes : ""}
                              </button>
                              <button
                                onClick={() => onSetActive(step_id, isActive ? null : v.id)}
                                className="px-2 py-0.5 rounded-sm font-game text-[9px] tracking-wider transition-all"
                                style={{
                                  background: isActive ? `${col}20` : "rgba(255,255,255,0.03)",
                                  border:     `1px solid ${isActive ? `${col}60` : "#383838"}`,
                                  color:      isActive ? col : "#848484",
                                }}
                              >
                                {isActive ? "✓ ACTIF" : "UTILISER"}
                              </button>
                              <button
                                onClick={() => onDelete(v.id)}
                                className="px-1.5 py-0.5 rounded-sm transition-all"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #383838", color: "#686868", fontSize: "0.75rem" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "#686868"; e.currentTarget.style.borderColor = "#383838"; }}
                                title="Supprimer"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                          <p style={{ color: "#C0C0C0", fontSize: "0.82rem", lineHeight: 1.65, margin: 0 }}>
                            {v.text}
                          </p>
                        </div>
                      );
                    })}

                    {/* Add variant */}
                    {addingFor === i ? (
                      <div
                        className="rounded-sm p-3 space-y-2"
                        style={{ background: "#1a1a1a", border: `1px solid rgba(255,85,0,0.25)` }}
                      >
                        <div className="font-game text-[9px] tracking-widest" style={{ color: "#FF5500" }}>
                          MA VARIANTE — {playerName || "ANONYME"}
                        </div>
                        <textarea
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          placeholder="Tape ta version ici…"
                          rows={3}
                          style={{
                            width:        "100%",
                            background:   "#232323",
                            border:       "1px solid #383838",
                            borderRadius: "3px",
                            padding:      "0.5rem 0.75rem",
                            color:        "#FFFFFF",
                            fontSize:     "0.82rem",
                            lineHeight:   1.6,
                            outline:      "none",
                            resize:       "vertical",
                          }}
                          onFocus={(e) => { e.target.style.borderColor = "#FF5500"; }}
                          onBlur={(e)  => { e.target.style.borderColor = "#383838"; }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSubmit(i, step_id)}
                            disabled={submitting || !draftText.trim()}
                            className="px-3 py-1.5 rounded-sm font-game text-[9px] tracking-wider"
                            style={{
                              background: "rgba(255,85,0,0.15)",
                              border:     "1px solid rgba(255,85,0,0.5)",
                              color:      "#FF5500",
                              opacity:    submitting || !draftText.trim() ? 0.5 : 1,
                              cursor:     submitting || !draftText.trim() ? "not-allowed" : "pointer",
                            }}
                          >
                            {submitting ? "..." : "PUBLIER"}
                          </button>
                          <button
                            onClick={() => { setAddingFor(null); setDraftText(""); }}
                            className="px-3 py-1.5 rounded-sm font-game text-[9px] tracking-wider"
                            style={{ background: "transparent", border: "1px solid #383838", color: "#848484" }}
                          >
                            ANNULER
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingFor(i)}
                        className="w-full py-2 rounded-sm font-game text-[9px] tracking-widest transition-all"
                        style={{
                          background: "transparent",
                          border:     "1px dashed #383838",
                          color:      "#686868",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,85,0,0.4)"; e.currentTarget.style.color = "#FF5500"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#383838"; e.currentTarget.style.color = "#686868"; }}
                      >
                        + AJOUTER MA VARIANTE
                      </button>
                    )}
                  </div>
                )}
              </div>
          </div>
        );
      })}
    </div>
  );
}


// ── Links section ─────────────────────────────────────────────────────────────

const LINKS = [
  {
    label:    "RDV CLOSEUR",
    sublabel: "Calendly — Audit projet web Theralys",
    url:      "https://calendly.com/d/ctn4-3gj-rzk/audit-projet-web-theralys",
    color:    "#5DC7E5",
    embed:    true,
  },
];

function LinksSection() {
  const [embedOpen, setEmbedOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {LINKS.map((link, i) => (
        <div key={i} className="rounded-sm overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 p-4 flex-wrap">
            <div>
              <div className="font-game text-xs tracking-widest mb-0.5" style={{ color: link.color }}>
                {link.label}
              </div>
              <div style={{ color: "#848484", fontSize: "0.75rem" }}>{link.sublabel}</div>
            </div>
            <div className="flex items-center gap-2">
              <CopyBtn text={link.url} />
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-sm font-game text-[9px] tracking-wider transition-all"
                style={{
                  background: `${link.color}15`,
                  border:     `1px solid ${link.color}50`,
                  color:      link.color,
                  textDecoration: "none",
                }}
              >
                OUVRIR ↗
              </a>
              {link.embed && (
                <button
                  onClick={() => setEmbedOpen(embedOpen === i ? null : i)}
                  className="px-3 py-1.5 rounded-sm font-game text-[9px] tracking-wider transition-all"
                  style={{
                    background: embedOpen === i ? "rgba(255,85,0,0.15)" : "rgba(255,255,255,0.04)",
                    border:     `1px solid ${embedOpen === i ? "rgba(255,85,0,0.5)" : "#383838"}`,
                    color:      embedOpen === i ? "#FF5500" : "#848484",
                  }}
                >
                  {embedOpen === i ? "FERMER" : "EMBED"}
                </button>
              )}
            </div>
          </div>

          {/* Embed */}
          {embedOpen === i && (
            <div style={{ borderTop: `1px solid ${BORDER}` }}>
              <iframe
                src={link.url}
                width="100%"
                height="700"
                frameBorder="0"
                style={{ display: "block" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Voicemail section ─────────────────────────────────────────────────────────

const VOICEMAIL_SCRIPTS = [
  {
    tag: "VERSION COURTE", color: "#FF5500",
    text: "« Bonjour [Prénom], c'est [Votre prénom] de Theralys. Je vous ai préparé quelque chose pour votre cabinet — ça prend 3 minutes à regarder et je pense que ça va vous intéresser. Je vous rappelle ce soir vers [HEURE], sinon n'hésitez pas à me rappeler au [NUMÉRO]. Bonne journée ! »",
    note: "~15 secondes — idéal si tu veux rappeler toi-même",
  },
  {
    tag: "VERSION CURIOSITÉ", color: "#5DC7E5",
    text: "« Allô [Prénom], c'est [Votre prénom] de Theralys. J'ai fait quelque chose ce matin spécialement pour vous — c'est gratuit, ça prend 2 minutes, et je pense honnêtement que vous allez être surpris. Je vous rappelle demain vers [HEURE] ou rappellez-moi au [NUMÉRO]. À très vite ! »",
    note: "~20 secondes — crée de la curiosité sans dévoiler l'offre",
  },
  {
    tag: "VERSION RAPPEL IMMÉDIAT", color: "#1CE400",
    text: "« Bonjour [Prénom], [Votre prénom] de Theralys. Je vous appelle parce que j'ai vu votre cabinet sur Google et j'avais quelque chose de concret à vous montrer — pas un pitch, quelque chose que j'ai déjà créé pour vous. Je vous laisse mon numéro : [NUMÉRO]. À très vite, bonne journée ! »",
    note: "~20 secondes — pour inciter le prospect à rappeler lui-même",
  },
  {
    tag: "VERSION CONFRÈRE", color: "#AE00FC",
    text: "« Allô [Prénom], c'est [Votre prénom] de Theralys. Je viens de terminer le site de [Confrère / cabinet de la même ville] — il m'a dit de vous appeler aussi. Je vous rappelle à [HEURE] ou rappellez-moi au [NUMÉRO]. À bientôt ! »",
    note: "~15 secondes — à utiliser dès que vous avez un client sur la même zone",
  },
];

function VoicemailSection() {
  return (
    <div className="space-y-3">
      <div
        className="rounded-sm p-3 flex items-start gap-2"
        style={{ background: "rgba(255,85,0,0.06)", border: "1px solid rgba(255,85,0,0.2)" }}
      >
        <span style={{ fontSize: "0.8rem" }}>💡</span>
        <p style={{ color: "#848484", fontSize: "0.75rem", lineHeight: 1.6, margin: 0 }}>
          Ne jamais dévoiler l&apos;offre sur messagerie. Crée la curiosité, laisse un horaire de rappel précis. Max 20 secondes.
        </p>
      </div>

      <div className="space-y-2">
        {VOICEMAIL_SCRIPTS.map((s, i) => (
          <div
            key={i}
            className="rounded-sm p-4"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${s.color}` }}
          >
            <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
              <span
                className="font-game text-[9px] tracking-widest px-2 py-0.5 rounded-sm flex-shrink-0"
                style={{ color: s.color, background: `${s.color}14` }}
              >
                {s.tag}
              </span>
              <CopyBtn text={s.text} />
            </div>
            <p style={{ color: "#FFFFFF", fontSize: "0.88rem", lineHeight: 1.7, margin: 0 }}>
              {s.text}
            </p>
            {s.note && (
              <p style={{ color: "#848484", fontSize: "0.72rem", marginTop: "6px", fontStyle: "italic" }}>
                {s.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "script",     label: "Script",     icon: "📞", color: "#FF5500" },
  { id: "messagerie", label: "Messagerie", icon: "📬", color: "#AE00FC" },
  { id: "liens",      label: "Liens",      icon: "🔗", color: "#5DC7E5" },
];

export default function ScriptTab() {
  const [activeSection,  setActiveSection]  = useState("script");
  const { votes, myVotes, vote }            = useVotes();
  const { state }                           = useGame();

  const [scriptVariants,  setScriptVariants]  = useState<ScriptVariant[]>([]);
  const [activeVariants,  setActiveVariants]  = useState<Record<string, string>>({});

  useEffect(() => {
    setActiveVariants(loadActiveVariants());
    if (isSupabaseConfigured) {
      fetchScriptVariants().then(setScriptVariants);
    }
  }, []);

  function handleLikeVariant(id: string) {
    setScriptVariants((cur) => cur.map((v) => v.id === id ? { ...v, likes: v.likes + 1 } : v));
    void likeScriptVariant(id);
  }

  function handleDislikeVariant(id: string) {
    setScriptVariants((cur) => cur.map((v) => v.id === id ? { ...v, dislikes: (v.dislikes ?? 0) + 1 } : v));
    void dislikeScriptVariant(id);
  }

  function handleDeleteVariant(id: string) {
    setScriptVariants((cur) => cur.filter((v) => v.id !== id));
    // Also clear active if it was this variant
    setActiveVariants((cur) => {
      const next = { ...cur };
      for (const key of Object.keys(next)) { if (next[key] === id) delete next[key]; }
      saveActiveVariants(next);
      return next;
    });
    void deleteScriptVariant(id);
  }

  function handleSetActive(step_id: string, variant_id: string | null) {
    const next = { ...activeVariants };
    if (variant_id === null) delete next[step_id];
    else next[step_id] = variant_id;
    setActiveVariants(next);
    saveActiveVariants(next);
  }

  async function handleAddVariant(step_id: string, text: string) {
    const author = state.playerName || "Anonyme";
    const result = await addScriptVariant(step_id, author, text);
    if (result) setScriptVariants((cur) => [...cur, result]);
  }

  return (
    <div className="space-y-3 max-w-3xl mx-auto">

      {/* Header */}
      <div className="rounded-sm p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-game text-lg text-white">SCRIPT THERALYS</h2>
            <p style={{ color: "#848484", fontSize: "0.72rem" }}>Référence complète pour tes appels</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: "APPEL", color: "#FF5500", icon: "📞" },
              { label: "RDV",   color: "#1CE400", icon: "🎯" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-1.5">
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-sm"
                  style={{ background: `${step.color}12`, border: `1px solid ${step.color}30` }}
                >
                  <span style={{ fontSize: "0.7rem" }}>{step.icon}</span>
                  <span className="font-game text-[10px]" style={{ color: step.color }}>{step.label}</span>
                </div>
                {i < 1 && <span style={{ color: "#686868", fontSize: "0.7rem" }}>→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1.5">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className="flex-1 py-2 rounded-sm font-game text-[10px] tracking-wider transition-all duration-100"
            style={{
              background: activeSection === s.id ? s.color : CARD_BG,
              border:     `1px solid ${activeSection === s.id ? s.color : BORDER}`,
              color:      activeSection === s.id ? "#000" : "#C0C0C0",
            }}
          >
            {s.icon} {s.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSection === "script" && (
        <ScriptSection
          votes={votes} myVotes={myVotes} vote={vote}
          variants={scriptVariants}
          activeVariants={activeVariants}
          playerName={state.playerName}
          onLike={handleLikeVariant}
          onDislike={handleDislikeVariant}
          onDelete={handleDeleteVariant}
          onSetActive={handleSetActive}
          onAdd={handleAddVariant}
        />
      )}
      {activeSection === "messagerie" && <VoicemailSection />}
      {activeSection === "liens"      && <LinksSection />}
    </div>
  );
}
