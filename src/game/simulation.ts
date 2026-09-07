import type { ActionScore, CatAction, CatAgent, CatNeeds, DecisionContext, TimeBlock, TimeProfile, ZoneId } from "./types";

export const MIN_STATE_DURATION_MS = 5_000;

const ACTIONS: readonly CatAction[] = ["idle", "walk", "sit", "sleep", "groom", "eat", "observe", "play", "react", "meow"];

const PROFILES: Record<TimeBlock, TimeProfile> = {
  morning: { sleep: 0.22, walk: 0.5, sit: 0.28, groom: 0.38, eat: 0.56, observe: 0.5, play: 0.44, idle: 0.32, social: 0.42, hungerRate: 0.04, energyRate: 0.03 },
  "active-morning": { sleep: 0.12, walk: 0.66, sit: 0.18, groom: 0.24, eat: 0.38, observe: 0.38, play: 0.72, idle: 0.24, social: 0.62, hungerRate: 0.05, energyRate: 0.05 },
  midday: { sleep: 0.72, walk: 0.18, sit: 0.52, groom: 0.46, eat: 0.34, observe: 0.22, play: 0.16, idle: 0.54, social: 0.24, hungerRate: 0.035, energyRate: 0.02 },
  afternoon: { sleep: 0.2, walk: 0.58, sit: 0.24, groom: 0.28, eat: 0.42, observe: 0.42, play: 0.7, idle: 0.22, social: 0.58, hungerRate: 0.05, energyRate: 0.055 },
  sunset: { sleep: 0.3, walk: 0.4, sit: 0.56, groom: 0.36, eat: 0.34, observe: 0.8, play: 0.28, idle: 0.38, social: 0.5, hungerRate: 0.042, energyRate: 0.035 },
  evening: { sleep: 0.62, walk: 0.22, sit: 0.6, groom: 0.52, eat: 0.48, observe: 0.36, play: 0.24, idle: 0.5, social: 0.62, hungerRate: 0.04, energyRate: 0.02 },
  night: { sleep: 0.94, walk: 0.08, sit: 0.46, groom: 0.34, eat: 0.22, observe: 0.18, play: 0.12, idle: 0.48, social: 0.12, hungerRate: 0.028, energyRate: 0.01 }
};

const ZONE_BONUS: Partial<Record<CatAction, ZoneId[]>> = {
  eat: ["food"],
  play: ["play"],
  observe: ["window", "balcony", "bookshelf"],
  sleep: ["sofa", "window", "balcony"],
  sit: ["desk", "sofa", "plants", "balcony"]
};

export function getTimeBlock(hour: number): TimeBlock {
  const normalizedHour = ((Math.floor(hour) % 24) + 24) % 24;
  if (normalizedHour < 5) return "night";
  if (normalizedHour < 9) return "morning";
  if (normalizedHour < 12) return "active-morning";
  if (normalizedHour < 15) return "midday";
  if (normalizedHour < 18) return "afternoon";
  if (normalizedHour < 20) return "sunset";
  if (normalizedHour < 24) return "evening";
  return "night";
}

export function getTimeProfile(block: TimeBlock): TimeProfile {
  return { ...PROFILES[block] };
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function needInfluence(cat: CatAgent, action: CatAction): number {
  if (action === "sleep") return (1 - cat.needs.energy) * 0.9 + cat.personality.sleepiness * 0.65;
  if (action === "eat") return cat.needs.hunger * 0.85 + cat.personality.foodMotivation * 0.65;
  if (action === "play") return (1 - cat.needs.fun) * 0.7 + cat.personality.playfulness * 0.75;
  if (action === "meow" || action === "react") return (1 - cat.needs.social) * 0.35 + cat.personality.socialness * 0.24;
  if (action === "observe") return cat.personality.curiosity * 0.7;
  if (action === "groom") return cat.needs.comfort * 0.2 + (1 - cat.needs.comfort) * 0.45;
  return 0;
}

function personalityInfluence(cat: CatAgent, action: CatAction): number {
  if (action === "walk") return cat.personality.curiosity * 0.32 + cat.personality.chaos * 0.16;
  if (action === "sit") return cat.personality.independence * 0.18;
  if (action === "idle") return cat.personality.independence * 0.22;
  return 0;
}

export function scoreActions(cat: CatAgent, context: DecisionContext): ActionScore[] {
  const profile = getTimeProfile(getTimeBlock(context.hour));
  return ACTIONS.map((action) => {
    const base = action === "react" || action === "meow" ? profile.social : profile[action as keyof TimeProfile] ?? 0.1;
    const need = needInfluence(cat, action);
    const personality = personalityInfluence(cat, action);
    const zoneBonus = ZONE_BONUS[action]?.includes(cat.currentZone) ? 0.18 : 0;
    const occupiedPenalty = action === "walk" && context.occupiedZones.has(cat.targetZone ?? cat.currentZone) ? 0.14 : 0;
    const recentPenalty = context.recentActions.includes(action) ? 0.2 : 0;
    const switchingPenalty = context.elapsedInState < MIN_STATE_DURATION_MS && action !== cat.currentState ? 0.7 : 0;
    const cooldownPenalty = (cat.actionCooldowns[action] ?? 0) > context.now ? 100 : 0;
    const jitter = context.randomJitter * (0.08 + cat.personality.chaos * 0.16);
    return {
      action,
      score: Math.max(0, base + need + personality + zoneBonus - occupiedPenalty - recentPenalty - switchingPenalty + jitter - cooldownPenalty)
    };
  });
}

export function chooseAction(scores: ActionScore[], random: () => number = Math.random): CatAction {
  const available = scores.filter((entry) => entry.score > 0);
  if (!available.length) return "idle";
  const total = available.reduce((sum, entry) => sum + entry.score, 0);
  let cursor = clamp(random()) * total;
  for (const entry of available) {
    cursor -= entry.score;
    if (cursor <= 0) return entry.action;
  }
  return available[available.length - 1].action;
}

export function advanceNeeds(needs: CatNeeds, minutes: number, profile: TimeProfile): CatNeeds {
  const boundedMinutes = Math.min(24 * 60, Math.max(0, minutes));
  const scale = boundedMinutes / 60;
  return {
    energy: clamp(needs.energy + (profile.energyRate - 0.055) * scale),
    hunger: clamp(needs.hunger + profile.hungerRate * scale),
    social: clamp(needs.social + 0.018 * scale),
    fun: clamp(needs.fun - 0.012 * scale),
    comfort: clamp(needs.comfort + 0.01 * scale)
  };
}
