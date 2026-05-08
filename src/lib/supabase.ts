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
        totalXP:        row.data.totalXP        ?? 0,
        totalCalls:     row.data.totalCalls      ?? 0,
        totalBookings:  row.data.totalBookings   ?? 0,
        currentStreak:  row.data.currentStreak   ?? 0,
        totalSales:     row.data.totalSales      ?? 0,
        updatedAt:      row.updated_at,
      }))
      .sort((a, b) => b.totalXP - a.totalXP);
  } catch {
    return [];
  }
}
