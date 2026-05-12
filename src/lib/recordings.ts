import { supabase } from "./supabase";

const DB_NAME = "ccod_recordings";
const STORE   = "recordings";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function saveRecording(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(blob, key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function getRecording(key: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx  = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror   = () => resolve(null);
  });
}

export async function deleteRecording(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => resolve();
  });
}

// Upload vers Supabase Storage → retourne l'URL publique ou null
export async function uploadToSupabase(key: string, blob: Blob): Promise<string | null> {
  if (!supabase) return null;
  try {
    const ext  = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "mp4" : "webm";
    const path = `${key}.${ext}`;
    const { error } = await supabase.storage
      .from("recordings")
      .upload(path, blob, { contentType: blob.type, upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("recordings").getPublicUrl(path);
    return data.publicUrl ?? null;
  } catch {
    return null;
  }
}

// Résout une référence (URL http ou clé IndexedDB) en URL utilisable pour <audio>
export async function resolveAudioUrl(ref: string): Promise<string | null> {
  if (ref.startsWith("http")) return ref;
  const blob = await getRecording(ref);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
