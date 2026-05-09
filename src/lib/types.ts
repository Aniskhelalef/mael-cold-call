export interface GameState {
  playerName: string;
  playerEmail: string;
  totalCalls: number;
  totalBookings: number;
  dailyCalls: number;
  dailyBookings: number;
  lastResetDate: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  totalCallsYes: number;
  dailyCallsYes: number;
  history: { date: string; calls: number; bookings: number }[];
  unlockedAchievements: string[];
  pendingToasts: string[];
  sessionActive: boolean;
  sessionStart: number | null;
  sessionTargetMinutes: number;
  sessionCalls: number;
  sessionBookings: number;
  weeklyCallsAtStart: number;
  weeklyBookingsAtStart: number;
  weeklyDaysActive: number;
  weeklyKey: string;
  weeklyMissionsCompleted: string[];
  firstBookingDate: string | null;
  firstDayCalls: number;
  noScopeEligible: boolean;
  totalMoneyEarned: number;
  prospects: Prospect[];
  ranksRewarded?: string[];
  lastCallType?: "no" | "yes" | "booking";
}

export type ProspectStatus = "a_appeler" | "rappel" | "rdv" | "perdu";

export interface Prospect {
  id: string;
  name: string;
  ville: string;
  specialite: string;
  phone: string;
  email?: string;
  status: ProspectStatus;
  notes: string;
  reponse?: string;
  rappelDate?: string;
  relanceCount?: number;
  premierContact?: string;
  pourquoi?: string;
  website?: string;
  googleMapsUrl?: string;
  reviewsCount?: number;
  callDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export type GameAction =
  | { type: "SETUP_PLAYER"; name: string; email: string }
  | { type: "RESTORE_STATE"; state: GameState }
  | { type: "LOG_CALL" }
  | { type: "LOG_CALL_YES" }
  | { type: "LOG_BOOKING" }
  | { type: "LOG_CALL_BOOKING" }
  | { type: "UNDO_CALL" }
  | { type: "START_SESSION"; minutes: number }
  | { type: "END_SESSION" }
  | { type: "DISMISS_TOAST"; id: string }
  | { type: "DISMISS_ALL_TOASTS" }
  | { type: "ADD_PROSPECT"; data: Omit<Prospect, "id" | "createdAt" | "updatedAt"> }
  | { type: "UPDATE_PROSPECT"; id: string; changes: Partial<Pick<Prospect, "status" | "notes" | "rappelDate" | "reponse" | "premierContact" | "pourquoi" | "relanceCount" | "website" | "googleMapsUrl" | "reviewsCount" | "callDuration">> }
  | { type: "DELETE_PROSPECT"; id: string }
  | { type: "IMPORT_PROSPECTS"; data: Omit<Prospect, "id" | "createdAt" | "updatedAt">[] }
  | { type: "TICK" }
  | { type: "LOGOUT" }
  | { type: "RESET_STATS" }
  | { type: "WIPE_ALL" };

export interface Rank {
  name: string;
  minBookings: number;
  color: string;
  group: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  tier: "bronze" | "silver" | "gold";
  xpReward: number;
  icon: string;
  hint: string;
}

export interface WeeklyMission {
  id: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold";
  xpReward: number;
  target: number;
  type: "calls" | "bookings" | "days";
}
