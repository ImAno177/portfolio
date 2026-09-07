import { describe, expect, it } from "vitest";
import {
  advanceNeeds,
  chooseAction,
  getTimeBlock,
  getTimeProfile,
  scoreActions
} from "./simulation";

const cat = {
  id: "test-cat",
  name: "Test Cat",
  spriteVariant: "cat-1",
  tint: 0xffffff,
  personality: {
    sleepiness: 0.8,
    curiosity: 0.4,
    socialness: 0.5,
    playfulness: 0.2,
    foodMotivation: 0.6,
    independence: 0.3,
    chaos: 0.1
  },
  needs: { energy: 0.2, hunger: 0.7, social: 0.4, fun: 0.3, comfort: 0.5 },
  currentState: "idle",
  currentZone: "sofa",
  friendship: 0,
  lastStateAt: 0,
  lastInteractionAt: 0,
  actionCooldowns: {}
} as const;

describe("visitor-local cat simulation", () => {
  it("maps every time boundary to the expected behavior block", () => {
    expect(getTimeBlock(5)).toBe("morning");
    expect(getTimeBlock(9)).toBe("active-morning");
    expect(getTimeBlock(12)).toBe("midday");
    expect(getTimeBlock(15)).toBe("afternoon");
    expect(getTimeBlock(18)).toBe("sunset");
    expect(getTimeBlock(20)).toBe("evening");
    expect(getTimeBlock(0)).toBe("night");
    expect(getTimeBlock(4)).toBe("night");
  });

  it("keeps time profiles expressive without hard-coding actions", () => {
    const night = getTimeProfile("night");
    const afternoon = getTimeProfile("afternoon");
    expect(night.sleep).toBeGreaterThan(afternoon.sleep);
    expect(afternoon.play).toBeGreaterThan(night.play);
  });

  it("scores needs, personality, time and state switching together", () => {
    const scores = scoreActions(cat, {
      hour: 2,
      now: 100_000,
      elapsedInState: 30_000,
      occupiedZones: new Set(["desk"]),
      recentActions: ["sleep"],
      randomJitter: 0
    });
    const sleep = scores.find((entry) => entry.action === "sleep");
    const play = scores.find((entry) => entry.action === "play");
    expect(sleep?.score).toBeGreaterThan(play?.score ?? 0);
    expect(scores.every((entry) => Number.isFinite(entry.score))).toBe(true);
  });

  it("selects by normalized weight instead of always picking the first item", () => {
    const scores = [
      { action: "sleep" as const, score: 1 },
      { action: "play" as const, score: 3 }
    ];
    expect(chooseAction(scores, () => 0.1)).toBe("sleep");
    expect(chooseAction(scores, () => 0.9)).toBe("play");
  });

  it("advances needs by elapsed time and clamps normalized values", () => {
    const next = advanceNeeds(
      { energy: 0.9, hunger: 0.1, social: 0.2, fun: 0.2, comfort: 0.4 },
      180,
      getTimeProfile("night")
    );
    expect(next.energy).toBeLessThan(0.9);
    expect(next.hunger).toBeGreaterThan(0.1);
    expect(Object.values(next).every((value) => value >= 0 && value <= 1)).toBe(true);
  });
});
