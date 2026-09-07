import { loadBrowserSave, saveState } from "../game/persistence";
import { mountCatRoom } from "../game/cat-room";
import { saveStateFromAgents } from "../game/room-scene";
import type { CatAgent, TimeBlock } from "../game/types";

const BLOCK_LABELS: Record<TimeBlock, string> = {
  morning: "morning",
  "active-morning": "active morning",
  midday: "midday",
  afternoon: "afternoon",
  sunset: "sunset",
  evening: "evening",
  night: "night"
};

function localHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

function formatTime(hour: number): string {
  const date = new Date();
  date.setHours(Math.floor(hour), Math.floor((hour % 1) * 60), 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
}

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function setupPortfolioUI(): void {
  const roomRoot = document.querySelector<HTMLElement>("[data-cat-room-root]");
  if (!roomRoot || roomRoot.dataset.uiReady === "true") return;
  roomRoot.dataset.uiReady = "true";

  const storage = browserStorage();
  let save = loadBrowserSave(Date.now(), storage);
  let selectedCat: CatAgent | undefined;
  let lastDialogTrigger: HTMLElement | undefined;
  let room: ReturnType<typeof mountCatRoom>;

  const setText = (selector: string, value: string): void => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => { element.textContent = value; });
  };

  const setStatus = (message: string): void => setText("[data-interaction-status], [data-room-status]", message);

  const updateTime = (hour = localHour(), block?: TimeBlock): void => {
    const formatted = formatTime(hour);
    setText("[data-time-label]", `local time / ${formatted}`);
    setText("[data-room-time]", `${formatted} / ${block ? BLOCK_LABELS[block] : "live"}`);
    setText("[data-weather-label]", `sky / ${block ? BLOCK_LABELS[block] : "reading local time"}`);
  };

  const updateSelected = (cat?: CatAgent): void => {
    selectedCat = cat;
    setText("[data-selected-cat]", cat ? `${cat.name} / ${cat.currentState} / ${cat.currentZone}` : "Select a cat in the room");
    document.querySelectorAll<HTMLButtonElement>("[data-cat-action]").forEach((button) => { button.disabled = !cat; });
  };

  const reducedMotion = save.preferences.reducedMotion ?? window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
  const motionToggle = document.querySelector<HTMLButtonElement>("[data-motion-toggle]");
  const setReducedMotion = (value: boolean): void => {
    document.documentElement.dataset.motion = value ? "reduced" : "full";
    if (motionToggle) {
      motionToggle.textContent = value ? "motion off" : "motion on";
      motionToggle.setAttribute("aria-pressed", String(value));
    }
    save.preferences.reducedMotion = value;
    saveState(save, storage);
    room?.setReducedMotion(value);
  };
  motionToggle?.addEventListener("click", () => setReducedMotion(document.documentElement.dataset.motion !== "reduced"));
  setReducedMotion(reducedMotion);

  const openPanel = (id: string, trigger?: HTMLElement): void => {
    const panel = document.getElementById(`panel-${id}`) as HTMLDialogElement | null;
    if (!panel) return;
    lastDialogTrigger = trigger;
    if (typeof panel.showModal === "function") panel.showModal();
    else panel.setAttribute("open", "true");
  };
  const closePanel = (button?: HTMLElement): void => {
    const panel = button?.closest("dialog") as HTMLDialogElement | null;
    if (panel?.open) panel.close();
    else panel?.removeAttribute("open");
    lastDialogTrigger?.focus();
    lastDialogTrigger = undefined;
  };
  document.querySelectorAll<HTMLElement>("[data-panel-open], [data-hotspot]").forEach((element) => {
    element.addEventListener("click", () => openPanel(element.dataset.panelOpen ?? element.dataset.hotspot ?? "", element));
  });
  document.querySelectorAll<HTMLElement>("[data-panel-close]").forEach((button) => button.addEventListener("click", () => closePanel(button)));
  document.querySelectorAll<HTMLDialogElement>("[data-info-panel]").forEach((panel) => {
    panel.addEventListener("click", (event) => { if (event.target === panel) closePanel(panel.querySelector("[data-panel-close]") ?? undefined); });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-cat-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.catAction as "pet" | "feed" | "play" | "call";
      if (!room?.interact(action) || !selectedCat) return;
      const savedCat = save.cats[selectedCat.id];
      if (!savedCat) return;
      if (action === "pet") savedCat.timesPetted += 1;
      if (action === "feed") savedCat.timesFed += 1;
      if (action === "play") savedCat.timesPlayed += 1;
      save = saveStateFromAgents(save, room.snapshot(), Date.now());
      saveState(save, storage);
    });
  });

  const debugHour = import.meta.env.DEV ? Number(new URLSearchParams(window.location.search).get("hour")) : NaN;
  const getHour = (): number => Number.isFinite(debugHour) ? debugHour : localHour();
  room = mountCatRoom(roomRoot, {
    basePath: roomRoot.closest<HTMLElement>("[data-base-path]")?.dataset.basePath ?? "/portfolio/",
    save,
    reducedMotion,
    getHour,
    onReady: () => setStatus("Room online. Select a cat to open its controls."),
    onTime: (hour, block) => {
      updateTime(hour, block);
      setText("[data-room-cats]", `${Object.keys(save.cats).length} cats / ${BLOCK_LABELS[block]}`);
    },
    onCatSelected: updateSelected,
    onInteraction: (cat, action) => setStatus(`${cat.name} responded to ${action}. Friendship: ${Math.round(cat.friendship * 100)}%.`),
    onSnapshot: (cats) => {
      save = saveStateFromAgents(save, cats, Date.now());
      saveState(save, storage);
    },
    onStatus: setStatus
  });
  updateTime(getHour());

  const visibility = (): void => {
    if (document.hidden) room?.pause();
    else room?.resume();
  };
  document.addEventListener("visibilitychange", visibility);
  const clock = window.setInterval(() => updateTime(getHour()), 15_000);
  window.addEventListener("pagehide", () => {
    window.clearInterval(clock);
    if (room) saveState(saveStateFromAgents(save, room.snapshot(), Date.now()), storage);
    room?.destroy();
    document.removeEventListener("visibilitychange", visibility);
  }, { once: true });
}
