import { createCatAgents } from "./data/cats";
import { advanceNeeds, getTimeBlock, getTimeProfile } from "./simulation";
import type {
  CatAction,
  CatNeeds,
  CatSaveState,
  PortfolioSave,
  StorageLike,
  ZoneId,
} from "./types";

export const SAVE_KEY = "imano177-cat-room-save";
const MAX_COUNTER = 1_000_000;
const HOUR_MS = 60 * 60 * 1_000;
const DAY_MS = 24 * HOUR_MS;
const MAX_DATE_MS = 8.64e15;
const CAT_ACTIONS: readonly CatAction[] = [
  "idle",
  "walk",
  "sit",
  "sleep",
  "groom",
  "eat",
  "observe",
  "play",
  "react",
  "meow",
];
const ZONES: readonly ZoneId[] = [
  "desk",
  "bookshelf",
  "sofa",
  "food",
  "play",
  "plants",
  "window",
  "balcony",
  "board",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value) <= MAX_DATE_MS
  );
}

function normalizeUnit(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

function normalizeCounter(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(MAX_COUNTER, Math.max(0, Math.floor(value)));
}

function normalizeTimestamp(value: unknown, fallback: number): number {
  return isTimestamp(value) ? value : fallback;
}

function isCatAction(value: unknown): value is CatAction {
  return typeof value === "string" && CAT_ACTIONS.includes(value as CatAction);
}

function isZoneId(value: unknown): value is ZoneId {
  return typeof value === "string" && ZONES.includes(value as ZoneId);
}

function normalizeNeeds(needs: unknown, fallback: CatNeeds): CatNeeds {
  const source = isRecord(needs) ? needs : {};
  return {
    energy: normalizeUnit(source.energy, fallback.energy),
    hunger: normalizeUnit(source.hunger, fallback.hunger),
    social: normalizeUnit(source.social, fallback.social),
    fun: normalizeUnit(source.fun, fallback.fun),
    comfort: normalizeUnit(source.comfort, fallback.comfort),
  };
}

function normalizeCat(raw: unknown, fallback: CatSaveState): CatSaveState {
  const source = isRecord(raw) ? raw : {};
  return {
    friendship: normalizeUnit(source.friendship, fallback.friendship),
    timesPetted: normalizeCounter(source.timesPetted, fallback.timesPetted),
    timesFed: normalizeCounter(source.timesFed, fallback.timesFed),
    timesPlayed: normalizeCounter(source.timesPlayed, fallback.timesPlayed),
    needs: normalizeNeeds(source.needs, fallback.needs),
    currentState: isCatAction(source.currentState)
      ? source.currentState
      : fallback.currentState,
    currentZone: isZoneId(source.currentZone)
      ? source.currentZone
      : fallback.currentZone,
    lastStateAt: normalizeTimestamp(source.lastStateAt, fallback.lastStateAt),
    lastInteractionAt: normalizeTimestamp(
      source.lastInteractionAt,
      fallback.lastInteractionAt,
    ),
  };
}

export function createDefaultSave(now: number): PortfolioSave {
  const safeNow = isTimestamp(now) ? now : 0;
  const cats = createCatAgents(safeNow);
  return {
    schemaVersion: 1,
    lastVisitAt: safeNow,
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
          lastInteractionAt: cat.lastInteractionAt,
        },
      ]),
    ),
    preferences: { muted: false },
  };
}

export function loadSave(
  raw: string | null,
  fallbackNow: number,
): PortfolioSave {
  const safeNow = isTimestamp(fallbackNow) ? fallbackNow : 0;
  const fallback = createDefaultSave(safeNow);
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    const source = isRecord(parsed) ? parsed : {};
    const cats = isRecord(source.cats) ? source.cats : {};
    const preferences = isRecord(source.preferences) ? source.preferences : {};
    return {
      schemaVersion: 1,
      lastVisitAt: normalizeTimestamp(source.lastVisitAt, safeNow),
      cats: Object.fromEntries(
        Object.entries(fallback.cats).map(([id, base]) => [
          id,
          normalizeCat(cats[id], base),
        ]),
      ),
      preferences: {
        muted: preferences.muted === true,
        reducedMotion:
          typeof preferences.reducedMotion === "boolean"
            ? preferences.reducedMotion
            : undefined,
      },
    };
  } catch {
    return fallback;
  }
}

export function reconcileOffline(
  save: PortfolioSave,
  now: number,
): PortfolioSave {
  const safeNow = isTimestamp(now)
    ? now
    : isTimestamp(save.lastVisitAt)
      ? save.lastVisitAt
      : 0;
  const lastVisitAt = isTimestamp(save.lastVisitAt)
    ? save.lastVisitAt
    : safeNow;
  if (safeNow <= lastVisitAt) return { ...save, lastVisitAt };
  const elapsedMs = Math.min(DAY_MS, Math.max(0, safeNow - lastVisitAt));
  const start = safeNow - elapsedMs;
  return {
    ...save,
    lastVisitAt: safeNow,
    cats: Object.fromEntries(
      Object.entries(save.cats).map(([id, cat]) => [
        id,
        (() => {
          let needs = cat.needs;
          let cursor = start;
          while (cursor < safeNow) {
            const block = getTimeBlock(new Date(cursor).getHours());
            const boundary = nextLocalHourBoundary(cursor);
            const segmentEnd = Math.min(
              safeNow,
              boundary > cursor ? boundary : cursor + HOUR_MS,
            );
            const seconds = (segmentEnd - cursor) / 1_000;
            needs = advanceNeeds(needs, seconds / 60, getTimeProfile(block));
            if (block === "night" || cat.currentState === "sleep") {
              // Offline time is wall-clock time, not accelerated in-room action time.
              needs = {
                ...needs,
                energy: Math.min(1, needs.energy + (0.08 * seconds) / 3600),
                comfort: Math.min(1, needs.comfort + (0.008 * seconds) / 3600),
              };
            }
            cursor = segmentEnd;
          }
          return { ...cat, needs, currentState: "idle" };
        })(),
      ]),
    ),
  };
}

function nextLocalHourBoundary(timestamp: number): number {
  const boundary = new Date(timestamp);
  boundary.setMinutes(0, 0, 0);
  boundary.setHours(boundary.getHours() + 1);
  const next = boundary.getTime();
  return Number.isFinite(next) && next > timestamp ? next : timestamp + HOUR_MS;
}

export function saveState(
  save: PortfolioSave,
  storage: StorageLike | null | undefined,
): void {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Private mode, quota limits, or blocked storage should not break the portfolio.
  }
}

export function loadBrowserSave(
  now: number,
  storage: StorageLike | null | undefined,
): PortfolioSave {
  try {
    return reconcileOffline(
      loadSave(storage?.getItem(SAVE_KEY) ?? null, now),
      now,
    );
  } catch {
    return createDefaultSave(now);
  }
}
