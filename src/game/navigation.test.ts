import { describe, it, expect } from "vitest";
import {
  findPath,
  reserveDestination,
  walkable,
  zoneSlots,
} from "./navigation";
import room from "./data/room.json";
import type { ZoneId } from "./types";
describe("shared room navigation", () => {
  it("does not reserve a slot inside another cat's avoidance distance", () => {
    const slots = zoneSlots("play");
    expect(
      reserveDestination("play", { x: 312, y: 328 }, [slots[0]])?.point,
    ).toEqual(slots[2]);
    expect(
      reserveDestination("window", { x: 312, y: 328 }, [
        zoneSlots("window")[0],
      ]),
    ).toBeUndefined();
  });
  it("enters the balcony through the doorway, never through its railing", () => {
    expect(walkable({ x: 472, y: 184 })).toBe(false);
    expect(walkable({ x: 280, y: 152 })).toBe(false);
    const path = findPath({ x: 472, y: 216 }, { x: 472, y: 168 });
    expect(path).toContainEqual({ x: 456, y: 184 });
  });
  it("routes around another cat instead of stacking on its cell", () => {
    const path = findPath({ x: 312, y: 328 }, { x: 376, y: 328 }, [
      { x: 344, y: 328 },
    ]);
    expect(path.length).toBeGreaterThan(4);
    expect(path).not.toContainEqual({ x: 344, y: 328 });
  });
  it("every sofa slot has a distinct seat inside the sofa artwork", () => {
    const sofa = room.objects.find((item) => item.id === "sofa")!;
    expect(sofa.perches?.length).toBe(room.zones.sofa.length);
    for (const slot of sofa.perches!) {
      expect(walkable({ x: slot.approach[0], y: slot.approach[1] })).toBe(true);
      expect(slot.seat[0]).toBeGreaterThan(sofa.x);
      expect(slot.seat[0]).toBeLessThan(sofa.x + 96);
      expect(slot.seat[1]).toBeGreaterThan(sofa.y + 32);
      expect(slot.seat[1]).toBeLessThan(sofa.y + 64);
    }
  });
  it("finishes the final pixels within the destination cell", () => {
    expect(reserveDestination("food", { x: 50, y: 198 }, [])?.path).toEqual([
      { x: 56, y: 200 },
    ]);
  });
  it("every zone is reachable without crossing furniture", () => {
    for (const zone of Object.keys(room.zones) as ZoneId[])
      for (const point of zoneSlots(zone)) {
        expect(walkable(point), `${zone}: ${JSON.stringify(point)}`).toBe(true);
        const path = findPath({ x: 312, y: 328 }, point);
        expect(path.length, zone).toBeGreaterThan(0);
        for (const step of path) expect(walkable(step)).toBe(true);
        for (let i = 1; i < path.length; i++)
          expect(
            Math.abs(path[i].x - path[i - 1].x) +
              Math.abs(path[i].y - path[i - 1].y),
          ).toBe(16);
      }
  });
  it("reserves another slot and declines full zones", () => {
    const slots = zoneSlots("food");
    expect(
      reserveDestination("food", { x: 312, y: 328 }, [slots[0]])?.point,
    ).toEqual(slots[1]);
    expect(
      reserveDestination("food", { x: 312, y: 328 }, slots),
    ).toBeUndefined();
  });
  it("rejects furniture and off-world destinations", () => {
    expect(findPath({ x: 312, y: 328 }, { x: 328, y: 200 })).toEqual([]);
    expect(findPath({ x: 312, y: 328 }, { x: -8, y: 328 })).toEqual([]);
  });
});
