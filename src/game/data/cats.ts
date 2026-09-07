import type { CatAgent, CatNeeds, CatPersonality, ZoneId } from "../types";

interface CatSeed {
  id: string;
  name: string;
  spriteVariant: string;
  tint: number;
  zone: ZoneId;
  personality: CatPersonality;
  needs: CatNeeds;
}

export const CAT_SEEDS: readonly CatSeed[] = [
  {
    id: "miso",
    name: "Miso",
    spriteVariant: "cat-1",
    tint: 0xffd88c,
    zone: "sofa",
    personality: { sleepiness: 0.9, curiosity: 0.25, socialness: 0.7, playfulness: 0.35, foodMotivation: 0.8, independence: 0.2, chaos: 0.1 },
    needs: { energy: 0.48, hunger: 0.32, social: 0.52, fun: 0.42, comfort: 0.86 }
  },
  {
    id: "pixel",
    name: "Pixel",
    spriteVariant: "cat-1-6",
    tint: 0x9ed7ff,
    zone: "desk",
    personality: { sleepiness: 0.35, curiosity: 0.9, socialness: 0.45, playfulness: 0.65, foodMotivation: 0.4, independence: 0.55, chaos: 0.35 },
    needs: { energy: 0.78, hunger: 0.38, social: 0.42, fun: 0.64, comfort: 0.5 }
  },
  {
    id: "luna",
    name: "Luna",
    spriteVariant: "cat-1-9",
    tint: 0xd7b8ff,
    zone: "window",
    personality: { sleepiness: 0.65, curiosity: 0.82, socialness: 0.3, playfulness: 0.3, foodMotivation: 0.45, independence: 0.82, chaos: 0.18 },
    needs: { energy: 0.65, hunger: 0.42, social: 0.3, fun: 0.5, comfort: 0.7 }
  },
  {
    id: "root",
    name: "Root",
    spriteVariant: "cat-text",
    tint: 0xffa9a0,
    zone: "bookshelf",
    personality: { sleepiness: 0.46, curiosity: 0.72, socialness: 0.48, playfulness: 0.52, foodMotivation: 0.7, independence: 0.45, chaos: 0.62 },
    needs: { energy: 0.74, hunger: 0.47, social: 0.46, fun: 0.56, comfort: 0.42 }
  },
  {
    id: "cobalt",
    name: "Cobalt",
    spriteVariant: "cat-1",
    tint: 0x8de6d5,
    zone: "balcony",
    personality: { sleepiness: 0.25, curiosity: 0.86, socialness: 0.56, playfulness: 0.82, foodMotivation: 0.52, independence: 0.32, chaos: 0.78 },
    needs: { energy: 0.88, hunger: 0.4, social: 0.58, fun: 0.77, comfort: 0.34 }
  },
  {
    id: "mono",
    name: "Mono",
    spriteVariant: "cat-1-6",
    tint: 0xffc3b1,
    zone: "plants",
    personality: { sleepiness: 0.58, curiosity: 0.56, socialness: 0.62, playfulness: 0.46, foodMotivation: 0.9, independence: 0.25, chaos: 0.38 },
    needs: { energy: 0.59, hunger: 0.55, social: 0.64, fun: 0.41, comfort: 0.57 }
  }
];

export function createCatAgents(now: number): Record<string, CatAgent> {
  return Object.fromEntries(
    CAT_SEEDS.map((seed) => [
      seed.id,
      {
        ...seed,
        currentState: "idle",
        currentZone: seed.zone,
        friendship: 0,
        lastStateAt: now,
        lastInteractionAt: 0,
        actionCooldowns: {}
      }
    ])
  );
}
