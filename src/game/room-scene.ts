import Phaser from "phaser";
import { createCatAgents } from "./data/cats";
import { advanceNeeds, chooseAction, getTimeBlock, getTimeProfile, MIN_STATE_DURATION_MS, scoreActions } from "./simulation";
import type { CatAction, CatAgent, CatSaveState, PortfolioSave, TimeBlock, ZoneId } from "./types";

export type CatInteraction = "pet" | "feed" | "play" | "call";

export interface RoomSceneOptions {
  basePath: string;
  save?: PortfolioSave;
  reducedMotion?: boolean;
  getHour?: () => number;
  onReady?: () => void;
  onTime?: (hour: number, block: TimeBlock) => void;
  onCatSelected?: (cat: CatAgent) => void;
  onInteraction?: (cat: CatAgent, action: CatInteraction) => void;
  onSnapshot?: (cats: Record<string, CatAgent>) => void;
  onStatus?: (message: string) => void;
}

interface CatView {
  agent: CatAgent;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
}

const WIDTH = 960;
const WALK_ZONES: ZoneId[] = ["desk", "bookshelf", "sofa", "food", "play", "plants", "window", "balcony"];
const ZONE_POINTS: Record<ZoneId, { x: number; y: number }> = {
  desk: { x: 190, y: 390 },
  bookshelf: { x: 70, y: 300 },
  sofa: { x: 650, y: 415 },
  food: { x: 810, y: 390 },
  play: { x: 500, y: 430 },
  plants: { x: 350, y: 405 },
  window: { x: 850, y: 290 },
  balcony: { x: 540, y: 315 },
  board: { x: 390, y: 255 }
};
const SKY_KEYS: Record<TimeBlock, string> = {
  morning: "sky-01",
  "active-morning": "sky-01",
  midday: "sky-02",
  afternoon: "sky-02",
  sunset: "sky-03",
  evening: "sky-04",
  night: "sky-04"
};
const SKY_TINTS: Record<TimeBlock, number> = {
  morning: 0xfff0c1,
  "active-morning": 0xffffff,
  midday: 0xffffff,
  afternoon: 0xffe5bf,
  sunset: 0xffb08e,
  evening: 0xb0b5e8,
  night: 0x7386c7
};
const STATE_FRAMES: Partial<Record<CatAction, number>> = {
  idle: 0,
  walk: 2,
  sit: 22,
  sleep: 44,
  groom: 66,
  eat: 88,
  observe: 110,
  play: 132,
  react: 154,
  meow: 176
};

function assetUrl(basePath: string, path: string): string {
  return `${basePath}${path.replace(/^\//, "")}`;
}

function currentHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

export class CatRoomScene extends Phaser.Scene {
  private readonly options: RoomSceneOptions;
  private readonly views = new Map<string, CatView>();
  private sky?: Phaser.GameObjects.Image;
  private selectedId?: string;
  private lastDecisionAt = 0;
  private lastSnapshotAt = 0;
  private reducedMotion: boolean;

  constructor(options: RoomSceneOptions) {
    super("CatRoomScene");
    this.options = options;
    this.reducedMotion = Boolean(options.reducedMotion);
  }

  preload(): void {
    const base = this.options.basePath;
    for (const key of ["cat-1", "cat-1-6", "cat-1-9", "cat-text"]) {
      this.load.spritesheet(key, assetUrl(base, `/assets/cats/${key}.png`), { frameWidth: 16, frameHeight: 16 });
    }
    for (const key of ["sky-01", "sky-02", "sky-03", "sky-04"]) {
      this.load.image(key, assetUrl(base, `/assets/sky/${key}-orig-big.png`));
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x12192d);
    this.drawRoom();
    this.sky = this.add.image(WIDTH / 2, 168, "sky-01").setDisplaySize(WIDTH, 336).setDepth(0);

    const agents = createCatAgents(Date.now());
    for (const [id, saved] of Object.entries(this.options.save?.cats ?? {})) {
      if (!agents[id]) continue;
      agents[id] = { ...agents[id], ...saved, needs: { ...saved.needs }, actionCooldowns: {} };
    }
    Object.values(agents).forEach((agent, index) => this.addCat(agent, index));
    this.applySky();
    this.options.onReady?.();
    this.options.onStatus?.("Room online. Select a cat to open its controls.");
  }

  update(_time: number, delta: number): void {
    this.lastDecisionAt += delta;
    if (this.lastDecisionAt < (this.reducedMotion ? 2800 : 1300)) return;
    this.lastDecisionAt = 0;

    const now = Date.now();
    const hour = this.options.getHour?.() ?? currentHour();
    const block = getTimeBlock(hour);
    const profile = getTimeProfile(block);
    const occupied = new Set([...this.views.values()].map(({ agent }) => agent.currentZone));

    for (const view of this.views.values()) {
      view.agent.needs = advanceNeeds(view.agent.needs, 1.5 / 60, profile);
      if (now - view.agent.lastStateAt < MIN_STATE_DURATION_MS) continue;
      const action = chooseAction(
        scoreActions(view.agent, {
          hour,
          now,
          elapsedInState: now - view.agent.lastStateAt,
          occupiedZones: occupied,
          recentActions: [view.agent.currentState],
          randomJitter: Math.random()
        })
      );
      this.setAction(view, action, now);
    }
    this.applySky();
    this.options.onTime?.(hour, block);
    if (now - this.lastSnapshotAt > 20_000) {
      this.lastSnapshotAt = now;
      this.options.onSnapshot?.(this.getAgents());
    }
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  handleInteraction(action: CatInteraction): boolean {
    const view = this.selectedId ? this.views.get(this.selectedId) : undefined;
    if (!view) return false;
    const now = Date.now();
    const effects: Record<CatInteraction, Partial<CatAgent["needs"]>> = {
      pet: { social: 0.12, comfort: 0.08 },
      feed: { hunger: -0.3, energy: 0.05 },
      play: { fun: 0.26, energy: -0.08 },
      call: { social: -0.12 }
    };
    for (const [key, delta] of Object.entries(effects[action])) {
      const need = key as keyof CatAgent["needs"];
      view.agent.needs[need] = Math.min(1, Math.max(0, view.agent.needs[need] + Number(delta)));
    }
    view.agent.friendship = Math.min(1, view.agent.friendship + (action === "pet" ? 0.04 : 0.02));
    view.agent.lastInteractionAt = now;
    view.agent.lastStateAt = now;
    if (action !== "call") view.agent.actionCooldowns[action] = now + 2_000;
    this.setAction(view, action === "feed" ? "eat" : action === "call" ? "meow" : action === "play" ? "play" : "react", now);
    this.options.onCatSelected?.(view.agent);
    this.options.onInteraction?.(view.agent, action);
    return true;
  }

  getAgents(): Record<string, CatAgent> {
    return Object.fromEntries([...this.views.entries()].map(([id, view]) => [id, view.agent]));
  }

  private addCat(agent: CatAgent, index: number): void {
    const point = ZONE_POINTS[agent.currentZone];
    const sprite = this.add.sprite(point.x + index * 3, point.y, agent.spriteVariant, STATE_FRAMES[agent.currentState] ?? 0)
      .setOrigin(0.5, 1)
      .setScale(3.5)
      .setTint(agent.tint)
      .setDepth(10 + index)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(point.x, point.y - 60, agent.name, {
      color: "#fff0d0",
      fontFamily: "Courier New, monospace",
      fontSize: "12px",
      stroke: "#111728",
      strokeThickness: 4
    }).setOrigin(0.5, 1).setDepth(30);
    sprite.on("pointerdown", () => {
      this.selectedId = agent.id;
      this.options.onCatSelected?.(agent);
      this.options.onStatus?.(`${agent.name} is ${agent.currentState} near the ${agent.currentZone}.`);
    });
    this.views.set(agent.id, { agent, sprite, label });
  }

  private setAction(view: CatView, action: CatAction, now: number): void {
    view.agent.currentState = action;
    view.agent.lastStateAt = now;
    view.sprite.setFrame(STATE_FRAMES[action] ?? 0);
    if (action !== "walk") return;

    const zone = WALK_ZONES[Math.floor(Math.random() * WALK_ZONES.length)];
    const target = ZONE_POINTS[zone];
    view.agent.targetZone = zone;
    view.agent.currentZone = zone;
    if (this.reducedMotion) {
      view.sprite.setPosition(target.x, target.y);
      view.label.setPosition(target.x, target.y - 60);
      return;
    }
    this.tweens.add({
      targets: view.sprite,
      x: target.x,
      y: target.y,
      duration: 700 + Math.random() * 700,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: view.label,
      x: target.x,
      y: target.y - 60,
      duration: 700 + Math.random() * 700,
      ease: "Sine.easeInOut"
    });
  }

  private applySky(): void {
    if (!this.sky) return;
    const block = getTimeBlock(this.options.getHour?.() ?? currentHour());
    this.sky.setTexture(SKY_KEYS[block]).setTint(SKY_TINTS[block]);
  }

  private drawRoom(): void {
    this.add.rectangle(WIDTH / 2, 401, WIDTH, 278, 0x28324e).setDepth(1);
    this.add.rectangle(WIDTH / 2, 522, WIDTH, 36, 0x111728).setDepth(2);
    this.add.rectangle(WIDTH / 2, 18, WIDTH, 36, 0x111728).setDepth(3);
    this.add.rectangle(WIDTH / 2, 235, WIDTH - 32, 4, 0x9db8dc).setAlpha(0.8).setDepth(3);
    this.add.rectangle(735, 280, 420, 112, 0x34415d).setAlpha(0.54).setDepth(2).setStrokeStyle(2, 0x8aa4cb);
    this.add.rectangle(735, 338, 420, 8, 0x111728).setDepth(4);
    for (let x = 550; x < 930; x += 54) this.add.rectangle(x, 306, 3, 70, 0x8097b5).setAlpha(0.55).setDepth(4);
    for (let x = 18; x < WIDTH; x += 48) this.add.rectangle(x, 466, 2, 56, 0x394765).setDepth(3);

    this.add.rectangle(188, 380, 222, 16, 0x9a6a56).setDepth(4).setStrokeStyle(2, 0x111728);
    this.add.rectangle(194, 427, 12, 76, 0x614b4e).setDepth(3);
    this.add.rectangle(380, 427, 12, 76, 0x614b4e).setDepth(3);
    this.add.rectangle(186, 343, 72, 40, 0x202b4a).setDepth(5).setStrokeStyle(3, 0xffd766);
    this.add.rectangle(222, 398, 24, 7, 0xffd766).setDepth(5);
    this.add.rectangle(690, 394, 235, 55, 0x9b655c).setDepth(4).setStrokeStyle(2, 0x111728);
    this.add.rectangle(676, 439, 12, 44, 0x614b4e).setDepth(3);
    this.add.rectangle(906, 439, 12, 44, 0x614b4e).setDepth(3);
    this.add.rectangle(54, 302, 38, 128, 0x7a5b66).setDepth(4).setStrokeStyle(2, 0x111728);
    for (let y = 324; y < 416; y += 28) this.add.rectangle(54, y, 34, 4, 0xffd766).setAlpha(0.55).setDepth(5);
    this.add.ellipse(352, 419, 82, 24, 0x32624f).setDepth(4);
    this.add.ellipse(352, 390, 42, 75, 0x73b779).setDepth(5);
    this.add.ellipse(350, 357, 22, 62, 0x9fddb0).setDepth(6).setAngle(-20);
    this.add.rectangle(387, 219, 116, 50, 0xd7a267).setDepth(4).setStrokeStyle(2, 0x111728);
    this.add.text(445, 244, "CV", { color: "#17213a", fontFamily: "Courier New, monospace", fontSize: "16px" }).setOrigin(0.5).setDepth(5);
    this.add.rectangle(510, 438, 72, 13, 0xd7a267).setDepth(4).setStrokeStyle(2, 0x111728);
    this.add.ellipse(510, 421, 38, 26, 0xff9c70).setDepth(5);
    this.add.text(510, 423, "*", { color: "#111728", fontSize: "22px", fontFamily: "Courier New, monospace" }).setOrigin(0.5).setDepth(6);
  }
}

export function saveStateFromAgents(save: PortfolioSave, cats: Record<string, CatAgent>, now: number): PortfolioSave {
  return {
    ...save,
    lastVisitAt: now,
    cats: Object.fromEntries(
      Object.entries(save.cats).map(([id, saved]) => {
        const agent = cats[id];
        if (!agent) return [id, saved];
        const next: CatSaveState = {
          ...saved,
          needs: { ...agent.needs },
          currentState: agent.currentState,
          currentZone: agent.currentZone,
          friendship: agent.friendship,
          lastStateAt: agent.lastStateAt,
          lastInteractionAt: agent.lastInteractionAt
        };
        return [id, next];
      })
    )
  };
}
