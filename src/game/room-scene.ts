import Phaser from "phaser";
import atlas from "./data/atlas.json";
import room from "./data/room.json";
import { createCatAgents } from "./data/cats";
import {
  advanceActionNeeds,
  chooseAction,
  getTimeBlock,
  scoreActions,
} from "./simulation";
import { findPath, reserveDestination, zoneSlots, type Point } from "./navigation";
import type {
  CatAction,
  CatAgent,
  PortfolioSave,
  TimeBlock,
  ZoneId,
} from "./types";

export type CatInteraction = "pet" | "feed" | "play" | "call";
export interface RoomSceneOptions {
  basePath: string;
  save?: PortfolioSave;
  reducedMotion?: boolean;
  getHour?: () => number;
  onReady?: () => void;
  onError?: (message: string) => void;
  onTime?: (hour: number, block: TimeBlock) => void;
  onCatSelected?: (cat: CatAgent) => void;
  onInteraction?: (cat: CatAgent, action: CatInteraction) => void;
  onSnapshot?: (cats: Record<string, CatAgent>) => void;
  onStatus?: (message: string) => void;
}
type View = {
  agent: CatAgent;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  path: Point[];
  destination: Point;
  pending: CatAction;
  until: number;
  history: CatAction[];
  surface?: Point;
  transitDepth?: number;
  rerouteAt?: number;
};
const hourNow = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};
const DURATIONS: Partial<Record<CatAction, number>> = {
  sleep: 30000,
  eat: 10000,
  play: 12000,
  groom: 10000,
  observe: 18000,
};
// Explicit approach -> perch links. Feet travel to the approach before climbing.
const SKY_STOPS = [
  { hour: 0, sky: 1, tint: 0x7986bb, light: 0.28 },
  { hour: 5, sky: 4, tint: 0xffdfad, light: 0.07 },
  { hour: 9, sky: 4, tint: 0xfff3da, light: 0 },
  { hour: 12, sky: 4, tint: 0xffffff, light: 0 },
  { hour: 15, sky: 4, tint: 0xffd9a4, light: 0.04 },
  { hour: 18, sky: 2, tint: 0xffba98, light: 0.12 },
  { hour: 20, sky: 3, tint: 0xb7a1d9, light: 0.19 },
  { hour: 24, sky: 1, tint: 0x7986bb, light: 0.28 },
];

export class CatRoomScene extends Phaser.Scene {
  private views = new Map<string, View>();
  private selectedId?: string;
  private reduced: boolean;
  private elapsed = 0;
  private savedAt = 0;
  private skyLayers = new Map<number, Phaser.GameObjects.Image[]>();
  private lighting?: Phaser.GameObjects.Rectangle;
  private failed = false;
  private lamps: Phaser.GameObjects.Image[] = [];
  private glows: Phaser.GameObjects.Image[] = [];
  constructor(private options: RoomSceneOptions) {
    super("CatRoomScene");
    this.reduced = !!options.reducedMotion;
  }
  preload(): void {
    for (const [key, path] of Object.entries(atlas.textures))
      this.load.image(key, `${this.options.basePath}assets/${path}`);
    for (const key of atlas.cats.textures)
      this.load.spritesheet(
        key,
        `${this.options.basePath}assets/cats/${key}.png`,
        { frameWidth: 32, frameHeight: 32 },
      );
    for (let family = 1; family <= 4; family++)
      for (let layer = 1; layer <= (family === 2 ? 5 : 4); layer++)
        this.load.image(
          `sky-${family}-${layer}`,
          `${this.options.basePath}assets/sky/sky-0${family}-layer-${layer}.png`,
        );
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      this.failed = true;
      this.options.onError?.(
        `Could not load ${file.key}. The text portfolio is still available.`,
      );
    });
  }
  create(): void {
    if (this.failed) return;
    try {
      for (const [name, frame] of Object.entries(atlas.frames)) {
        const [x, y, w, h] = frame.rect;
        this.textures.get(frame.texture).add(name, 0, x, y, w, h);
      }
      for (const texture of atlas.cats.textures)
        for (const [name, clip] of Object.entries(atlas.cats.clips)) {
          const start = clip.row * 11 + ("start" in clip ? clip.start : 0);
          this.anims.create({
            key: `${texture}/${name}`,
            frames: this.anims.generateFrameNumbers(texture, {
              start,
              end: start + clip.count - 1,
            }),
            frameRate: 1000 / clip.duration,
            repeat: -1,
          });
        }
      this.drawRoom();
      const agents = createCatAgents(Date.now());
      Object.values(agents).forEach((agent, index) => {
        const saved = this.options.save?.cats[agent.id];
        if (saved) {
          agent.needs = { ...saved.needs };
          agent.friendship = saved.friendship;
          agent.lastInteractionAt = saved.lastInteractionAt;
        }
        // Migrate friendship/needs, not obsolete coordinates or an in-flight action.
        const point = zoneSlots(agent.currentZone)[0];
        const sprite = this.add
          .sprite(point.x, point.y, agent.spriteVariant)
          .setOrigin(0.5, 0.75)
          .setScale(2)
          .setInteractive({ useHandCursor: true });
        const label = this.add
          .text(point.x, point.y - 30, agent.name, {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#fff2d7",
            backgroundColor: "#30251f",
            padding: { x: 4, y: 2 },
          })
          .setOrigin(0.5, 1)
          .setDepth(1001)
          .setVisible(false);
        const view: View = {
          agent,
          sprite,
          label,
          path: [],
          destination: point,
          pending: "idle",
          until: 6000 + index * 1500,
          history: [],
        };
        sprite.on("pointerdown", () => this.selectCat(agent.id));
        sprite.on("pointerover", () => label.setVisible(true));
        sprite.on("pointerout", () =>
          label.setVisible(this.selectedId === agent.id),
        );
        this.views.set(agent.id, view);
        this.animate(view, "idle");
        sprite.setDepth(point.y);
      });
      this.applySky();
      this.options.onReady?.();
      this.options.onStatus?.(
        "Make yourself at home. Choose a cat or explore the room.",
      );
    } catch (error) {
      this.options.onError?.(
        `Room could not start: ${error instanceof Error ? error.message : "renderer error"}`,
      );
    }
  }
  update(_time: number, delta: number): void {
    if (this.failed) return;
    const seconds = Math.min(delta / 1000, 60);
    this.elapsed += seconds * 1000;
    for (const view of this.views.values()) {
      view.agent.needs = advanceActionNeeds(
        view.agent.needs,
        seconds,
        view.agent.currentState,
      );
      if (view.path.length) {
        if(!view.surface && !view.transitDepth){
          const others=[...this.views.values()].filter(v=>v!==view&&!v.surface).map(v=>({x:v.sprite.x,y:v.sprite.y}));
          const next=view.path[0];
          if(others.some(p=>Math.hypot(next.x-p.x,next.y-p.y)<20)){
            if(this.elapsed>=(view.rerouteAt??0)){
              const detour=findPath({x:view.sprite.x,y:view.sprite.y},view.destination,others);
              if(detour.length)view.path=detour;
              view.rerouteAt=this.elapsed+750;
            }
            continue;
          }
        }
        const target = view.path[0],
          dx = target.x - view.sprite.x,
          dy = target.y - view.sprite.y,
          distance = Math.hypot(dx, dy),
          step = seconds * (this.reduced ? 17 : 30);
        this.animate(
          view,
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0
              ? "walk-right"
              : "walk-left"
            : dy > 0
              ? "walk-down"
              : "walk-up",
        );
        if (distance <= step) {
          view.sprite.setPosition(target.x, target.y);
          view.path.shift();
          if(view.transitDepth)delete view.transitDepth;
          if (!view.path.length) this.arrive(view);
        } else
          view.sprite.setPosition(
            view.sprite.x + (dx / distance) * step,
            view.sprite.y + (dy / distance) * step,
          );
      } else if (this.elapsed >= view.until) {
        const action = chooseAction(
          scoreActions(view.agent, {
            hour: this.options.getHour?.() ?? hourNow(),
            now: Date.now(),
            elapsedInState: Date.now() - view.agent.lastStateAt,
            occupiedZones: new Set(
              [...this.views.values()].map((v) => v.agent.currentZone),
            ),
            recentActions: view.history,
            randomJitter: Math.random(),
          }),
        );
        this.requestAction(view, action);
      }
      view.sprite.setDepth(
        view.transitDepth ?? (view.surface ? view.surface.y + 50 : view.sprite.y + 1),
      );
      view.label.setPosition(view.sprite.x, view.sprite.y - 28);
    }
    if (this.elapsed - this.savedAt > 1000) {
      this.savedAt = this.elapsed;
      this.applySky();
      if (this.selectedId)
        this.options.onCatSelected?.(this.views.get(this.selectedId)!.agent);
      this.options.onSnapshot?.(this.getAgents());
    }
  }
  selectCat(id: string): void {
    const view = this.views.get(id);
    if (!view) return;
    this.selectedId = id;
    for (const v of this.views.values()) v.label.setVisible(v === view);
    this.options.onCatSelected?.(view.agent);
  }
  setReducedMotion(value: boolean): void {
    this.reduced = value;
    for (const v of this.views.values())
      v.sprite.anims.timeScale = value ? 0.6 : 1;
  }
  handleInteraction(action: CatInteraction): boolean {
    const view = this.selectedId ? this.views.get(this.selectedId) : undefined;
    if (!view) return false;
    const now = Date.now();
    if (now - view.agent.lastInteractionAt < 2500) {
      this.options.onStatus?.(`${view.agent.name} needs a moment.`);
      return false;
    }
    if (
      !this.requestAction(
        view,
        action === "feed"
          ? "eat"
          : action === "play"
            ? "play"
            : action === "call"
              ? "meow"
              : "react",
        action === "call" ? "play" : undefined,
      )
    )
      return false;
    view.agent.lastInteractionAt = now;
    view.agent.friendship = Math.min(1, view.agent.friendship + 0.025);
    if (action === "pet") {
      view.agent.needs.social = Math.min(1, view.agent.needs.social + 0.1);
      view.agent.needs.comfort = Math.min(1, view.agent.needs.comfort + 0.08);
      view.label.setText(`${view.agent.name} ♥`);
      this.time.delayedCall(1600, () => view.label.setText(view.agent.name));
    }
    this.options.onInteraction?.(view.agent, action);
    return true;
  }
  getAgents(): Record<string, CatAgent> {
    return Object.fromEntries([...this.views].map(([id, v]) => [id, v.agent]));
  }
  private animate(view: View, clip: string): void {
    view.sprite.play(`${view.agent.spriteVariant}/${clip}`, true);
    view.sprite.anims.timeScale = this.reduced ? 0.6 : 1;
  }
  private requestAction(
    view: View,
    action: CatAction,
    explicitZone?: ZoneId,
  ): boolean {
    const zone =
      explicitZone ??
      (action === "eat"
        ? "food"
        : action === "play"
          ? "play"
          : action === "sleep"
            ? "sofa"
            : action === "observe"
              ? Math.random() < 0.5
                ? "window"
                : "balcony"
              : action === "walk"
                ? (Object.keys(room.zones) as ZoneId[])[
                    Math.floor(Math.random() * 9)
                  ]
                : undefined);
    if (zone) {
      const occupied = [...this.views.values()]
        .filter((v) => v !== view)
        .map((v) => v.destination);
      const start = view.surface
        ? view.destination
        : { x: view.sprite.x, y: view.sprite.y };
      const route = reserveDestination(zone, start, occupied);
      if (!route) {
        view.until = this.elapsed + 3000;
        this.options.onStatus?.(
          `${view.agent.name} is waiting for a free spot.`,
        );
        return false;
      }
      const descent = view.surface ? [view.destination] : [];
      view.transitDepth = view.surface ? view.surface.y + 50 : undefined;
      view.surface = undefined;
      view.path = [...descent, ...route.path];
      view.destination = route.point;
      view.pending = action === "walk" ? "sit" : action;
      view.agent.targetZone = zone;
      view.agent.currentState = "walk";
      if (!view.path.length) this.arrive(view);
    } else {
      if (view.surface && view.path.length) {
        view.pending = action;
        return true;
      }
      view.path = [];
      if (!view.surface)
        view.destination = { x: view.sprite.x, y: view.sprite.y };
      delete view.agent.targetZone;
      this.beginAction(view, action);
    }
    return true;
  }
  private arrive(view: View): void {
    if (view.agent.targetZone) {
      view.agent.currentZone = view.agent.targetZone;
      delete view.agent.targetZone;
      const furniture = room.objects.find(item=>item.zone===view.agent.currentZone);
      const seat = furniture?.perches?.find(slot=>slot.approach[0]===view.destination.x&&slot.approach[1]===view.destination.y);
      const perch = seat ? {x:seat.seat[0],y:seat.seat[1]} : undefined;
      if (
        perch &&
        (view.pending === "sleep" || view.pending === "observe")
      ) {
        view.surface = perch;
        view.path = [perch];
        return;
      }
    }
    this.beginAction(view, view.pending);
  }
  private beginAction(view: View, action: CatAction): void {
    view.agent.currentState = action;
    view.agent.lastStateAt = Date.now();
    view.history = [...view.history.slice(-3), action];
    view.agent.actionCooldowns[action] = Date.now() + 5000;
    view.until = this.elapsed + (DURATIONS[action] ?? 6500);
    this.animate(view, action === "walk" ? "walk-down" : action);
  }
  private image(
    frame: string,
    x: number,
    y: number,
    depth: number,
  ): Phaser.GameObjects.Image {
    const data = atlas.frames[frame as keyof typeof atlas.frames];
    return this.add
      .image(x, y, data.texture, frame)
      .setOrigin(0)
      .setScale(2)
      .setDepth(depth);
  }
  private drawRoom(): void {
    this.cameras.main.setBackgroundColor("#382a26");
    for (const tile of room.tiles)
      for (let y = 0; y < tile.rows; y++)
        for (let x = 0; x < tile.cols; x++)
          this.image(tile.frame, tile.x + x * 32, tile.y + y * 32, tile.depth);
    for (let family = 1; family <= 4; family++) {
      const images: Phaser.GameObjects.Image[] = [];
      const [x, y, w, h] = room.skyRect;
      for (const [wx, wy, ww, wh] of room.skyWindows) {
        for (let layer = 1; layer <= (family === 2 ? 5 : 4); layer++) {
          const key = `sky-${family}-${layer}`;
          const source = this.textures.get(key).get();
          images.push(
            this.add
              .image(x + w / 2, y + h / 2, key)
              .setDisplaySize(w, h)
              .setDepth(1.5 + family * 0.01 + layer * 0.001)
              .setCrop(
                ((wx - x) * source.width) / w,
                ((wy - y) * source.height) / h,
                (ww * source.width) / w,
                (wh * source.height) / h,
              ),
          );
        }
      }
      this.skyLayers.set(family, images);
    }
    for (const [x, y, w, h] of room.beams)
      this.image("beam", x, y, 3).setDisplaySize(w, h);
    for (const item of room.objects) {
      const sprite = this.image(item.frame, item.x, item.y, item.depth);
      if (item.frame === "lamp") this.lamps.push(sprite);
    }
    this.lighting = this.add
      .rectangle(320, 180, 640, 360, 0x17172f, 0)
      .setDepth(950);
    const glow = this.textures.createCanvas("lamp-glow", 128, 128);
    if (glow) {
      const ctx = glow.context,
        gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(255,181,88,.65)");
      gradient.addColorStop(1, "rgba(255,181,88,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      glow.refresh();
      for (const lamp of this.lamps)
        this.glows.push(
          this.add
            .image(lamp.x + 16, lamp.y + 24, "lamp-glow")
            .setDepth(955)
            .setBlendMode(Phaser.BlendModes.ADD),
        );
    }
  }
  private applySky(): void {
    const hour = (((this.options.getHour?.() ?? hourNow()) % 24) + 24) % 24;
    let index = SKY_STOPS.findIndex(
      (s, i) =>
        i < SKY_STOPS.length - 1 &&
        hour >= s.hour &&
        hour < SKY_STOPS[i + 1].hour,
    );
    if (index < 0) index = 0;
    const current = SKY_STOPS[index],
      next = SKY_STOPS[index + 1];
    const blend = Phaser.Math.Clamp((hour - (next.hour - 0.75)) / 0.75, 0, 1);
    for (const [family, images] of this.skyLayers) {
      const alpha =
        current.sky === next.sky
          ? family === current.sky
            ? 1
            : 0
          : family === current.sky
            ? 1 - blend
            : family === next.sky
              ? blend
              : 0;
      for (const image of images) image.setAlpha(alpha);
    }
    const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(current.tint),
      Phaser.Display.Color.ValueToColor(next.tint),
      100,
      blend * 100,
    );
    const color = Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b);
    this.children.list.forEach((object) => {
      if (
        object instanceof Phaser.GameObjects.Image &&
        ![...this.skyLayers.values()].some((group) => group.includes(object))
      )
        object.setTint(color);
    });
    this.lighting?.setAlpha(
      current.light + (next.light - current.light) * blend,
    );
    for (const glow of this.glows)
      glow.setAlpha(
        (current.light + (next.light - current.light) * blend) * 1.2,
      );
    for (const lamp of this.lamps) lamp.setTint(0xffe7ac).setDepth(960);
    this.options.onTime?.(hour, getTimeBlock(hour));
  }
}
