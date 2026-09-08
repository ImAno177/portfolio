import { loadBrowserSave, saveState } from "../game/persistence";
import type { CatRoomHandle } from "../game/cat-room";
import type { CatAgent } from "../game/types";
import type { CatInteraction } from "../game/room-scene";

export function setupPortfolioUI(): void {
  const root = document.querySelector<HTMLElement>("[data-cat-room-root]");
  if (!root || root.dataset.uiReady) return;
  root.dataset.uiReady = "true";
  const viewport = document.querySelector<HTMLElement>("[data-room-viewport]")!;
  const content = document.querySelector<HTMLElement>(
    "[data-portfolio-content]",
  )!;
  const dialog = document.querySelector<HTMLDialogElement>(
    "[data-content-dialog]",
  )!;
  const panelBody = document.querySelector<HTMLElement>("[data-panel-body]")!;
  const picker =
    document.querySelector<HTMLSelectElement>("[data-cat-select]")!;
  const pauseButton = document.querySelector<HTMLButtonElement>(
    "[data-pause-toggle]",
  )!;
  const motionButton = document.querySelector<HTMLButtonElement>(
    "[data-motion-toggle]",
  )!;
  const retry = document.querySelector<HTMLButtonElement>("[data-retry]")!;
  let storage: Storage | undefined;
  try {
    storage = window.localStorage;
  } catch {
    /* Browser privacy settings. */
  }
  let save = loadBrowserSave(Date.now(), storage),
    room: CatRoomHandle | undefined,
    paused = false,
    unavailable = false,
    selected: CatAgent | undefined;
  let active: HTMLElement | undefined,
    placeholder: Comment | undefined,
    trigger: HTMLElement | undefined;
  let reduced =
    save.preferences.reducedMotion ??
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timeout: number | undefined,
    generation = 0;
  const text = (selector: string, value: string) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  };
  const status = (message: string) => text("[data-room-status]", message);
  const snapshot = () => {
    if (room)
      for (const [id, agent] of Object.entries(room.snapshot()))
        if (save.cats[id])
          Object.assign(save.cats[id], {
            needs: { ...agent.needs },
            currentState: agent.currentState,
            currentZone: agent.currentZone,
            friendship: agent.friendship,
            lastStateAt: agent.lastStateAt,
            lastInteractionAt: agent.lastInteractionAt,
          });
    save.lastVisitAt = Date.now();
    saveState(save, storage);
  };
  function restoreSection() {
    if (active && placeholder) {
      placeholder.replaceWith(active);
      active = undefined;
      placeholder = undefined;
    }
  }
  function closePanel(updateHash = true) {
    if (dialog.open) dialog.close();
    restoreSection();
    if (updateHash) history.pushState(null, "", "#home");
    const triggerMenu=trigger?.closest('details');if(triggerMenu)triggerMenu.open=true;
    trigger?.focus();
    trigger = undefined;
  }
  function route() {
    const id = location.hash.slice(1),
      section = document.getElementById(id);
    if (id === "text") {
      closePanel(false);
      content.hidden = false;
      content.scrollIntoView();
      return;
    }
    if (!section?.classList.contains("content-section")) {
      closePanel(false);
      return;
    }
    restoreSection();
    content.hidden = true;
    trigger ??=
      document.querySelector<HTMLElement>(`nav a[href="#${id}"]`) ?? undefined;
    active = section;
    placeholder = document.createComment("portfolio section");
    section.before(placeholder);
    panelBody.append(section);
    dialog.setAttribute(
      "aria-label",
      section.querySelector("h1,h2")?.textContent ?? "Portfolio",
    );
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLButtonElement>("[data-panel-close]")?.focus();
  }
  document.addEventListener("click", (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      'a[href^="#"]',
    );
    if (!link) return;
    trigger = link;
    if (link.hash === location.hash) {
      event.preventDefault();
      route();
    }
  });
  window.addEventListener("hashchange", route);
  document
    .querySelector("[data-panel-close]")
    ?.addEventListener("click", () => closePanel());
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closePanel();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        closePanel();
    }
  });
  content.hidden = true;
  route();
  document
    .querySelector<HTMLButtonElement>("[data-copy-discord]")
    ?.addEventListener("click", async (event) => {
      const value = (event.currentTarget as HTMLElement).dataset.copyDiscord!;
      try {
        await navigator.clipboard.writeText(value);
        text("[data-copy-status]", "Username copied.");
      } catch {
        text("[data-copy-status]", `Copy manually: ${value}`);
      }
    });
  function selectedCat(cat: CatAgent) {
    const controls=document.querySelector<HTMLDetailsElement>('.cat-controls');
    if(selected?.id!==cat.id && controls)controls.open=true;
    selected = cat;
    picker.value = cat.id;
    text(
      "[data-selected-cat]",
      `${cat.name} · ${cat.currentState} · friendship ${Math.round(cat.friendship * 100)}%`,
    );
    document
      .querySelectorAll<HTMLButtonElement>("[data-cat-action]")
      .forEach((button) => (button.disabled = paused || unavailable));
  }
  picker.addEventListener("change", () => {
    if (picker.value) room?.select(picker.value);
    else {
      selected = undefined;
      document
        .querySelectorAll<HTMLButtonElement>("[data-cat-action]")
        .forEach((b) => (b.disabled = true));
    }
  });
  document
    .querySelectorAll<HTMLButtonElement>("[data-cat-action]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        if (paused || !selected) return;
        room?.interact(button.dataset.catAction as CatInteraction);
      }),
    );
  function syncPause() {
    if (paused || unavailable || document.hidden) room?.pause();
    else room?.resume();
    pauseButton.textContent = paused ? "Resume room" : "Pause room";
    pauseButton.setAttribute("aria-pressed", String(paused));
    if (selected) selectedCat(selected);
  }
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    snapshot();
    syncPause();
  });
  function syncMotion() {
    motionButton.setAttribute("aria-pressed", String(reduced));
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
    room?.setReducedMotion(reduced);
  }
  motionButton.addEventListener("click", () => {
    reduced = !reduced;
    save.preferences.reducedMotion = reduced;
    saveState(save, storage);
    syncMotion();
  });
  syncMotion();
  document
    .querySelector<HTMLButtonElement>("[data-hotspot-toggle]")
    ?.addEventListener("click", (event) => {
      const value = viewport.classList.toggle("show-places");
      (event.currentTarget as HTMLElement).setAttribute(
        "aria-pressed",
        String(value),
      );
    });
  const fullscreen =
    document.querySelector<HTMLButtonElement>("[data-fullscreen]")!;
  if (document.fullscreenEnabled) {
    fullscreen.hidden = false;
    fullscreen.addEventListener("click", () => {
      const stage = viewport.closest<HTMLElement>(".room-stage")!;
      void (
        document.fullscreenElement
          ? document.exitFullscreen()
          : stage.requestFullscreen()
      ).catch(() => status("Fullscreen is unavailable in this browser."));
    });
  }
  function alignHotspots() {
    const canvas = root!.querySelector("canvas"),
      bounds = viewport.getBoundingClientRect(),
      rect = canvas?.getBoundingClientRect();
    const width =
        rect?.width ?? Math.min(bounds.width, (bounds.height * 16) / 9),
      height = rect?.height ?? (width * 9) / 16;
    const left =
        (rect ? rect.left - bounds.left : (bounds.width - width) / 2) -
        viewport.clientLeft,
      top =
        (rect ? rect.top - bounds.top : (bounds.height - height) / 2) -
        viewport.clientTop;
    document.querySelectorAll<HTMLElement>("[data-world-x]").forEach((spot) => {
      spot.style.left = `${left + (Number(spot.dataset.worldX) / 640) * width}px`;
      spot.style.top = `${top + (Number(spot.dataset.worldY) / 360) * height}px`;
    });
  }
  new ResizeObserver(() => requestAnimationFrame(alignHotspots)).observe(
    viewport,
  );
  const hourParam = import.meta.env.DEV
    ? new URLSearchParams(location.search).get("hour")
    : null;
  const debugHour =
    hourParam !== null && hourParam.trim() !== "" ? Number(hourParam) : NaN;
  const getHour = () => {
    const d = new Date();
    return Number.isFinite(debugHour) && debugHour >= 0 && debugHour < 24
      ? debugHour
      : d.getHours() + d.getMinutes() / 60;
  };
  function fail(message: string) {
    const settings=document.querySelector<HTMLDetailsElement>('.settings-menu');if(settings)settings.open=true;
    unavailable = true;
    window.clearTimeout(timeout);
    viewport.dataset.ready = "false";
    root!.dataset.phaser = "error";
    room?.pause();
    document
      .querySelectorAll<HTMLButtonElement>("[data-cat-action]")
      .forEach((button) => (button.disabled = true));
    retry.hidden = false;
    content.hidden = false;
    status(message);
  }
  async function start() {
    const current = ++generation;
    snapshot();
    selected = undefined;
    picker.value = "";
    text("[data-selected-cat]", "Six small lives. Their own pace.");
    document
      .querySelectorAll<HTMLButtonElement>("[data-cat-action]")
      .forEach((button) => (button.disabled = true));
    room?.destroy();
    room = undefined;
    root!.querySelectorAll("canvas").forEach((c) => c.remove());
    viewport.dataset.ready = "false";
    retry.hidden = true;
    status("The room is waking up…");
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      if (current === generation)
        fail("The room took too long to load. Retry or browse the text below.");
    }, 20000);
    try {
      const { mountCatRoom } = await import("../game/cat-room");
      if (current !== generation) return;
      room =
        mountCatRoom(root!, {
          basePath:
            root!.closest<HTMLElement>("[data-base-path]")!.dataset.basePath!,
          save,
          reducedMotion: reduced,
          getHour,
          onReady: () => {
            if (current !== generation) return;
            window.clearTimeout(timeout);
            viewport.dataset.ready = "true";
            unavailable = false;
            content.hidden = location.hash !== "#text";
            retry.hidden = true;
            requestAnimationFrame(alignHotspots);
            syncPause();
          },
          onError: (message) => {
            if (current === generation) fail(message);
          },
          onStatus: status,
          onCatSelected: selectedCat,
          onTime: (hour, block) =>
            text(
              "[data-room-time]",
              `${String(Math.floor(hour)).padStart(2, "0")}:${String(Math.floor((hour % 1) * 60)).padStart(2, "0")} / ${block.replace("-", " ")}`,
            ),
          onInteraction: (cat, action) => {
            const saved = save.cats[cat.id];
            if (action === "pet") saved.timesPetted++;
            if (action === "feed") saved.timesFed++;
            if (action === "play") saved.timesPlayed++;
            text(
              "[data-interaction-status]",
              `${cat.name}: ${action === "feed" ? "heading to the bowl" : action === "call" ? "coming over" : action === "play" ? "off to the toy" : "a happy little stretch"}.`,
            );
            snapshot();
          },
          onSnapshot: () => snapshot(),
        }) ?? undefined;
    } catch {
      fail(
        "The room could not load. Your portfolio content is available below.",
      );
    }
  }
  retry.addEventListener("click", () => void start());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) snapshot();
    syncPause();
  });
  window.addEventListener("pagehide", () => {
    snapshot();
    room?.pause();
  });
  window.addEventListener("pageshow", syncPause);
  void start();
}
