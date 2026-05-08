"use client";

import React, { createContext, useContext, useReducer, useEffect, useRef } from "react";
import { GameState, GameAction } from "./types";
import { syncStateToSupabase } from "./supabase";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_MONEY_REWARDS,
  WEEKLY_MISSIONS,
  RANKS,
  RANK_MONEY_REWARDS,
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
  dailyCalls: 0,
  dailyBookings: 0,
  lastResetDate: getTodayString(),
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: "",
  totalCallsYes: 0,
  dailyCallsYes: 0,
  history: [],
  unlockedAchievements: [],
  pendingToasts: [],
  sessionActive: false,
  sessionStart: null,
  sessionTargetMinutes: 30,
  sessionCalls: 0,
  sessionBookings: 0,
  weeklyCallsAtStart: 0,
  weeklyBookingsAtStart: 0,
  weeklyDaysActive: 0,
  weeklyKey: getISOWeekKey(new Date()),
  weeklyMissionsCompleted: [],
  firstBookingDate: null,
  firstDayCalls: 0,
  noScopeEligible: true,
  totalMoneyEarned: 0,
  totalSales: 0,
  dailySales: 0,
  prospects: [],
  ranksRewarded: [],
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

function checkAchievements(state: GameState): { newAchievements: string[]; moneyGain: number } {
  const newAchievements: string[] = [];

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
      case "hyperactif":
      case "reacteur":
        // energy achievements removed
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
      case "premier_site":
        shouldUnlock = state.totalSales >= 1;
        break;
      case "vendeur_confirme":
        shouldUnlock = state.totalSales >= 5;
        break;
      case "closer_elite":
        shouldUnlock = state.totalSales >= 20;
        break;
      case "sales_legend":
        shouldUnlock = state.totalSales >= 50;
        break;
    }

    if (shouldUnlock) {
      newAchievements.push(ach.id);
    }
  }

  const moneyGain = newAchievements.reduce((sum, id) => sum + (ACHIEVEMENT_MONEY_REWARDS[id] ?? 0), 0);
  return { newAchievements, moneyGain };
}

function checkWeeklyMissions(state: GameState): { newMissions: string[] } {
  const newMissions: string[] = [];

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
    }
  }

  return { newMissions };
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
    dailyCallsYes: 0,
    dailySales: 0,
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

  let currentState = state;

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

    case "LOG_SALE": {
      let newState: GameState = {
        ...currentState,
        totalSales: currentState.totalSales + 1,
        dailySales: currentState.dailySales + 1,
      };

      newState = updateStreak(newState, today);

      const { newAchievements, moneyGain: achMoney } = checkAchievements(newState);
      if (newAchievements.length > 0) {
        newState = {
          ...newState,
          totalMoneyEarned: newState.totalMoneyEarned + achMoney,
          unlockedAchievements: [...newState.unlockedAchievements, ...newAchievements],
          
        };
      }

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
      const isFirstCallOfDay = currentState.dailyCalls === 0;

      let newState: GameState = {
        ...currentState,
        totalCalls: currentState.totalCalls + 1,
        dailyCalls: currentState.dailyCalls + 1,
        sessionCalls: currentState.sessionActive
          ? currentState.sessionCalls + 1
          : currentState.sessionCalls,
      };

      // no_scope eligibility
      if (newState.dailyCalls > 5 && newState.dailyBookings === 0) {
        newState = { ...newState, noScopeEligible: false };
      }

      // Streak update
      newState = updateStreak(newState, today);

      // Weekly days active
      if (isFirstCallOfDay) {
        newState = { ...newState, weeklyDaysActive: newState.weeklyDaysActive + 1 };
      }

      // Achievement check
      const { newAchievements, moneyGain: achMoney } = checkAchievements(newState);
      if (newAchievements.length > 0) {
        newState = {
          ...newState,
          totalMoneyEarned: newState.totalMoneyEarned + achMoney,
          unlockedAchievements: [...newState.unlockedAchievements, ...newAchievements],
          
        };
      }

      // Weekly missions check
      const { newMissions } = checkWeeklyMissions(newState);
      if (newMissions.length > 0) {
        newState = {
          ...newState,
          weeklyMissionsCompleted: [...newState.weeklyMissionsCompleted, ...newMissions],
        };
      }

      return newState;
    }

    case "LOG_CALL_YES": {
      const isFirstCallOfDay = currentState.dailyCalls === 0;

      let newState: GameState = {
        ...currentState,
        totalCalls: currentState.totalCalls + 1,
        dailyCalls: currentState.dailyCalls + 1,
        totalCallsYes: (currentState.totalCallsYes ?? 0) + 1,
        dailyCallsYes: (currentState.dailyCallsYes ?? 0) + 1,
        sessionCalls: currentState.sessionActive
          ? currentState.sessionCalls + 1
          : currentState.sessionCalls,
      };

      newState = updateStreak(newState, today);

      if (isFirstCallOfDay) {
        newState = { ...newState, weeklyDaysActive: newState.weeklyDaysActive + 1 };
      }

      const { newAchievements, moneyGain: achMoney } = checkAchievements(newState);
      if (newAchievements.length > 0) {
        newState = {
          ...newState,
          totalMoneyEarned: newState.totalMoneyEarned + achMoney,
          unlockedAchievements: [...newState.unlockedAchievements, ...newAchievements],
        };
      }

      const { newMissions } = checkWeeklyMissions(newState);
      if (newMissions.length > 0) {
        newState = { ...newState, weeklyMissionsCompleted: [...newState.weeklyMissionsCompleted, ...newMissions] };
      }

      return newState;
    }

    case "LOG_BOOKING": {
      const isFirstBooking = currentState.totalBookings === 0;

      let newState: GameState = {
        ...currentState,
        totalBookings: currentState.totalBookings + 1,
        dailyBookings: currentState.dailyBookings + 1,
        sessionBookings: currentState.sessionActive
          ? currentState.sessionBookings + 1
          : currentState.sessionBookings,
        firstBookingDate: isFirstBooking ? today : currentState.firstBookingDate,
      };

      // Update streak
      newState = updateStreak(newState, today);

      // Achievement check
      const { newAchievements, moneyGain: achMoney } = checkAchievements(newState);
      if (newAchievements.length > 0) {
        newState = {
          ...newState,
          totalMoneyEarned: newState.totalMoneyEarned + achMoney,
          unlockedAchievements: [...newState.unlockedAchievements, ...newAchievements],
          
        };
      }

      // Weekly missions
      const { newMissions } = checkWeeklyMissions(newState);
      if (newMissions.length > 0) {
        newState = {
          ...newState,
          weeklyMissionsCompleted: [...newState.weeklyMissionsCompleted, ...newMissions],
        };
      }

      // Rank money rewards
      const ranksRewarded = newState.ranksRewarded ?? [];
      let rankMoneyGain = 0;
      const newRanksRewarded = [...ranksRewarded];
      for (const rank of RANKS) {
        if (newState.totalBookings >= rank.minBookings && !newRanksRewarded.includes(rank.name)) {
          rankMoneyGain += RANK_MONEY_REWARDS[rank.name] ?? 0;
          newRanksRewarded.push(rank.name);
        }
      }
      if (rankMoneyGain > 0 || newRanksRewarded.length > ranksRewarded.length) {
        newState = {
          ...newState,
          totalMoneyEarned: newState.totalMoneyEarned + rankMoneyGain,
          ranksRewarded: newRanksRewarded,
        };
      }

      return newState;
    }

    case "LOG_CALL_BOOKING": {
      // OUI + BOOKING in one action (call resulted in immediate booking)
      const isFirstBooking = currentState.totalBookings === 0;
      const isFirstCallOfDay = currentState.dailyCalls === 0;

      let newState: GameState = {
        ...currentState,
        totalCalls: currentState.totalCalls + 1,
        dailyCalls: currentState.dailyCalls + 1,
        totalCallsYes: (currentState.totalCallsYes ?? 0) + 1,
        dailyCallsYes: (currentState.dailyCallsYes ?? 0) + 1,
        totalBookings: currentState.totalBookings + 1,
        dailyBookings: currentState.dailyBookings + 1,
        sessionCalls: currentState.sessionActive ? currentState.sessionCalls + 1 : currentState.sessionCalls,
        sessionBookings: currentState.sessionActive ? currentState.sessionBookings + 1 : currentState.sessionBookings,
        firstBookingDate: isFirstBooking ? today : currentState.firstBookingDate,
      };

      newState = updateStreak(newState, today);

      if (isFirstCallOfDay) {
        newState = { ...newState, weeklyDaysActive: newState.weeklyDaysActive + 1 };
      }

      const { newAchievements: achIds, moneyGain: achMoney } = checkAchievements(newState);
      if (achIds.length > 0) {
        newState = {
          ...newState,
          totalMoneyEarned: newState.totalMoneyEarned + achMoney,
          unlockedAchievements: [...newState.unlockedAchievements, ...achIds],
        };
      }

      const { newMissions } = checkWeeklyMissions(newState);
      if (newMissions.length > 0) {
        newState = { ...newState, weeklyMissionsCompleted: [...newState.weeklyMissionsCompleted, ...newMissions] };
      }

      const ranksRewarded = newState.ranksRewarded ?? [];
      let rankMoneyGain = 0;
      const newRanksRewarded = [...ranksRewarded];
      for (const rank of RANKS) {
        if (newState.totalBookings >= rank.minBookings && !newRanksRewarded.includes(rank.name)) {
          rankMoneyGain += RANK_MONEY_REWARDS[rank.name] ?? 0;
          newRanksRewarded.push(rank.name);
        }
      }
      if (rankMoneyGain > 0 || newRanksRewarded.length > ranksRewarded.length) {
        newState = { ...newState, totalMoneyEarned: newState.totalMoneyEarned + rankMoneyGain, ranksRewarded: newRanksRewarded };
      }

      return newState;
    }

    case "UNDO_CALL": {
      if (currentState.dailyCalls <= 0) return currentState;
      return {
        ...currentState,
        totalCalls: Math.max(0, currentState.totalCalls - 1),
        dailyCalls: Math.max(0, currentState.dailyCalls - 1),
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
      return {
        ...currentState,
        sessionActive: false,
        sessionStart: null,
        unlockedAchievements: newUnlocked,
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

    case "ADD_PROSPECT": {
      const now = new Date().toISOString();
      const newProspect = {
        ...action.data,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        createdAt: now,
        updatedAt: now,
      };
      return { ...currentState, prospects: [...(currentState.prospects ?? []), newProspect] };
    }

    case "UPDATE_PROSPECT": {
      const now = new Date().toISOString();
      return {
        ...currentState,
        prospects: (currentState.prospects ?? []).map((p) =>
          p.id === action.id ? { ...p, ...action.changes, updatedAt: now } : p
        ),
      };
    }

    case "DELETE_PROSPECT": {
      return {
        ...currentState,
        prospects: (currentState.prospects ?? []).filter((p) => p.id !== action.id),
      };
    }

    case "IMPORT_PROSPECTS": {
      const importNow = new Date().toISOString();
      const base = Date.now();
      const newProspects = action.data.map((d, i) => ({
        ...d,
        id: (base + i).toString(36) + Math.random().toString(36).slice(2, 7),
        createdAt: importNow,
        updatedAt: importNow,
      }));
      return { ...currentState, prospects: [...(currentState.prospects ?? []), ...newProspects] };
    }

    case "RESET_STATS": {
      return {
        ...defaultState,
        playerName:    currentState.playerName,
        playerEmail:   currentState.playerEmail,
        prospects:     currentState.prospects,
        weeklyKey:     currentWeekKey,
        lastResetDate: today,
      };
    }

    case "LOGOUT": {
      return { ...defaultState };
    }

    case "TICK": {
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
