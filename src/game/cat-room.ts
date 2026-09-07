import Phaser from "phaser";
import { CatRoomScene } from "./room-scene";
import type { CatInteraction, RoomSceneOptions } from "./room-scene";

export interface CatRoomHandle {
  interact(action: CatInteraction): boolean;
  setReducedMotion(value: boolean): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  snapshot(): ReturnType<CatRoomScene["getAgents"]>;
}

export function mountCatRoom(root: HTMLElement, options: RoomSceneOptions): CatRoomHandle | null {
  let scene: CatRoomScene;
  try {
    scene = new CatRoomScene({
      ...options,
      onReady: () => {
        root.dataset.phaser = "ready";
        root.querySelector("canvas")?.setAttribute("aria-hidden", "true");
        options.onReady?.();
      }
    });
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 960,
      height: 540,
      parent: root,
      backgroundColor: "#17213a",
      pixelArt: true,
      antialias: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 960,
        height: 540
      },
      scene
    });
    root.dataset.phaser = "loading";
    return {
      interact: (action) => scene.handleInteraction(action),
      setReducedMotion: (value) => scene.setReducedMotion(value),
      pause: () => game.scene.pause("CatRoomScene"),
      resume: () => game.scene.resume("CatRoomScene"),
      destroy: () => game.destroy(true),
      snapshot: () => scene.getAgents()
    };
  } catch (error) {
    root.dataset.phaser = "error";
    options.onStatus?.("Room layer unavailable; the HTML portfolio is still online.");
    console.warn("Cat room could not start", error);
    return null;
  }
}
