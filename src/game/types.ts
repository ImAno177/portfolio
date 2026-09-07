export type TimeBlock =
  | "morning"
  | "active-morning"
  | "midday"
  | "afternoon"
  | "sunset"
  | "evening"
  | "night";

export type CatAction =
  | "idle"
  | "walk"
  | "sit"
  | "sleep"
  | "groom"
  | "eat"
  | "observe"
  | "play"
  | "react"
  | "meow";

export type ZoneId =
  | "desk"
  | "bookshelf"
  | "sofa"
  | "food"
  | "play"
  | "plants"
  | "window"
  | "balcony"
  | "board";

export interface CatPersonality {
  sleepiness: number;
  curiosity: number;
  socialness: number;
  playfulness: number;
  foodMotivation: number;
  independence: number;
  chaos: number;
}

export interface CatNeeds {
  energy: number;
  hunger: number;
  social: number;
  fun: number;
  comfort: number;
}

export interface CatAgent {
  id: string;
  name: string;
  spriteVariant: string;
  tint: number;
  personality: CatPersonality;
  needs: CatNeeds;
  currentState: CatAction;
  currentZone: ZoneId;
  targetZone?: ZoneId;
  friendship: number;
  lastStateAt: number;
  lastInteractionAt: number;
  actionCooldowns: Partial<Record<CatAction | "pet" | "feed" | "play", number>>;
}

export interface TimeProfile {
  sleep: number;
  walk: number;
  sit: number;
  groom: number;
  eat: number;
  observe: number;
  play: number;
  idle: number;
  social: number;
  hungerRate: number;
  energyRate: number;
}

export interface DecisionContext {
  hour: number;
  now: number;
  elapsedInState: number;
  occupiedZones: Set<ZoneId>;
  recentActions: CatAction[];
  randomJitter: number;
}

export interface ActionScore {
  action: CatAction;
  score: number;
}

export interface CatSaveState {
  friendship: number;
  timesPetted: number;
  timesFed: number;
  timesPlayed: number;
  needs: CatNeeds;
  currentState: CatAction;
  currentZone: ZoneId;
  lastStateAt: number;
  lastInteractionAt: number;
}

export interface PortfolioSave {
  schemaVersion: 1;
  lastVisitAt: number;
  cats: Record<string, CatSaveState>;
  preferences: {
    muted: boolean;
    reducedMotion?: boolean;
  };
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
