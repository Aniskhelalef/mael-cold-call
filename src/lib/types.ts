export interface GameState {
  playerName: string;
  totalCalls: number;
  totalBookings: number;
  totalXP: number;
  dailyCalls: number;
  dailyBookings: number;
  dailyEnergyUsed: number;
  lastResetDate: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  fullEnergyCount: number;
  history: { date: string; calls: number; bookings: number }[];
  unlockedAchievements: string[];
  pendingToasts: string[];
  sessionActive: boolean;
  sessionStart: number | null;
  sessionTargetMinutes: number;
  sessionCalls: number;
  sessionBookings: number;
  xpBuffActive: boolean;
  xpBuffEnd: number | null;
  weeklyCallsAtStart: number;
  weeklyBookingsAtStart: number;
  weeklyDaysActive: number;
  weeklyKey: string;
  weeklyMissionsCompleted: string[];
  firstBookingDate: string | null;
  firstDayCalls: number;
  noScopeEligible: boolean;
  totalMoneyEarned: number;
}

export type GameAction =
  | { type: "SETUP_PLAYER"; name: string }
  | { type: "LOG_CALL" }
  | { type: "LOG_BOOKING" }
  | { type: "UNDO_CALL" }
  | { type: "START_SESSION"; minutes: number }
  | { type: "END_SESSION" }
  | { type: "DISMISS_TOAST"; id: string }
  | { type: "DISMISS_ALL_TOASTS" }
  | { type: "TICK" };

export interface Level {
  level: number;
  title: string;
  minXP: number;
}

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
