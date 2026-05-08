"use client";

import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const SECTIONS: Section[] = [
  { id: "script", label: "Script Principal", icon: "📞", color: "#3b82f6" },
  { id: "pitch", label: "Pitch Closing", icon: "💰", color: "#f59e0b" },
  { id: "objections", label: "Banque d'Objections", icon: "🛡️", color: "#8b5cf6" },
  { id: "variants", label: "Variantes d'Opener", icon: "🎯", color: "#22c55e" },
];

// ─── Script content ─────────────────────────────────────────────────────────

const SCRIPT_STEPS = [
  {
    tag: "OPENER",
    color: "#3b82f6",
    text: "« Allô, je suis bien avec le meilleur ostéo de [ville] ? »",
    note: "(rire / « ah ah pas vraiment »)",
  },
  {
    tag: "PERMISSION",
    color: "#8b5cf6",
    text: "« Super. Si je vous dis que c'est un appel de prospection, vous jetez le téléphone par la fenêtre ou vous me laissez 10 petites secondes pour expliquer ? »",
    note: "(attendre)",
  },
  {
    tag: "ACCROCHE",
    color: "#22c55e",
    text: "« Cool, merci. Je vous explique très très rapidement. J'étais en train de me promener sur internet, je cherchais un ostéo sur [ville], et j'ai vu que vous n'aviez pas de site web. Je me doute qu'on vous appelle déjà tout le temps pour vous en vendre un, hein ? »",
    note: "(réaction)",
  },
  {
    tag: "DIFFÉRENCIATION",
    color: "#f59e0b",
    text: "« Voilà, eh bah la grande différence avec les agences classiques, c'est que moi j'ai déjà pris la liberté de vous le créer directement, juste pour que vous voyiez à quoi ça ressemble. Vous avez 5 petites minutes pour y jeter un petit coup d'œil ? »",
    note: null,
  },
  {
    tag: "SI OUI",
    color: "#22c55e",
    text: "→ Tu envoies le lien WhatsApp ou SMS sur l'instant, tu restes au tél.",
    note: null,
  },
  {
    tag: "SI NON",
    color: "#ef4444",
    text: "« Pas de souci, je vous prends en dépourvu, c'est de ma faute. Quand est-ce que vous finissez vos consults aujourd'hui, vers quelle heure par exemple ? Si je vous dis 18h c'est bon ou pas ? »",
    note: "(négocier le créneau précis)",
  },
  {
    tag: "CLOSE RAPPEL",
    color: "#f59e0b",
    text: "« Top, alors je vous rappelle à 18h, je vous envoie le lien et je prends 5 minutes pour vous le montrer. »",
    note: null,
  },
];

const PITCH_STEPS = [
  {
    tag: "SITE",
    color: "#3b82f6",
    text: "« Voilà, c'est en ligne là, regardez. Vous avez votre nom, votre photo, vos spécialités, l'adresse de votre cab. Et le truc important, c'est que c'est pas juste un site vitrine. Y'a un moteur derrière qui publie tout seul des articles SEO chaque semaine, ciblés sur «ostéo [ville]», «mal de dos [ville]», etc, pour que vous remontiez en première page Google sans rien faire. »",
    note: null,
  },
  {
    tag: "CHIFFRES",
    color: "#22c55e",
    text: "« En moyenne, nos thérapeutes prennent +34% de visibilité locale et 2,4 fois plus de clics qu'avec un site classique. C'est connecté direct à Doctolib donc le bouton «prendre rendez-vous» amène le patient sur votre agenda, vous changez rien à votre habitude. »",
    note: null,
  },
  {
    tag: "PRIX",
    color: "#f59e0b",
    text: "« Concrètement, les agences vous facturent 1500 à 3000 euros pour un site qui prend la poussière au bout de 6 mois. Moi c'est 48€/mois, tout inclus — hébergement, articles, mises à jour, suivi des positions Google. Pas d'engagement. Et surtout, je vous offre 7 jours gratuits : vous testez, si ça vous ramène pas de patients, vous résiliez en 1 clic et c'est gratuit. Ça me paraît carré non ? »",
    note: "(silence — laisser parler)",
  },
  {
    tag: "CLOSE",
    color: "#ef4444",
    text: "« On démarre les 7 jours d'essai aujourd'hui ou demain matin, vous préférez quoi ? »",
    note: null,
  },
];

// ─── Objections ────────────────────────────────────────────────────────────────

const OBJECTIONS = [
  {
    trigger: "« J'ai déjà un site »",
    response:
      "Ah bon ? C'est marrant, je l'ai pas trouvé sur Google quand j'ai cherché ostéo [ville]. Vous savez à quelle position vous sortez exactement quand quelqu'un cherche votre métier dans votre ville ? Parce que si vous êtes pas en page 1, c'est comme si vous existiez pas. Et c'est exactement ça que mon outil règle automatiquement.",
  },
  {
    trigger: "« J'ai déjà plein de patients »",
    response:
      "Top monsieur, c'est ce que j'aime entendre. Sérieusement, si je peux vous ramener 5 à 10 nouveaux patients par mois en pilote automatique, vous me dites non ? Vous savez aussi bien que moi qu'un patient qui annule à la dernière minute c'est 60 balles dans le vent. Avoir un peu de marge dans le planning, ça soulage.",
  },
  {
    trigger: "« J'ai déjà Doctolib »",
    response:
      "Oui, Doctolib c'est très bien pour la prise de RDV, mais Doctolib c'est pas votre site, c'est le leur. Vos patients tombent sur la page Doctolib avec 12 autres ostéos juste à côté de vous. Avec votre propre site, vous captez le patient AVANT qu'il compare. Et nous on est intégré à Doctolib, donc vous gardez vos habitudes.",
  },
  {
    trigger: "« Pas le temps là »",
    response:
      "Je vous prends en dépourvu, c'est de ma faute. Quand est-ce que ça vous arrange ce soir ou demain ? Vers quelle heure par exemple ? Si je vous dis 18h c'est bon ou pas ?",
  },
  {
    trigger: "« C'est cher »",
    response:
      "48 euros par mois, c'est UN patient. Si je vous en ramène pas au moins 1 dans le mois, vous résiliez. Mais regardez les avis Trustpilot, on est à 4.9/5 sur 40 et quelques thérapeutes. C'est pas un hasard.",
  },
  {
    trigger: "« Je veux réfléchir / en parler à mon associé »",
    response:
      "Carré, je comprends. Mais juste, qu'est-ce qui empêche de tester gratuitement pendant 7 jours pendant que vous réfléchissez ? Vous parlez à votre associé, vous lui montrez le site en vrai, et au bout de 7 jours vous décidez. Y'a aucun engagement, aucun prélèvement à part les 7 jours. Ça vous coûte rien.",
  },
  {
    trigger: "« Envoyez-moi un mail »",
    response:
      "Avec plaisir, mais juste, si je vous envoie un PDF générique c'est exactement ce que toutes les agences font et ça finit dans la corbeille. Donnez-moi 2 minutes là maintenant, je vous envoie le lien direct du site déjà créé pour vous, ça vous prend 30 secondes à regarder, et après vous décidez. C'est plus utile pour vous comme ça non ?",
  },
  {
    trigger: "« C'est ma secrétaire qui gère »",
    response:
      "Ah top, alors juste pour qu'on se comprenne : c'est votre secrétaire qui décide de comment vous remplissez votre agenda et combien vous gagnez à la fin du mois ? (rire) Justement, je vais vous montrer en 2 minutes pour que vous puissiez décider en connaissance de cause, et après vous lui transférerez si vous voulez.",
  },
  {
    trigger: "« C'est pas éthique de me démarcher »",
    response:
      "Je vous comprends totalement, c'est pour ça que j'ai été cash dès le début sur le fait que c'est un appel de prospection. Mais permettez-moi : c'est pas plus éthique d'avoir un site bien fait pour qu'un patient qui a mal au dos vous trouve, plutôt que de le laisser tomber chez un concurrent moins compétent que vous parce que lui il a investi dans son SEO ? Mon outil sert littéralement à ce que les bons thérapeutes soient trouvés.",
  },
  {
    trigger: "« Rappelez-moi dans 6 mois »",
    response:
      "Je vais le faire, promis. Mais juste, soyez franc avec moi : pourquoi 6 mois ? Y'a un truc qui doit se passer entre temps ou c'est juste pour repousser ? Parce que si c'est juste pour repousser, autant qu'on règle le sujet maintenant, vous testez 7 jours gratuits, et dans 6 mois vous aurez 6 mois de patients en plus.",
  },
];

// ─── Opener Variants ───────────────────────────────────────────────────────────

const VARIANTS = [
  {
    num: 1,
    name: "POP Classique",
    profil: "Défaut — tous profils",
    script:
      "« POP ! Allô, je suis bien avec le meilleur ostéo de [ville] ? »",
  },
  {
    num: 2,
    name: "L'Aveu Direct",
    profil: "Profils méfiants, qui filtrent",
    script:
      "« Allô [Prénom] ? Bonjour, si je vous dis que c'est un appel de prospection, vous me raccrochez au nez ou vous me laissez 10 secondes ? »",
  },
  {
    num: 3,
    name: "Trigger Doctolib",
    profil: "Profils avec beaucoup d'avis Doctolib",
    script:
      "« Allô [Prénom] ? Bonjour, vite fait, j'ai vu votre profil Doctolib, vous avez 4.8 étoiles sur 80 avis, c'est super solide. Par contre quand je tape «ostéo [ville]» sur Google, vous sortez nulle part en page 1. C'est pour ça que je vous appelle, vous me laissez 30 secondes ? »",
  },
  {
    num: 4,
    name: "Faux Numéro Confus",
    profil: "Cabinets avec secrétariat, profils surbookés",
    script:
      "« Allô ? Euh attendez, je suis bien chez Dr [Nom] ? L'ostéo ? ... Ah ouf, j'ai cru que je m'étais trompé. Bon écoutez, je vais être totalement transparent avec vous, c'est pas un patient qui appelle, c'est un appel de prospection. Mais avant que vous raccrochiez, je vous propose un truc : je vous explique en 20 secondes pourquoi je vous appelle, et après c'est vous qui décidez. Deal ? »",
  },
  {
    num: 5,
    name: "Curiosité Chirurgicale",
    profil: "Seniors installés depuis longtemps, se croient à l'abri",
    script:
      "« Allô [Prénom] ? Bonjour, c'est Théo, j'ai une question rapide sur 30 secondes : aujourd'hui, sur 10 nouveaux patients qui prennent rendez-vous chez vous, vous sauriez me dire combien viennent du bouche à oreille, combien viennent de Google, et combien viennent de Doctolib ? ... Ok intéressant. La raison pour laquelle je vous demande ça, c'est que la plupart des ostéos que je côtoie étaient persuadés que 80% venaient du bouche à oreille, et quand on a tracké, c'était plutôt 40%. Le reste leur passait sous le nez parce qu'ils avaient pas de site qui captait. C'est pour ça que je vous appelle. Vous avez 5 minutes ? »",
  },
  {
    num: 6,
    name: "Compliment Ultra Ciblé",
    profil: "Profils premium, nombreux avis Doctolib",
    script:
      "« Allô [Prénom] ? Bonjour, désolé je vous dérange 30 secondes. Je viens de regarder votre Doctolib, 4.8 sur 127 avis, c'est tout en haut de votre catégorie sur [ville], franchement bravo. ... C'est exactement pour ça que je vous appelle. Vous êtes excellent dans votre métier, mais quand je tape «ostéo [ville]» sur Google, vous sortez en 7e position. C'est dingue. Vous avez 5 minutes pour que je vous montre ce que ça pourrait donner si on règle ça ? »",
  },
  {
    num: 7,
    name: "J'ai un Cadeau",
    profil: "Leads froids qui détestent la vente directe",
    script:
      "« Allô [Prénom] ? Bonjour, c'est Théo. Je vous appelle pas pour vous vendre un truc tout de suite, je vous appelle pour vous offrir quelque chose. J'ai créé un site web complet pour votre cabinet, gratuitement, juste pour vous le montrer. Que vous le preniez ou pas après c'est votre choix. Vous avez 3 minutes pour qu'on regarde ensemble ? »",
  },
  {
    num: 8,
    name: "Constat Factuel (Audit)",
    profil: "Ostéo, kiné, dentiste — profils concrets, chiffrés",
    script:
      "« Allô [Prénom] ? Bonjour, c'est Théo, sur 30 secondes : je sors d'un audit sur les 50 ostéos référencés sur [ville], et 78% d'entre eux n'apparaissent pas en première page Google quand quelqu'un cherche «ostéo [ville]». Vous, vous êtes en [position réelle], et c'est pas une fatalité, ça se règle. Vous avez 5 minutes pour que je vous montre comment ? »",
  },
  {
    num: 9,
    name: "Patient Déçu (Storytelling)",
    profil: "Psy, hypnothérapeutes, sophrologues — profils empathiques",
    script:
      "« Allô [Prénom] ? Bonjour, sur 20 secondes : la semaine dernière, ma copine cherchait un ostéo à [ville] sur Google. Elle est tombée sur 3 cabinets sans site, et finalement a pris RDV chez le 4e, qui avait un site moche mais référencé. Le truc c'est que vous, votre Doctolib est top, votre réputation est top, mais sur Google vous existez pas. C'est pour ça que je vous appelle. 5 minutes ? »",
  },
  {
    num: 10,
    name: "Challenge Inversé",
    profil: "Profils à ego, chefs de cabinet, associés",
    script:
      "« Allô [Prénom] ? Bonjour, soyez franc avec moi sur 10 secondes : si je vous dis «Theralys», ça vous dit quelque chose ? ... Ah ok, parfait, alors je suis pas en retard. On commence à équiper pas mal d'ostéos sur [région], et je voulais voir si vous étiez le profil avec qui ça pouvait matcher. J'ai 3 questions rapides pour qualifier, ensuite si on est d'accord je vous montre le site qu'on a déjà créé pour vous. Ça vous va ? »",
  },
  {
    num: 11,
    name: "Le Confrère",
    profil: "Dès que tu as un client sur la même zone géographique",
    script:
      "« Allô [Prénom] ? Bonjour, sur 20 secondes : je viens de finir d'installer le site de [Nom d'un confrère réel sur la même ville], on a doublé son trafic en 8 semaines. Il m'a dit «appelle [Prénom] aussi». Bon, il vous a pas vraiment recommandé directement parce que vous êtes concurrents (rire), mais j'ai trouvé que c'était une bonne idée quand même. 5 minutes ? »",
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function ScriptSection() {
  return (
    <div className="space-y-2">
      {SCRIPT_STEPS.map((step, i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{ background: "rgba(15,17,23,0.8)", border: `1px solid ${step.color}30` }}
        >
          <div
            className="font-game text-[10px] tracking-widest mb-2 inline-block px-2 py-0.5 rounded"
            style={{ color: step.color, background: `${step.color}18` }}
          >
            {step.tag}
          </div>
          <p style={{ color: "#e2e8f0", fontSize: "0.875rem", lineHeight: 1.65, margin: 0 }}>
            {step.text}
          </p>
          {step.note && (
            <p style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.5rem", fontStyle: "italic" }}>
              {step.note}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function PitchSection() {
  return (
    <div className="space-y-2">
      {PITCH_STEPS.map((step, i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{ background: "rgba(15,17,23,0.8)", border: `1px solid ${step.color}30` }}
        >
          <div
            className="font-game text-[10px] tracking-widest mb-2 inline-block px-2 py-0.5 rounded"
            style={{ color: step.color, background: `${step.color}18` }}
          >
            {step.tag}
          </div>
          <p style={{ color: "#e2e8f0", fontSize: "0.875rem", lineHeight: 1.65, margin: 0 }}>
            {step.text}
          </p>
          {step.note && (
            <p style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.5rem", fontStyle: "italic" }}>
              {step.note}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ObjectionsSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {OBJECTIONS.map((obj, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #272d4a" }}
        >
          <button
            className="w-full text-left px-4 py-3 flex items-center justify-between transition-colors"
            style={{ background: open === i ? "rgba(139,92,246,0.12)" : "rgba(15,17,23,0.8)" }}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span style={{ color: open === i ? "#a78bfa" : "#cbd5e1", fontSize: "0.875rem", fontWeight: 600 }}>
              {obj.trigger}
            </span>
            <span style={{ color: "#4b5563", fontSize: "1rem" }}>{open === i ? "▲" : "▼"}</span>
          </button>
          {open === i && (
            <div
              className="px-4 pb-4 pt-2"
              style={{ background: "rgba(15,17,23,0.9)", borderTop: "1px solid #272d4a" }}
            >
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.7, margin: 0 }}>
                {obj.response}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VariantsSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {VARIANTS.map((v, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid #272d4a" }}
        >
          <button
            className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
            style={{ background: open === i ? "rgba(34,197,94,0.08)" : "rgba(15,17,23,0.8)" }}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span
              className="font-game text-xs flex-shrink-0 w-6 h-6 rounded flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
            >
              {v.num}
            </span>
            <div className="flex-1 min-w-0">
              <div style={{ color: open === i ? "#86efac" : "#cbd5e1", fontSize: "0.875rem", fontWeight: 600 }}>
                {v.name}
              </div>
              <div style={{ color: "#4b5563", fontSize: "0.7rem", marginTop: "0.1rem" }}>
                {v.profil}
              </div>
            </div>
            <span style={{ color: "#4b5563", fontSize: "0.9rem" }}>{open === i ? "▲" : "▼"}</span>
          </button>
          {open === i && (
            <div
              className="px-4 pb-4 pt-2"
              style={{ background: "rgba(15,17,23,0.9)", borderTop: "1px solid #272d4a" }}
            >
              <div
                className="text-xs font-game tracking-wider mb-2 px-2 py-0.5 rounded inline-block"
                style={{ color: "#22c55e", background: "rgba(34,197,94,0.1)" }}
              >
                PROFIL : {v.profil}
              </div>
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.7, margin: 0 }}>
                {v.script}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function ScriptTab() {
  const [activeSection, setActiveSection] = useState("script");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-game text-lg text-white">SCRIPT THERALYS</h2>
            <p className="text-xs text-gray-500">Référence complète pour tes appels</p>
          </div>
          <div className="text-right">
            <div className="font-game text-xs text-blue-400">48€/mois</div>
            <div className="text-xs text-gray-600">7 jours gratuits</div>
          </div>
        </div>

        {/* Funnel reminder */}
        <div className="mt-3 flex items-center gap-2">
          {[
            { label: "APPEL", color: "#3b82f6", icon: "📞" },
            { label: "RDV", color: "#22c55e", icon: "🎯" },
            { label: "VENDU", color: "#f59e0b", icon: "💰" },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: `${step.color}18`, border: `1px solid ${step.color}40` }}
              >
                <span style={{ fontSize: "0.8rem" }}>{step.icon}</span>
                <span className="font-game text-xs" style={{ color: step.color }}>{step.label}</span>
              </div>
              {i < 2 && <span style={{ color: "#374151", fontSize: "0.75rem" }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Section tabs */}
      <div className="grid grid-cols-2 gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className="px-3 py-2.5 rounded-xl font-game text-xs tracking-wider transition-all duration-150 text-left"
            style={{
              background: activeSection === s.id ? `${s.color}18` : "rgba(16,16,28,0.8)",
              border: `1px solid ${activeSection === s.id ? s.color : "#1a1a2e"}`,
              color: activeSection === s.id ? s.color : "#6b7280",
              boxShadow: activeSection === s.id ? `0 0 12px ${s.color}25` : "none",
            }}
          >
            <span style={{ marginRight: "0.4rem" }}>{s.icon}</span>
            {s.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeSection === "script" && <ScriptSection />}
        {activeSection === "pitch" && <PitchSection />}
        {activeSection === "objections" && <ObjectionsSection />}
        {activeSection === "variants" && <VariantsSection />}
      </div>
    </div>
  );
}
