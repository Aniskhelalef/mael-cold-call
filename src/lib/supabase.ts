import { createClient } from "@supabase/supabase-js";
import type { GameState } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
export const isSupabaseConfigured = !!(url && key);

export interface LeaderboardEntry {
  email: string;
  name: string;
  totalXP: number;
  totalCalls: number;
  totalBookings: number;
  currentStreak: number;
  totalSales: number;
  updatedAt: string;
}

export async function syncStateToSupabase(state: GameState): Promise<void> {
  if (!supabase || !state.playerName || !state.playerEmail) return;
  try {
    // Use playerEmail as the row ID so multiple users can coexist
    await supabase.from("game_state").upsert(
      { id: state.playerEmail, data: state, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  } catch {
    // ignore — localStorage is the source of truth
  }
}

export async function fetchStateFromSupabase(email?: string): Promise<{
  state: GameState;
  syncedAt: string;
} | null> {
  if (!supabase) return null;
  try {
    const id = email || "mael";
    const { data, error } = await supabase
      .from("game_state")
      .select("data, updated_at")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return { state: data.data as GameState, syncedAt: data.updated_at };
  } catch {
    return null;
  }
}

// ── Script votes ─────────────────────────────────────────────────────────────
// Table: script_votes (id TEXT PK, likes INT DEFAULT 0, dislikes INT DEFAULT 0)

export interface ScriptVote { id: string; likes: number; dislikes: number; }

export async function fetchScriptVotes(): Promise<Record<string, ScriptVote>> {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase.from("script_votes").select("id, likes, dislikes");
    if (error || !data) return {};
    const map: Record<string, ScriptVote> = {};
    for (const row of data as ScriptVote[]) map[row.id] = row;
    return map;
  } catch {
    return {};
  }
}

export async function castScriptVote(id: string, type: "like" | "dislike", delta: 1 | -1): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.from("script_votes").select("likes, dislikes").eq("id", id).single();
    const cur = (data ?? { likes: 0, dislikes: 0 }) as { likes: number; dislikes: number };
    await supabase.from("script_votes").upsert(
      {
        id,
        likes:    type === "like"    ? Math.max(0, cur.likes    + delta) : cur.likes,
        dislikes: type === "dislike" ? Math.max(0, cur.dislikes + delta) : cur.dislikes,
      },
      { onConflict: "id" }
    );
  } catch {
    // ignore
  }
}

// ── Delete account (admin) ───────────────────────────────────────────────────

export async function deleteAccount(email: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("game_state").delete().eq("id", email);
    return !error;
  } catch {
    return false;
  }
}

// ── Reset user state (admin) — wipes stats + pipeline, keeps account ─────────

export async function resetUserState(email: string, name: string): Promise<boolean> {
  if (!supabase) return false;
  const today = new Date().toISOString().split("T")[0];
  const fresh = {
    playerName: name, playerEmail: email,
    totalCalls: 0, totalBookings: 0, dailyCalls: 0, dailyBookings: 0,
    lastResetDate: today, currentStreak: 0, longestStreak: 0, lastActivityDate: "",
    totalCallsYes: 0, dailyCallsYes: 0, history: [], unlockedAchievements: [],
    pendingToasts: [], sessionActive: false, sessionStart: null,
    sessionTargetMinutes: 30, sessionCalls: 0, sessionBookings: 0,
    weeklyCallsAtStart: 0, weeklyBookingsAtStart: 0, weeklyDaysActive: 0,
    weeklyKey: "", weeklyMissionsCompleted: [], firstBookingDate: null,
    firstDayCalls: 0, noScopeEligible: false, totalMoneyEarned: 0,
    prospects: [], ranksRewarded: [],
  };
  try {
    const { error } = await supabase.from("game_state").upsert(
      { id: email, data: fresh, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
    return !error;
  } catch {
    return false;
  }
}

// ── All users (admin) ────────────────────────────────────────────────────────

export async function fetchAllStates(): Promise<{ email: string; state: GameState; syncedAt: string }[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("game_state")
      .select("id, data, updated_at")
      .order("updated_at", { ascending: false });
    if (error || !data) return [];
    return (data as { id: string; data: GameState; updated_at: string }[])
      .filter((row) => row.data?.playerName)
      .map((row) => ({ email: row.id, state: row.data as GameState, syncedAt: row.updated_at }));
  } catch {
    return [];
  }
}

// ── Script variants (contributions utilisateurs) ─────────────────────────────
// Table: script_variants (id TEXT PK, step_id TEXT, author TEXT, text TEXT, likes INT DEFAULT 0, created_at TIMESTAMPTZ)

export interface ScriptVariant {
  id: string;
  step_id: string;
  author: string;
  text: string;
  likes: number;
  created_at: string;
}

export async function fetchScriptVariants(): Promise<ScriptVariant[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("script_variants")
      .select("*")
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data as ScriptVariant[];
  } catch {
    return [];
  }
}

export async function addScriptVariant(step_id: string, author: string, text: string): Promise<ScriptVariant | null> {
  if (!supabase) return null;
  try {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const { data, error } = await supabase
      .from("script_variants")
      .insert({ id, step_id, author, text, likes: 0 })
      .select()
      .single();
    if (error || !data) return null;
    return data as ScriptVariant;
  } catch {
    return null;
  }
}

export async function likeScriptVariant(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.from("script_variants").select("likes").eq("id", id).single();
    const cur = (data as { likes: number } | null)?.likes ?? 0;
    await supabase.from("script_variants").update({ likes: cur + 1 }).eq("id", id);
  } catch {}
}

export async function deleteScriptVariant(id: string): Promise<void> {
  if (!supabase) return;
  try { await supabase.from("script_variants").delete().eq("id", id); } catch {}
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("game_state")
      .select("id, data, updated_at");
    if (error || !data) return [];
    return (data as { id: string; data: GameState; updated_at: string }[])
      .filter((row) => row.data?.playerName)
      .map((row) => ({
        email:          row.id,
        name:           row.data.playerName,
        totalXP:        (row.data as GameState & { totalXP?: number }).totalXP ?? 0,
        totalCalls:     row.data.totalCalls      ?? 0,
        totalBookings:  row.data.totalBookings   ?? 0,
        currentStreak:  row.data.currentStreak   ?? 0,
        totalSales:     0,
        updatedAt:      row.updated_at,
      }))
      .sort((a, b) => b.totalXP - a.totalXP);
  } catch {
    return [];
  }
}
