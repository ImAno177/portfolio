import { createCatAgents } from "./data/cats";
import { advanceNeeds, getTimeProfile } from "./simulation";
import type { CatNeeds, CatSaveState, PortfolioSave, StorageLike } from "./types";

export const SAVE_KEY = "imano177-cat-room-save";

function clamp(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function normalizeNeeds(needs?: Partial<CatNeeds>): CatNeeds {
  return {
    energy: clamp(needs?.energy ?? 0.5),
    hunger: clamp(needs?.hunger ?? 0.35),
    social: clamp(needs?.social ?? 0.5),
    fun: clamp(needs?.fun ?? 0.5),
    comfort: clamp(needs?.comfort ?? 0.5)
  };
}

function normalizeCat(raw: Partial<CatSaveState> | undefined, fallback: CatSaveState): CatSaveState {
  return {
    friendship: clamp(raw?.friendship ?? fallback.friendship),
    timesPetted: Math.max(0, Math.floor(raw?.timesPetted ?? fallback.timesPetted)),
    timesFed: Math.max(0, Math.floor(raw?.timesFed ?? fallback.timesFed)),
    timesPlayed: Math.max(0, Math.floor(raw?.timesPlayed ?? fallback.timesPlayed)),
    needs: normalizeNeeds(raw?.needs ?? fallback.needs),
    currentState: raw?.currentState ?? fallback.currentState,
    currentZone: raw?.currentZone ?? fallback.currentZone,
    lastStateAt: Number.isFinite(raw?.lastStateAt) ? Number(raw?.lastStateAt) : fallback.lastStateAt,
    lastInteractionAt: Number.isFinite(raw?.lastInteractionAt) ? Number(raw?.lastInteractionAt) : fallback.lastInteractionAt
  };
}

export function createDefaultSave(now: number): PortfolioSave {
  const cats = createCatAgents(now);
  return {
    schemaVersion: 1,
    lastVisitAt: now,
    cats: Object.fromEntries(
      Object.entries(cats).map(([id, cat]) => [
        id,
        {
          friendship: cat.friendship,
          timesPetted: 0,
          timesFed: 0,
          timesPlayed: 0,
          needs: { ...cat.needs },
          currentState: cat.currentState,
          currentZone: cat.currentZone,
          lastStateAt: cat.lastStateAt,
          lastInteractionAt: cat.lastInteractionAt
        }
      ])
    ),
    preferences: { muted: false }
  };
}

export function loadSave(raw: string | null, fallbackNow: number): PortfolioSave {
  const fallback = createDefaultSave(fallbackNow);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<PortfolioSave>;
    return {
      schemaVersion: 1,
      lastVisitAt: Number.isFinite(parsed.lastVisitAt) ? Number(parsed.lastVisitAt) : fallbackNow,
      cats: Object.fromEntries(
        Object.entries(fallback.cats).map(([id, base]) => [id, normalizeCat(parsed.cats?.[id], base)])
      ),
      preferences: {
        muted: Boolean(parsed.preferences?.muted),
        reducedMotion: parsed.preferences?.reducedMotion
      }
    };
  } catch {
    return fallback;
  }
}

export function reconcileOffline(save: PortfolioSave, now: number): PortfolioSave {
  const elapsedMinutes = Math.min(24 * 60, Math.max(0, (now - save.lastVisitAt) / 60_000));
  if (elapsedMinutes === 0) return { ...save, lastVisitAt: now };
  const profile = getTimeProfile("night");
  return {
    ...save,
    lastVisitAt: now,
    cats: Object.fromEntries(
      Object.entries(save.cats).map(([id, cat]) => [
        id,
        {
          ...cat,
          needs: advanceNeeds(cat.needs, elapsedMinutes, profile),
          currentState: "idle"
        }
      ])
    )
  };
}

export function saveState(save: PortfolioSave, storage: StorageLike | null | undefined): void {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Private mode, quota limits, or blocked storage should not break the portfolio.
  }
}

export function loadBrowserSave(now: number, storage: StorageLike | null | undefined): PortfolioSave {
  try {
    return reconcileOffline(loadSave(storage?.getItem(SAVE_KEY) ?? null, now), now);
  } catch {
    return createDefaultSave(now);
  }
}
