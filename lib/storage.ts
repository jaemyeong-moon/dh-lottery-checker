import type { DrawResult, NumberSet } from "./types";

const KEYS = {
  NUMBER_SETS: "lotto_number_sets",
  DRAW_CACHE: "lotto_draw_cache",
  LATEST_DRW: "lotto_latest_drw",
} as const;

// ── Number Sets ──────────────────────────────────────────────────────────────

export function loadNumberSets(): NumberSet[] {
  try {
    const raw = localStorage.getItem(KEYS.NUMBER_SETS);
    return raw ? (JSON.parse(raw) as NumberSet[]) : [];
  } catch {
    return [];
  }
}

export function saveNumberSets(sets: NumberSet[]): void {
  localStorage.setItem(KEYS.NUMBER_SETS, JSON.stringify(sets));
}

export function addNumberSet(set: NumberSet): NumberSet[] {
  const sets = loadNumberSets();
  const next = [set, ...sets];
  saveNumberSets(next);
  return next;
}

export function removeNumberSet(id: string): NumberSet[] {
  const next = loadNumberSets().filter((s) => s.id !== id);
  saveNumberSets(next);
  return next;
}

// ── Draw Cache ───────────────────────────────────────────────────────────────

export function loadDrawCache(): Record<number, DrawResult> {
  try {
    const raw = localStorage.getItem(KEYS.DRAW_CACHE);
    return raw ? (JSON.parse(raw) as Record<number, DrawResult>) : {};
  } catch {
    return {};
  }
}

export function saveDrawCache(cache: Record<number, DrawResult>): void {
  localStorage.setItem(KEYS.DRAW_CACHE, JSON.stringify(cache));
}

export function getCachedLatestDrwNo(): number | null {
  try {
    const raw = localStorage.getItem(KEYS.LATEST_DRW);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

export function setCachedLatestDrwNo(drwNo: number): void {
  localStorage.setItem(KEYS.LATEST_DRW, String(drwNo));
}
