import { describe, expect, it } from "vitest";
import { createDefaultSave, loadSave, reconcileOffline, saveState } from "./persistence";

describe("cat-room persistence", () => {
  it("falls back safely when localStorage contains invalid JSON", () => {
    const save = loadSave("{not-json", 1_000);
    expect(save.schemaVersion).toBe(1);
    expect(save.lastVisitAt).toBe(1_000);
    expect(Object.keys(save.cats)).toHaveLength(6);
  });

  it("migrates missing fields from an older save without throwing", () => {
    const save = loadSave(JSON.stringify({ schemaVersion: 1, lastVisitAt: 2_000, cats: {} }), 3_000);
    expect(save.schemaVersion).toBe(1);
    expect(save.preferences.muted).toBe(false);
    expect(Object.keys(save.cats)).toHaveLength(6);
  });

  it("reconciles offline time with a bounded approximation", () => {
    const start = createDefaultSave(1_000);
    const next = reconcileOffline(start, 1_000 + 8 * 60 * 60 * 1_000);
    expect(next.lastVisitAt).toBe(1_000 + 8 * 60 * 60 * 1_000);
    expect(next.cats.miso.needs.hunger).toBeGreaterThan(start.cats.miso.needs.hunger);
    expect(next.cats.miso.needs.energy).toBeLessThanOrEqual(1);
  });

  it("writes serializable state through a storage-like boundary", () => {
    let value = "";
    saveState(createDefaultSave(42), {
      getItem: () => null,
      setItem: (_key, next) => {
        value = next;
      }
    });
    expect(JSON.parse(value).schemaVersion).toBe(1);
  });
});
