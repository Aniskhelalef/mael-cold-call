"use client";

import React, { createContext, useContext, useReducer, useEffect, useRef } from "react";
import { GameState, GameAction } from "./types";
import { syncStateToSupabase } from "./supabase";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_MONEY_REWARDS,
  WEEKLY_MISSIONS,
  getTodayString,
  getISOWeekKey,
} from "./gameData";

const STORAGE_KEY = "mael_game_state";
const MAX_ENERGY = 100;
const ENERGY_PER_CALL = 2;

const defaultState: GameState = {
  playerName: "",
  playerEmail: "",
  totalCalls: 0,
  totalBookings: 0,
  totalXP: 0,
  dailyCalls: 0,
  dailyBookings: 0,
  dailyEnergyUsed: 0,
  lastResetDate: getTodayString(),
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: "",
  fullEnergyCount: 0,
  history: [],
  unlockedAchievements: [],
  pendingToasts: [],
  sessionActive: false,
  sessionStart: null,
  sessionTargetMinutes: 30,
  sessionCalls: 0,
  sessionBookings: 0,
  xpBuffActive: false,
  xpBuffEnd: null,
  weeklyCallsAtStart: 0,
  weeklyBookingsAtStart: 0,
  weeklyDaysActive: 0,
  weeklyKey: getISOWeekKey(new Date()),
  weeklyMissionsCompleted: [],
  firstBookingDate: null,
  firstDayCalls: 0,
  noScopeEligible: true,
  totalMoneyEarned: 0,
};

function loadState(): GameState {
  if (typeof window === "undefined") return defaultState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultState, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaultState;
}

function saveState(state: GameState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function checkAchievements(state: GameState): { newAchievements: string[]; bonusXP: number; moneyGain: number } {
  const newAchievements: string[] = [];
  let bonusXP = 0;

  const weeklyCalls = state.totalCalls - state.weeklyCallsAtStart;
  const weeklyBookings = state.totalBookings - state.weeklyBookingsAtStart;

  for (const ach of ACHIEVEMENTS) {
    if (state.unlockedAchievements.includes(ach.id)) continue;

    let shouldUnlock = false;

    switch (ach.id) {
      case "premiere_sonnerie":
        shouldUnlock = state.totalCalls >= 1;
        break;
      case "dans_la_matrice":
        // handled in END_SESSION
        break;
      case "premier_rdv":
        shouldUnlock = state.totalBookings >= 1;
        break;
      case "warm_up":
        shouldUnlock = state.totalCalls >= 10;
        break;
      case "en_rythme":
        shouldUnlock = state.totalCalls >= 50;
        break;
      case "machine_calls":
        shouldUnlock = state.totalCalls >= 100;
        break;
      case "mitraillette":
        shouldUnlock = state.totalCalls >= 250;
        break;
      case "call_infinite":
        shouldUnlock = state.totalCalls >= 500;
        break;
      case "legende_cold":
        shouldUnlock = state.totalCalls >= 1000;
        break;
      case "productif":
        shouldUnlock = state.dailyCalls >= 20;
        break;
      case "en_feu":
        shouldUnlock = state.dailyCalls >= 50;
        break;
      case "insatiable":
        shouldUnlock = state.dailyCalls >= 100;
        break;
      case "lucky_shot":
        shouldUnlock = state.totalBookings >= 5;
        break;
      case "sniper":
        shouldUnlock = state.totalBookings >= 20;
        break;
      case "closer":
        shouldUnlock = state.totalBookings >= 50;
        break;
      case "full_book":
        shouldUnlock = state.totalBookings >= 100;
        break;
      case "rdv_factory":
        shouldUnlock = state.totalBookings >= 200;
        break;
      case "trois_jours":
        shouldUnlock = state.currentStreak >= 3;
        break;
      case "une_semaine":
        shouldUnlock = state.currentStreak >= 7;
        break;
      case "discipline":
        shouldUnlock = state.currentStreak >= 14;
        break;
      case "mode_grind":
        shouldUnlock = state.currentStreak >= 30;
        break;
      case "grinder_absolu":
        shouldUnlock = state.currentStreak >= 60;
        break;
      case "pleine_puissance":
        shouldUnlock = state.fullEnergyCount >= 1;
        break;
      case "hyperactif":
        shouldUnlock = state.fullEnergyCount >= 7;
        break;
      case "reacteur":
        shouldUnlock = state.fullEnergyCount >= 30;
        break;
      case "tireur_elite":
        shouldUnlock =
          state.totalCalls >= 20 &&
          state.totalBookings / state.totalCalls >= 0.3;
        break;
      case "headshot":
        shouldUnlock =
          state.totalCalls >= 50 &&
          state.totalBookings / state.totalCalls >= 0.4;
        break;
      case "clutch":
        shouldUnlock = weeklyBookings >= 5;
        break;
      case "ace":
        shouldUnlock = weeklyBookings >= 10;
        break;
      case "first_blood":
        shouldUnlock =
          state.firstBookingDate !== null &&
          state.firstBookingDate === getTodayString() &&
          state.totalBookings === 1;
        break;
      case "no_scope":
        shouldUnlock =
          state.noScopeEligible && state.dailyCalls <= 5 && state.dailyBookings >= 1;
        break;
    }

    if (shouldUnlock) {
      newAchievements.push(ach.id);
      bonusXP += ach.xpReward;
    }
  }

  const moneyGain = newAchievements.reduce((sum, id) => sum + (ACHIEVEMENT_MONEY_REWARDS[id] ?? 0), 0);
  return { newAchievements, bonusXP, moneyGain };
}

function checkWeeklyMissions(state: GameState): { newMissions: string[]; bonusXP: number } {
  const newMissions: string[] = [];
  let bonusXP = 0;

  const weeklyCalls = state.totalCalls - state.weeklyCallsAtStart;
  const weeklyBookings = state.totalBookings - state.weeklyBookingsAtStart;

  for (const mission of WEEKLY_MISSIONS) {
    if (state.weeklyMissionsCompleted.includes(mission.id)) continue;

    let progress = 0;
    if (mission.type === "calls") progress = weeklyCalls;
    else if (mission.type === "bookings") progress = weeklyBookings;
    else if (mission.type === "days") progress = state.weeklyDaysActive;

    if (progress >= mission.target) {
      newMissions.push(mission.id);
      bonusXP += mission.xpReward;
    }
  }

  return { newMissions, bonusXP };
}

function performDailyReset(state: GameState, today: string): GameState {
  const yesterday = state.lastResetDate;
  const newHistory = [...state.history];

  if (yesterday && yesterday !== today) {
    const existingEntry = newHistory.find((h) => h.date === yesterday);
    if (!existingEntry && (state.dailyCalls > 0 || state.dailyBookings > 0)) {
      newHistory.push({
        date: yesterday,
        calls: state.dailyCalls,
        bookings: state.dailyBookings,
      });
    }
  }

  // Keep only last 365 days
  const trimmedHistory = newHistory.slice(-365);

  return {
    ...state,
    dailyCalls: 0,
    dailyBookings: 0,
    dailyEnergyUsed: 0,
    lastResetDate: today,
    history: trimmedHistory,
    noScopeEligible: true,
  };
}

function performWeeklyReset(state: GameState, weekKey: string): GameState {
  return {
    ...state,
    weeklyKey: weekKey,
    weeklyCallsAtStart: state.totalCalls,
    weeklyBookingsAtStart: state.totalBookings,
    weeklyDaysActive: 0,
    weeklyMissionsCompleted: [],
  };
}

function updateStreak(state: GameState, today: string): GameState {
  if (state.lastActivityDate === today) return state;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak: number;
  if (state.lastActivityDate === yesterdayStr) {
    newStreak = state.currentStreak + 1;
  } else if (state.lastActivityDate === "") {
    newStreak = 1;
  } else {
    newStreak = 1;
  }

  return {
    ...state,
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, state.longestStreak),
    lastActivityDate: today,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  const today = getTodayString();
  const currentWeekKey = getISOWeekKey(new Date());
  const now = Date.now();

  // Check if buff has expired
  let currentState = state;
  if (state.xpBuffActive && state.xpBuffEnd && now > state.xpBuffEnd) {
    currentState = { ...currentState, xpBuffActive: false, xpBuffEnd: null };
  }

  // Daily reset check
  if (currentState.lastResetDate !== today) {
    currentState = performDailyReset(currentState, today);
  }

  // Weekly reset check
  if (currentState.weeklyKey !== currentWeekKey) {
    currentState = performWeeklyReset(currentState, currentWeekKey);
  }

  switch (action.type) {
    case "SETUP_PLAYER": {
      const newState: GameState = {
        ...currentState,
        playerName: action.name,
        playerEmail: action.email,
        weeklyKey: currentWeekKey,
        weeklyCallsAtStart: 0,
        weeklyBookingsAtStart: 0,
        lastResetDate: today,
      };
      return newState;
    }

    case "RESTORE_STATE": {
      let restored = { ...action.state };
      if (restored.lastResetDate !== today) {
        restored = performDailyReset(restored, today);
      }
      if (restored.weeklyKey !== currentWeekKey) {
        restored = performWeeklyReset(restored, currentWeekKey);
      }
      return restored;
    }

    case "LOG_CALL": {
      if (currentState.dailyEnergyUsed >= MAX_ENERGY) return currentState;

      const isFirstCallOfDay = currentState.dailyCalls === 0;
      const isFirstCallEver = currentState.totalCalls === 0;
      const newEnergyUsed = Math.min(MAX_ENERGY, currentState.dailyEnergyUsed + ENERGY_PER_CALL);
      const energyFullyUsed = newEnergyUsed >= MAX_ENERGY && currentState.dailyEnergyUsed < MAX_ENERGY;

      let xpGain = 10;
      if (currentState.xpBuffActive) xpGain = Math.floor(xpGain * 1.5);
      if (isFirstCallOfDay) xpGain += 5;

      let newState: GameState = {
        ...currentState,
        totalCalls: currentState.totalCalls + 1,
        dailyCalls: currentState.dailyCalls + 1,
        totalXP: currentState.totalXP + xpGain,
        dailyEnergyUsed: newEnergyUsed,
        sessionCalls: currentState.sessionActive
          ? currentState.sessionCalls + 1
          : currentState.sessionCalls,
        firstDayCalls: isFirstCallEver
          ? 1
          : currentState.firstDayCalls + (currentState.totalCalls === 0 ? 0 : 0),
      };

      // no_scope eligibility: reset if calls > 5 without a booking
      if (newState.dailyCalls > 5 && newState.dailyBookings === 0) {
        newState = { ...newState, noScopeEligible: false };
      }

      // Energy bonus
      let energyBonusXP = 0;
      let newFullEnergyCount = newState.fullEnergyCount;
      if (energyFullyUsed) {
        energyBonusXP = 50;
        newFullEnergyCount = newState.fullEnergyCount + 1;
        newState = {
          ...newState,
          totalXP: newState.totalXP + energyBonusXP,
          fullEnergyCount: newFullEnergyCount,
        };
      }

      // Daily goal bonus
      if (newState.dailyCalls === 20) {
        newState = { ...newState, totalXP: newState.totalXP + 100 };
      }

      // Streak update
      newState = updateStreak(newState, today);

      // Weekly days active
      if (isFirstCallOfDay) {
        newState = { ...newState, weeklyDaysActive: newState.weeklyDaysActive + 1 };
      }

      // Achievement check
      const { newAchievements, bonusXP: achXP, moneyGain: achMoney } = checkAchievements(newState);
      if (newAchievements.length > 0) {
        newState = {
          ...newState,
          totalXP: newState.totalXP + achXP,
          totalMoneyEarned: newState.totalMoneyEarned + achMoney,
          unlockedAchievements: [...newState.unlockedAchievements, ...newAchievements],
          pendingToasts: [...newState.pendingToasts, ...newAchievements],
        };
      }

      // Weekly missions check
      const { newMissions, bonusXP: missionXP } = checkWeeklyMissions(newState);
      if (newMissions.length > 0) {
        newState = {
          ...newState,
          totalXP: newState.totalXP + missionXP,
          weeklyMissionsCompleted: [...newState.weeklyMissionsCompleted, ...newMissions],
        };
      }

      return newState;
    }

    case "LOG_BOOKING": {
      const isFirstBooking = currentState.totalBookings === 0;
      let xpGain = 50;
      if (currentState.xpBuffActive) xpGain = Math.floor(xpGain * 1.5);

      let newState: GameState = {
        ...currentState,
        totalBookings: currentState.totalBookings + 1,
        dailyBookings: currentState.dailyBookings + 1,
        totalXP: currentState.totalXP + xpGain,
        sessionBookings: currentState.sessionActive
          ? currentState.sessionBookings + 1
          : currentState.sessionBookings,
        firstBookingDate: isFirstBooking ? today : currentState.firstBookingDate,
      };

      // Update streak
      newState = updateStreak(newState, today);

      // Achievement check
      const { newAchievements, bonusXP: achXP, moneyGain: achMoney } = checkAchievements(newState);
      if (newAchievements.length > 0) {
        newState = {
          ...newState,
          totalXP: newState.totalXP + achXP,
          totalMoneyEarned: newState.totalMoneyEarned + achMoney,
          unlockedAchievements: [...newState.unlockedAchievements, ...newAchievements],
          pendingToasts: [...newState.pendingToasts, ...newAchievements],
        };
      }

      // Weekly missions
      const { newMissions, bonusXP: missionXP } = checkWeeklyMissions(newState);
      if (newMissions.length > 0) {
        newState = {
          ...newState,
          totalXP: newState.totalXP + missionXP,
          weeklyMissionsCompleted: [...newState.weeklyMissionsCompleted, ...newMissions],
        };
      }

      return newState;
    }

    case "UNDO_CALL": {
      if (currentState.dailyCalls <= 0) return currentState;
      const newEnergy = Math.max(0, currentState.dailyEnergyUsed - ENERGY_PER_CALL);
      const xpRefund = 10;
      return {
        ...currentState,
        totalCalls: Math.max(0, currentState.totalCalls - 1),
        dailyCalls: Math.max(0, currentState.dailyCalls - 1),
        totalXP: Math.max(0, currentState.totalXP - xpRefund),
        dailyEnergyUsed: newEnergy,
        sessionCalls: currentState.sessionActive
          ? Math.max(0, currentState.sessionCalls - 1)
          : currentState.sessionCalls,
      };
    }

    case "START_SESSION": {
      return {
        ...currentState,
        sessionActive: true,
        sessionStart: now,
        sessionTargetMinutes: action.minutes,
        sessionCalls: 0,
        sessionBookings: 0,
      };
    }

    case "END_SESSION": {
      const newUnlocked = currentState.unlockedAchievements.includes("dans_la_matrice")
        ? currentState.unlockedAchievements
        : [...currentState.unlockedAchievements, "dans_la_matrice"];
      const achUnlocked = !currentState.unlockedAchievements.includes("dans_la_matrice");
      const achXPBonus = achUnlocked ? 20 : 0;
      const newPending = achUnlocked
        ? [...currentState.pendingToasts, "dans_la_matrice"]
        : currentState.pendingToasts;

      // Activate XP buff for 30 minutes
      return {
        ...currentState,
        sessionActive: false,
        sessionStart: null,
        xpBuffActive: true,
        xpBuffEnd: now + 30 * 60 * 1000,
        unlockedAchievements: newUnlocked,
        pendingToasts: newPending,
        totalXP: currentState.totalXP + achXPBonus,
      };
    }

    case "DISMISS_TOAST": {
      return {
        ...currentState,
        pendingToasts: currentState.pendingToasts.filter((id) => id !== action.id),
      };
    }

    case "DISMISS_ALL_TOASTS": {
      return { ...currentState, pendingToasts: [] };
    }

    case "LOGOUT": {
      return { ...defaultState };
    }

    case "TICK": {
      // Just triggers a re-render for timer updates
      if (currentState.xpBuffActive && currentState.xpBuffEnd && now > currentState.xpBuffEnd) {
        return { ...currentState, xpBuffActive: false, xpBuffEnd: null };
      }
      return currentState;
    }

    default:
      return currentState;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, defaultState, loadState);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    saveState(state);
    // Debounced Supabase sync — 2s after last action
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncStateToSupabase(state);
    }, 2000);
  }, [state]);

  // Timer tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
