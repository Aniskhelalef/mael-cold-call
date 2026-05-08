import { createClient } from "@supabase/supabase-js";
import type { GameState } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
export const isSupabaseConfigured = !!(url && key);

export async function syncStateToSupabase(state: GameState): Promise<void> {
  if (!supabase || !state.playerName) return;
  try {
    await supabase.from("game_state").upsert(
      { id: "mael", data: state, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  } catch {
    // ignore — localStorage is the source of truth
  }
}

export async function fetchStateFromSupabase(): Promise<{
  state: GameState;
  syncedAt: string;
} | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("game_state")
      .select("data, updated_at")
      .eq("id", "mael")
      .single();
    if (error || !data) return null;
    return { state: data.data as GameState, syncedAt: data.updated_at };
  } catch {
    return null;
  }
}
