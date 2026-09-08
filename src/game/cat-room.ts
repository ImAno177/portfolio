import Phaser from "phaser";
import { CatRoomScene } from "./room-scene";
import type { CatInteraction, RoomSceneOptions } from "./room-scene";

export interface CatRoomHandle {
  select(id: string): void;
  interact(action: CatInteraction): boolean;
  setReducedMotion(value: boolean): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  snapshot(): ReturnType<CatRoomScene["getAgents"]>;
}

export function mountCatRoom(
  root: HTMLElement,
  options: RoomSceneOptions,
): CatRoomHandle | null {
  let scene: CatRoomScene;
  try {
    scene = new CatRoomScene({
      ...options,
      onReady: () => {
        root.dataset.phaser = "ready";
        root.querySelector("canvas")?.setAttribute("aria-hidden", "true");
        options.onReady?.();
      },
    });
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 640,
      height: 360,
      parent: root,
      backgroundColor: "#17213a",
      pixelArt: true,
      antialias: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 640,
        height: 360,
      },
      scene,
    });
    root.dataset.phaser = "loading";
    if (import.meta.env.DEV)
      Object.assign(window, { __catRoom: { game, scene } });
    game.events.once("ready", () => {
      game.canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        options.onError?.(
          "Graphics context lost. Retry the room or use the text portfolio.",
        );
      });
    });
    return {
      select: (id) => scene.selectCat(id),
      interact: (action) => scene.handleInteraction(action),
      setReducedMotion: (value) => scene.setReducedMotion(value),
      pause: () => {
        game.scene.pause("CatRoomScene");
        game.loop.sleep();
      },
      resume: () => {
        game.scene.resume("CatRoomScene");
        game.loop.wake();
      },
      destroy: () => {
        game.destroy(true);
        game.loop.wake();
      },
      snapshot: () => scene.getAgents(),
    };
  } catch (error) {
    root.dataset.phaser = "error";
    options.onStatus?.(
      "Room layer unavailable; the HTML portfolio is still online.",
    );
    console.warn("Cat room could not start", error);
    options.onError?.(
      "The room could not start. Retry or use the text portfolio.",
    );
    return null;
  }
}
