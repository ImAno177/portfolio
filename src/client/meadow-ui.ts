import { certificates, type CertificateId } from "../data/portfolio";
import type { GalleryHandle, TimeOfDay } from "../game/meadow-scene";

export function setupGalleryPortfolio(): void {
  const app = document.querySelector<HTMLElement>("[data-gallery-app]");
  const root = document.querySelector<HTMLElement>("[data-gallery-root]");
  if (!app || !root || root.dataset.uiReady) return;
  root.dataset.uiReady = "true";
  app.dataset.enhanced = "true";
  const stage = document.querySelector<HTMLElement>("[data-gallery-stage]")!;
  const content = document.querySelector<HTMLElement>("[data-gallery-content]")!;
  const dialog = document.querySelector<HTMLDialogElement>("[data-gallery-dialog]")!;
  const panel = document.querySelector<HTMLElement>("[data-panel-body]")!;
  const closeButton = document.querySelector<HTMLButtonElement>("[data-panel-close]")!;
  const collectionLink = document.querySelector<HTMLAnchorElement>("[data-collection-link]")!;
  const pagination = document.querySelector<HTMLElement>("[data-certificate-pagination]")!;
  const status = document.querySelector<HTMLElement>("[data-gallery-status]")!;
  const retry = document.querySelector<HTMLButtonElement>("[data-gallery-retry]")!;
  const controls = document.querySelector<HTMLElement>("[data-gallery-controls]")!;
  const timeButton = document.querySelector<HTMLButtonElement>("[data-time-toggle]")!;
  const motionButton = document.querySelector<HTMLButtonElement>("[data-motion-toggle]")!;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController();
  const { signal } = events;
  const frames = new Map([...document.querySelectorAll<HTMLAnchorElement>("[data-frame-link]")].map(link => [link.dataset.frameLink as CertificateId, link]));
  let scene: GalleryHandle | undefined;
  let active: HTMLElement | undefined;
  let marker: Text | undefined;
  let trigger: HTMLElement | undefined;
  let selected: CertificateId | null = null;
  let animate = !motion.matches;
  let time: TimeOfDay = "day";
  let inView = true;
  let disposed = false;
  let generation = 0;
  let timeout: number | undefined;

  const syncPause = () => scene?.setPaused(document.hidden || !inView || dialog.open || stage.dataset.sceneState === "error");
  function syncMotion() {
    document.documentElement.dataset.motion = animate ? "full" : "reduced";
    motionButton.setAttribute("aria-pressed", String(!animate));
    motionButton.querySelector("[data-motion-label]")!.textContent = animate ? "Pause" : "Still";
    scene?.setReducedMotion(!animate);
  }
  function restore() {
    if (active && marker) marker.replaceWith(active);
    active = undefined;
    marker = undefined;
  }
  function close(updateHash = true) {
    if (dialog.open) dialog.close();
    restore();
    selected = null;
    scene?.focusFrame(null);
    if (updateHash) history.pushState(null, "", "#room");
    pagination.hidden = true;
    syncPause();
    if (trigger?.isConnected && trigger.getClientRects().length) trigger.focus({ preventScroll: true });
    else collectionLink.focus({ preventScroll: true });
    trigger = undefined;
  }
  function route() {
    const id = location.hash.slice(1);
    const certificate = certificates.find(item => item.id === id);
    if (!certificate && !["collection", "about", "contact"].includes(id)) {
      if (dialog.open) close(false);
      return;
    }
    restore();
    const section = document.getElementById(id);
    if (!section) return;
    selected = certificate?.id ?? null;
    scene?.focusFrame(selected);
    active = section;
    marker = document.createTextNode("");
    section.before(marker);
    panel.append(section);
    const heading = section.querySelector<HTMLElement>("h2,h3")!;
    dialog.setAttribute("aria-labelledby", heading.id);
    dialog.dataset.kind = certificate ? "certificate" : "panel";
    pagination.hidden = !certificate;
    if (certificate) document.querySelector("[data-certificate-position]")!.textContent = `${certificates.indexOf(certificate) + 1} of ${certificates.length}`;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    closeButton.focus({ preventScroll: true });
    syncPause();
  }
  document.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    trigger = link;
    if (link.hash === location.hash) { event.preventDefault(); route(); }
  }, { signal });
  window.addEventListener("hashchange", route, { signal });
  closeButton.addEventListener("click", () => close(), { signal });
  dialog.addEventListener("cancel", event => { event.preventDefault(); close(); }, { signal });
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  }, { signal });
  function next(direction: number) {
    const index = certificates.findIndex(item => item.id === selected);
    if (index < 0) return;
    location.hash = certificates[(index + direction + certificates.length) % certificates.length]!.id;
  }
  document.querySelector("[data-previous-certificate]")!.addEventListener("click", () => next(-1), { signal });
  document.querySelector("[data-next-certificate]")!.addEventListener("click", () => next(1), { signal });
  dialog.addEventListener("keydown", event => {
    if (selected && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); next(event.key === "ArrowLeft" ? -1 : 1); }
  }, { signal });
  content.hidden = true;
  route();

  function fail(message: string) {
    if (disposed) return;
    clearTimeout(timeout);
    stage.dataset.sceneState = "error";
    root!.setAttribute("aria-busy", "false");
    status.textContent = message;
    controls.hidden = true;
    retry.hidden = false;
    syncPause();
  }
  async function start() {
    const current = ++generation;
    scene?.destroy();
    scene = undefined;
    root!.replaceChildren();
    root!.setAttribute("aria-busy", "true");
    stage.dataset.sceneState = "loading";
    status.textContent = "Opening the windows, hanging the frames…";
    retry.hidden = true;
    controls.hidden = true;
    clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      if (current !== generation || disposed) return;
      generation++;
      scene?.destroy();
      scene = undefined;
      fail("The 3D room took too long to load. Choose a certificate in the illustrated room, or try again.");
    }, 20000);
    try {
      const { mountGalleryRoom } = await import("../game/meadow-scene");
      if (disposed || current !== generation) return;
      scene = mountGalleryRoom(root!, {
        basePath: app!.dataset.basePath!,
        reducedMotion: !animate,
        onReady: () => {
          if (disposed || current !== generation) return;
          clearTimeout(timeout);
          stage.dataset.sceneState = "ready";
          root!.setAttribute("aria-busy", "false");
          controls.hidden = false;
          retry.hidden = true;
          document.querySelector("[data-room-hint]")!.textContent = "Drag gently to look around. Select a frame to take a closer look.";
          if (selected) scene?.focusFrame(selected);
          syncPause();
        },
        onSelect: id => {
          trigger = document.querySelector<HTMLElement>(`[data-select-frame="${id}"]`) ?? collectionLink;
          if (location.hash === `#${id}`) route();
          else location.hash = id;
        },
        onHotspots: spots => {
          for (const spot of spots) {
            const link = frames.get(spot.id);
            if (!link) continue;
            link.hidden = !spot.visible;
            link.style.left = `${spot.x}%`;
            link.style.top = `${spot.y}%`;
          }
        },
        onError: message => { if (current === generation) fail(message); },
      });
      scene.setTimeOfDay(time);
      syncPause();
    } catch {
      if (disposed || current !== generation) return;
      scene?.destroy();
      scene = undefined;
      root!.replaceChildren();
      fail("The 3D room is unavailable. All three certificates are still here in the illustrated room and collection.");
    }
  }
  retry.addEventListener("click", () => void start(), { signal });
  timeButton.addEventListener("click", () => {
    time = time === "day" ? "evening" : "day";
    app!.dataset.time = time;
    timeButton.setAttribute("aria-pressed", String(time === "evening"));
    timeButton.querySelector("[data-time-label]")!.textContent = time === "day" ? "Afternoon" : "Lamplight";
    scene?.setTimeOfDay(time);
  }, { signal });
  motionButton.addEventListener("click", () => { animate = !animate; syncMotion(); }, { signal });
  motion.addEventListener("change", () => { animate = !motion.matches; syncMotion(); }, { signal });
  document.querySelector("[data-reset-view]")!.addEventListener("click", () => scene?.resetView(), { signal });
  const visibility = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncPause(); });
  visibility.observe(root);
  document.addEventListener("visibilitychange", syncPause, { signal });
  window.addEventListener("pageshow", syncPause, { signal });
  const copy = document.querySelector<HTMLButtonElement>("[data-copy-discord]")!;
  copy.hidden = false;
  copy.addEventListener("click", async () => {
    const feedback = document.querySelector<HTMLElement>("[data-copy-status]")!;
    try { await navigator.clipboard.writeText(copy.dataset.copyDiscord!); feedback.textContent = "Discord username copied."; }
    catch { feedback.textContent = `Copy this username: ${copy.dataset.copyDiscord}`; }
  }, { signal });
  function destroy() {
    disposed = true;
    generation++;
    clearTimeout(timeout);
    visibility.disconnect();
    events.abort();
    scene?.destroy();
    scene = undefined;
    if (dialog.open) dialog.close();
    restore();
    content.hidden = false;
    delete app!.dataset.enhanced;
    delete root!.dataset.uiReady;
  }
  window.addEventListener("pagehide", event => { if (event.persisted) scene?.setPaused(true); else destroy(); }, { signal });
  import.meta.hot?.dispose(destroy);
  syncMotion();
  void start();
}
