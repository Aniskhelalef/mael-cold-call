import { Level, Rank, Achievement, WeeklyMission } from "./types";

export const LEVELS: Level[] = [
  { level: 1, title: "Recrue", minXP: 0 },
  { level: 2, title: "Débutant", minXP: 100 },
  { level: 3, title: "Apprenti", minXP: 250 },
  { level: 4, title: "Prospecteur", minXP: 500 },
  { level: 5, title: "Cold Caller", minXP: 800 },
  { level: 6, title: "Décrocheur", minXP: 1200 },
  { level: 7, title: "Communicateur", minXP: 1700 },
  { level: 8, title: "Persuasif", minXP: 2300 },
  { level: 9, title: "Chasseur de RDV", minXP: 3000 },
  { level: 10, title: "Expert", minXP: 4000 },
  { level: 11, title: "Vétéran", minXP: 5000 },
  { level: 12, title: "Elite", minXP: 6500 },
  { level: 13, title: "Master", minXP: 8000 },
  { level: 14, title: "Grand Master", minXP: 10000 },
  { level: 15, title: "Légende", minXP: 13000 },
  { level: 16, title: "Mythique", minXP: 16000 },
  { level: 17, title: "Immortel", minXP: 20000 },
  { level: 18, title: "Divin", minXP: 25000 },
  { level: 19, title: "Ancestral", minXP: 30000 },
  { level: 20, title: "The Closer", minXP: 40000 },
];

export const RANKS: Rank[] = [
  { name: "Silver I", minBookings: 0, color: "#a0aec0", group: "silver" },
  { name: "Silver II", minBookings: 5, color: "#a0aec0", group: "silver" },
  { name: "Silver III", minBookings: 10, color: "#a0aec0", group: "silver" },
  { name: "Silver IV", minBookings: 15, color: "#a0aec0", group: "silver" },
  { name: "Silver Elite", minBookings: 25, color: "#a0aec0", group: "silver" },
  { name: "Silver Elite Master", minBookings: 40, color: "#a0aec0", group: "silver" },
  { name: "Gold Nova I", minBookings: 60, color: "#f6ad55", group: "gold" },
  { name: "Gold Nova II", minBookings: 80, color: "#f6ad55", group: "gold" },
  { name: "Gold Nova III", minBookings: 100, color: "#f6ad55", group: "gold" },
  { name: "Gold Nova Master", minBookings: 125, color: "#f6ad55", group: "gold" },
  { name: "Master Guardian I", minBookings: 150, color: "#63b3ed", group: "guardian" },
  { name: "Master Guardian II", minBookings: 200, color: "#63b3ed", group: "guardian" },
  { name: "Master Guardian Elite", minBookings: 250, color: "#63b3ed", group: "guardian" },
  { name: "Distinguished Master Guardian", minBookings: 300, color: "#63b3ed", group: "guardian" },
  { name: "Legendary Eagle", minBookings: 400, color: "#b794f4", group: "eagle" },
  { name: "Legendary Eagle Master", minBookings: 500, color: "#b794f4", group: "eagle" },
  { name: "Supreme Master First Class", minBookings: 650, color: "#fc8181", group: "supreme" },
  { name: "Global Elite", minBookings: 800, color: "#68d391", group: "global" },
];

export const ACHIEVEMENT_MONEY_REWARDS: Record<string, number> = {
  premier_rdv: 10,
  warm_up: 5,
  en_rythme: 15,
  machine_calls: 25,
  mitraillette: 50,
  call_infinite: 100,
  legende_cold: 200,
  productif: 5,
  lucky_shot: 20,
  sniper: 50,
  closer: 100,
  full_book: 200,
  rdv_factory: 500,
  trois_jours: 10,
  une_semaine: 30,
  discipline: 60,
  mode_grind: 120,
  grinder_absolu: 250,
  hyperactif: 20,
  reacteur: 50,
  tireur_elite: 30,
  headshot: 75,
  clutch: 40,
  ace: 80,
  first_blood: 20,
};

export const ACHIEVEMENTS: Achievement[] = [
  // PREMIERS PAS
  {
    id: "premiere_sonnerie",
    title: "Première Sonnerie",
    description: "Effectuer ton tout premier appel",
    category: "Premiers Pas",
    tier: "bronze",
    xpReward: 10,
    icon: "📞",
    hint: "Lance ton premier appel pour débloquer",
  },
  {
    id: "dans_la_matrice",
    title: "Dans la Matrice",
    description: "Compléter ta première session de travail",
    category: "Premiers Pas",
    tier: "bronze",
    xpReward: 20,
    icon: "🟢",
    hint: "Complète une session pour débloquer",
  },
  {
    id: "premier_rdv",
    title: "Premier Rendez-vous",
    description: "Décrocher ton tout premier booking",
    category: "Premiers Pas",
    tier: "bronze",
    xpReward: 50,
    icon: "🎯",
    hint: "Décroche ton premier RDV pour débloquer",
  },

  // CALLS VOLUME
  {
    id: "warm_up",
    title: "Warm Up",
    description: "Atteindre 10 appels au total",
    category: "Calls",
    tier: "bronze",
    xpReward: 30,
    icon: "🔥",
    hint: "Fais 10 calls pour débloquer",
  },
  {
    id: "en_rythme",
    title: "En Rythme",
    description: "Atteindre 50 appels au total",
    category: "Calls",
    tier: "bronze",
    xpReward: 75,
    icon: "🎵",
    hint: "Fais 50 calls pour débloquer",
  },
  {
    id: "machine_calls",
    title: "Machine à Appels",
    description: "Atteindre 100 appels au total",
    category: "Calls",
    tier: "silver",
    xpReward: 150,
    icon: "⚙️",
    hint: "Fais 100 calls pour débloquer",
  },
  {
    id: "mitraillette",
    title: "Mitraillette",
    description: "Atteindre 250 appels au total",
    category: "Calls",
    tier: "silver",
    xpReward: 250,
    icon: "🔫",
    hint: "Fais 250 calls pour débloquer",
  },
  {
    id: "call_infinite",
    title: "Call Infinite",
    description: "Atteindre 500 appels au total",
    category: "Calls",
    tier: "gold",
    xpReward: 500,
    icon: "♾️",
    hint: "Fais 500 calls pour débloquer",
  },
  {
    id: "legende_cold",
    title: "Légende du Cold",
    description: "Atteindre 1000 appels au total",
    category: "Calls",
    tier: "gold",
    xpReward: 1000,
    icon: "👑",
    hint: "Fais 1000 calls pour débloquer",
  },

  // CALLS DAILY
  {
    id: "productif",
    title: "Productif",
    description: "Faire 20 appels en un seul jour",
    category: "Calls",
    tier: "bronze",
    xpReward: 50,
    icon: "📈",
    hint: "Fais 20 calls en 1 jour pour débloquer",
  },
  {
    id: "en_feu",
    title: "En Feu",
    description: "Faire 50 appels en un seul jour",
    category: "Calls",
    tier: "silver",
    xpReward: 100,
    icon: "🌋",
    hint: "Fais 50 calls en 1 jour pour débloquer",
  },
  {
    id: "insatiable",
    title: "Insatiable",
    description: "Faire 100 appels en un seul jour",
    category: "Calls",
    tier: "gold",
    xpReward: 200,
    icon: "🤖",
    hint: "Fais 100 calls en 1 jour pour débloquer",
  },

  // BOOKINGS
  {
    id: "lucky_shot",
    title: "Lucky Shot",
    description: "Obtenir 5 bookings au total",
    category: "Bookings",
    tier: "bronze",
    xpReward: 100,
    icon: "🍀",
    hint: "Obtiens 5 bookings pour débloquer",
  },
  {
    id: "sniper",
    title: "Sniper",
    description: "Obtenir 20 bookings au total",
    category: "Bookings",
    tier: "silver",
    xpReward: 200,
    icon: "🎯",
    hint: "Obtiens 20 bookings pour débloquer",
  },
  {
    id: "closer",
    title: "Closer",
    description: "Obtenir 50 bookings au total",
    category: "Bookings",
    tier: "silver",
    xpReward: 300,
    icon: "💼",
    hint: "Obtiens 50 bookings pour débloquer",
  },
  {
    id: "full_book",
    title: "Full Book",
    description: "Obtenir 100 bookings au total",
    category: "Bookings",
    tier: "gold",
    xpReward: 500,
    icon: "📚",
    hint: "Obtiens 100 bookings pour débloquer",
  },
  {
    id: "rdv_factory",
    title: "RDV Factory",
    description: "Obtenir 200 bookings au total",
    category: "Bookings",
    tier: "gold",
    xpReward: 1000,
    icon: "🏭",
    hint: "Obtiens 200 bookings pour débloquer",
  },

  // STREAKS
  {
    id: "trois_jours",
    title: "3 Jours",
    description: "Maintenir un streak de 3 jours consécutifs",
    category: "Streaks",
    tier: "bronze",
    xpReward: 50,
    icon: "📅",
    hint: "Appelle 3 jours de suite pour débloquer",
  },
  {
    id: "une_semaine",
    title: "Une Semaine",
    description: "Maintenir un streak de 7 jours consécutifs",
    category: "Streaks",
    tier: "silver",
    xpReward: 150,
    icon: "🗓️",
    hint: "Appelle 7 jours de suite pour débloquer",
  },
  {
    id: "discipline",
    title: "Discipline de Moine",
    description: "Maintenir un streak de 14 jours consécutifs",
    category: "Streaks",
    tier: "silver",
    xpReward: 250,
    icon: "🧘",
    hint: "Appelle 14 jours de suite pour débloquer",
  },
  {
    id: "mode_grind",
    title: "Mode Grind Activé",
    description: "Maintenir un streak de 30 jours consécutifs",
    category: "Streaks",
    tier: "gold",
    xpReward: 500,
    icon: "⚡",
    hint: "Appelle 30 jours de suite pour débloquer",
  },
  {
    id: "grinder_absolu",
    title: "Grinder Absolu",
    description: "Maintenir un streak de 60 jours consécutifs",
    category: "Streaks",
    tier: "gold",
    xpReward: 1000,
    icon: "💎",
    hint: "Appelle 60 jours de suite pour débloquer",
  },

  // ENERGY
  {
    id: "pleine_puissance",
    title: "Pleine Puissance",
    description: "Utiliser toute ton énergie journalière une fois",
    category: "Énergie",
    tier: "bronze",
    xpReward: 50,
    icon: "⚡",
    hint: "Utilise toute ton énergie en 1 jour pour débloquer",
  },
  {
    id: "hyperactif",
    title: "Hyperactif",
    description: "Utiliser toute ton énergie journalière 7 fois",
    category: "Énergie",
    tier: "silver",
    xpReward: 200,
    icon: "🔋",
    hint: "Utilise toute ton énergie 7 fois pour débloquer",
  },
  {
    id: "reacteur",
    title: "Réacteur Nucléaire",
    description: "Utiliser toute ton énergie journalière 30 fois",
    category: "Énergie",
    tier: "gold",
    xpReward: 500,
    icon: "☢️",
    hint: "Utilise toute ton énergie 30 fois pour débloquer",
  },

  // RATIO
  {
    id: "tireur_elite",
    title: "Tireur d'Élite",
    description: "Maintenir un taux de booking de 30%+ sur 20+ calls",
    category: "Ratio",
    tier: "silver",
    xpReward: 150,
    icon: "🏹",
    hint: "Atteins 30% de taux de booking sur 20+ calls",
  },
  {
    id: "headshot",
    title: "Headshot",
    description: "Maintenir un taux de booking de 40%+ sur 50+ calls",
    category: "Ratio",
    tier: "gold",
    xpReward: 300,
    icon: "💥",
    hint: "Atteins 40% de taux de booking sur 50+ calls",
  },

  // SPECIAL CS:GO
  {
    id: "clutch",
    title: "Clutch",
    description: "Obtenir 5 bookings en une seule semaine",
    category: "Spécial",
    tier: "silver",
    xpReward: 200,
    icon: "🕹️",
    hint: "Obtiens 5 bookings en 1 semaine pour débloquer",
  },
  {
    id: "ace",
    title: "Ace",
    description: "Obtenir 10 bookings en une seule semaine",
    category: "Spécial",
    tier: "gold",
    xpReward: 400,
    icon: "🃏",
    hint: "Obtiens 10 bookings en 1 semaine pour débloquer",
  },
  {
    id: "first_blood",
    title: "First Blood",
    description: "Décrocher un booking dès le premier jour",
    category: "Spécial",
    tier: "bronze",
    xpReward: 100,
    icon: "🩸",
    hint: "Obtiens un booking le premier jour pour débloquer",
  },
  {
    id: "no_scope",
    title: "No Scope",
    description: "Décrocher un booking avec 5 appels ou moins dans la journée",
    category: "Spécial",
    tier: "gold",
    xpReward: 200,
    icon: "🎮",
    hint: "Obtiens un booking avec ≤5 calls le même jour",
  },
];

export const WEEKLY_MISSIONS: WeeklyMission[] = [
  {
    id: "weekly_calls_easy",
    title: "Échauffement",
    description: "Effectuer 20 appels cette semaine",
    tier: "bronze",
    xpReward: 100,
    target: 20,
    type: "calls",
  },
  {
    id: "weekly_calls_medium",
    title: "En Cadence",
    description: "Effectuer 50 appels cette semaine",
    tier: "silver",
    xpReward: 200,
    target: 50,
    type: "calls",
  },
  {
    id: "weekly_calls_hard",
    title: "Barrage",
    description: "Effectuer 100 appels cette semaine",
    tier: "gold",
    xpReward: 400,
    target: 100,
    type: "calls",
  },
  {
    id: "weekly_bookings",
    title: "Chasseur",
    description: "Obtenir 3 bookings cette semaine",
    tier: "silver",
    xpReward: 200,
    target: 3,
    type: "bookings",
  },
  {
    id: "weekly_streak",
    title: "Régularité",
    description: "Appeler 5 jours différents cette semaine",
    tier: "bronze",
    xpReward: 150,
    target: 5,
    type: "days",
  },
];

export function getLevel(totalXP: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXP >= level.minXP) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}

export function getNextLevel(totalXP: number): Level | null {
  const current = getLevel(totalXP);
  const nextIndex = LEVELS.findIndex((l) => l.level === current.level + 1);
  return nextIndex !== -1 ? LEVELS[nextIndex] : null;
}

export function getLevelProgress(totalXP: number): number {
  const current = getLevel(totalXP);
  const next = getNextLevel(totalXP);
  if (!next) return 100;
  const range = next.minXP - current.minXP;
  const progress = totalXP - current.minXP;
  return Math.min(100, Math.floor((progress / range) * 100));
}

export function getRank(totalBookings: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (totalBookings >= rank.minBookings) {
      current = rank;
    } else {
      break;
    }
  }
  return current;
}

export function getNextRank(totalBookings: number): Rank | null {
  const current = getRank(totalBookings);
  const nextIndex = RANKS.findIndex((r) => r.name === current.name) + 1;
  return nextIndex < RANKS.length ? RANKS[nextIndex] : null;
}

export function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function getDaysUntilNextMonday(): number {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  return daysUntilMonday;
}

export function getWeekNumber(): number {
  const now = new Date();
  const key = getISOWeekKey(now);
  return parseInt(key.split("-W")[1]);
}
