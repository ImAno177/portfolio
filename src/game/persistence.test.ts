import { describe, expect, it } from "vitest";
import {
  createDefaultSave,
  loadSave,
  reconcileOffline,
  saveState,
} from "./persistence";

describe("cat-room persistence", () => {
  it("falls back safely when localStorage contains invalid JSON", () => {
    const save = loadSave("{not-json", 1_000);
    expect(save.schemaVersion).toBe(1);
    expect(save.lastVisitAt).toBe(1_000);
    expect(Object.keys(save.cats)).toHaveLength(6);
  });

  it("migrates missing fields from an older save without throwing", () => {
    const save = loadSave(
      JSON.stringify({ schemaVersion: 1, lastVisitAt: 2_000, cats: {} }),
      3_000,
    );
    expect(save.schemaVersion).toBe(1);
    expect(save.preferences.muted).toBe(false);
    expect(Object.keys(save.cats)).toHaveLength(6);
  });

  it("sanitizes malformed fields while preserving valid friendship and counters", () => {
    const save = loadSave(
      JSON.stringify({
        lastVisitAt: null,
        cats: {
          miso: {
            friendship: 0.75,
            timesPetted: 7,
            timesFed: 1e30,
            timesPlayed: -2,
            needs: {
              energy: "bad",
              hunger: 2,
              social: null,
              fun: -1,
              comfort: [],
            },
            currentState: "teleport",
            currentZone: ["sofa"],
            lastStateAt: [],
            lastInteractionAt: 4_000,
          },
        },
        preferences: { muted: "false", reducedMotion: [] },
      }),
      3_000,
    );

    expect(save.lastVisitAt).toBe(3_000);
    expect(save.cats.miso.friendship).toBe(0.75);
    expect(save.cats.miso.timesPetted).toBe(7);
    expect(save.cats.miso.timesFed).toBeLessThanOrEqual(1_000_000);
    expect(save.cats.miso.timesPlayed).toBe(0);
    expect(save.cats.miso.needs).toEqual({
      energy: 0.48,
      hunger: 1,
      social: 0.52,
      fun: 0,
      comfort: 0.86,
    });
    expect(save.cats.miso.currentState).toBe("idle");
    expect(save.cats.miso.currentZone).toBe("sofa");
    expect(save.preferences.muted).toBe(false);
    expect(save.preferences.reducedMotion).toBeUndefined();
    expect(save.cats.miso.lastStateAt).toBe(3_000);
    expect(save.cats.miso.lastInteractionAt).toBe(4_000);
  });

  it("falls back for null, array, and nested malformed save shapes", () => {
    for (const raw of [
      "null",
      "[]",
      JSON.stringify({ cats: [], preferences: null }),
    ]) {
      const save = loadSave(raw, 1_000);
      expect(save.schemaVersion).toBe(1);
      expect(save.lastVisitAt).toBe(1_000);
      expect(Object.keys(save.cats)).toHaveLength(6);
    }
  });

  it("reconciles offline time with a bounded approximation", () => {
    const start = createDefaultSave(1_000);
    const next = reconcileOffline(start, 1_000 + 8 * 60 * 60 * 1_000);
    expect(next.lastVisitAt).toBe(1_000 + 8 * 60 * 60 * 1_000);
    expect(next.cats.miso.needs.hunger).toBeGreaterThan(
      start.cats.miso.needs.hunger,
    );
    expect(next.cats.miso.needs.energy).toBeLessThanOrEqual(1);
  });

  it("does not move the visit timestamp backward when the clock regresses", () => {
    const save = createDefaultSave(10_000);
    const next = reconcileOffline(save, 5_000);

    expect(next.lastVisitAt).toBe(10_000);
    expect(next.cats.miso.needs).toEqual(save.cats.miso.needs);
  });

  it("uses visitor-local daylight profiles and rests during night or saved sleep", () => {
    const duration = 4 * 60 * 60 * 1_000;
    const dayStart = new Date(2024, 0, 1, 8).getTime();
    const nightStart = new Date(2024, 0, 1, 0).getTime();
    const day = createDefaultSave(dayStart);
    const night = createDefaultSave(nightStart);
    const sleeping = createDefaultSave(dayStart);
    sleeping.cats.miso.currentState = "sleep";

    const dayNext = reconcileOffline(day, dayStart + duration);
    const nightNext = reconcileOffline(night, nightStart + duration);
    const sleepingNext = reconcileOffline(sleeping, dayStart + duration);

    expect(dayNext.cats.miso.needs.hunger).toBeGreaterThan(
      nightNext.cats.miso.needs.hunger,
    );
    expect(dayNext.cats.miso.needs.energy).toBeLessThan(
      day.cats.miso.needs.energy,
    );
    expect(nightNext.cats.miso.needs.energy).toBeGreaterThan(
      night.cats.miso.needs.energy,
    );
    expect(sleepingNext.cats.miso.needs.energy).toBeGreaterThan(
      dayNext.cats.miso.needs.energy,
    );
    expect(
      Object.values(nightNext.cats.miso.needs).every(
        (value) => value >= 0 && value <= 1,
      ),
    ).toBe(true);
  });

  it("writes serializable state through a storage-like boundary", () => {
    let value = "";
    saveState(createDefaultSave(42), {
      getItem: () => null,
      setItem: (_key, next) => {
        value = next;
      },
    });
    expect(JSON.parse(value).schemaVersion).toBe(1);
  });
});
