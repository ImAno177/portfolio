// Run on the local development portfolio, in the browser console:
// await (await import('/portfolio/scripts/browser-checks.mjs')).runRoomChecks()
export async function runRoomChecks() {
  if (
    !window.__catRoom ||
    !["localhost", "127.0.0.1"].includes(location.hostname)
  )
    throw new Error("Development room required");
  const results = [];
  const check = (name, condition) => {
    if (!condition) throw new Error(name);
    results.push(name);
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const query = (selector) => document.querySelector(selector);
  const waitReady = async () => {
    for (let i = 0; i < 100; i++) {
      if (query("[data-cat-room-root]").dataset.phaser === "ready") return;
      await wait(100);
    }
    throw new Error("Room did not become ready");
  };
  await waitReady();
  let { scene, game } = window.__catRoom;
  const cat = scene.views.get("pixel");
  scene.selectCat("pixel");
  cat.agent.lastInteractionAt = 0;
  scene.handleInteraction("pet");
  const friendship = cat.agent.friendship;
  scene.handleInteraction("pet");
  check(
    "cooldown does not repeat friendship",
    cat.agent.friendship === friendship,
  );
  // Put one actor on clear floor; this is a development fixture, never production code.
  cat.surface = undefined;
  cat.path = [];
  cat.sprite.setPosition(312, 328);
  cat.destination = { x: 312, y: 328 };
  for (const v of scene.views.values())
    if (v !== cat) {
      v.destination = { x: 88, y: 216 };
      v.until = Infinity;
    }
  scene.requestAction(cat, "eat");
  check(
    "eat waits for arrival",
    cat.path.length > 0 && cat.agent.currentState === "walk",
  );
  scene.requestAction(cat, "react");
  check(
    "interruption releases the reserved food slot",
    cat.destination.x === cat.sprite.x && cat.destination.y === cat.sprite.y,
  );
  cat.sprite.setPosition(514, 326);
  scene.requestAction(cat, "eat");
  check(
    "same-cell destination is not immediate arrival",
    cat.path.length === 1 && cat.agent.currentState === "walk",
  );
  scene.update(0, 1000);
  check(
    "arrival is exact before eating",
    cat.sprite.x === 520 &&
      cat.sprite.y === 328 &&
      cat.agent.currentState === "eat",
  );
  const hunger = cat.agent.needs.hunger;
  cat.agent.needs.hunger = Math.max(0.5, hunger);
  const hungerBefore = cat.agent.needs.hunger;
  scene.update(0, 1000);
  check(
    "eating decreases hunger at bowl",
    cat.agent.needs.hunger < hungerBefore,
  );
  const pause = query("[data-pause-toggle]");
  if (pause.getAttribute("aria-pressed") !== "true") pause.click();
  const before = JSON.stringify(
    [...scene.views.values()].map((v) => [
      v.sprite.x,
      v.sprite.y,
      v.sprite.frame.name,
      v.agent.needs,
    ]),
  );
  await wait(300);
  check(
    "pause freezes position, animation and needs",
    before ===
      JSON.stringify(
        [...scene.views.values()].map((v) => [
          v.sprite.x,
          v.sprite.y,
          v.sprite.frame.name,
          v.agent.needs,
        ]),
      ),
  );
  pause.click();
  const position = [cat.sprite.x, cat.sprite.y];
  scene.setReducedMotion(true);
  check(
    "reduced motion does not teleport",
    cat.sprite.x === position[0] && cat.sprite.y === position[1],
  );
  const oldGame = game;
  let destroyed = false;
  oldGame.events.once('destroy', () => { destroyed = true; });
  query("canvas").dispatchEvent(
    new Event("webglcontextlost", { cancelable: true }),
  );
  check(
    "renderer failure keeps text and retry",
    !query("[data-portfolio-content]").hidden && !query("[data-retry]").hidden,
  );
  query("[data-retry]").click();
  await waitReady();
  await wait(100);
  check(
    "retry hides fallback text outside text mode",
    query("[data-portfolio-content]").hidden,
  );
  check(
    "retry clears stale selection",
    query("[data-cat-select]").value === "" &&
      query("[data-cat-action]").disabled,
  );
  check("retry destroys the previous renderer", destroyed);
  check(
    "retry leaves one canvas",
    document.querySelectorAll("canvas").length === 1,
  );
  query('nav a[href="#projects"]').click();
  await wait(100);
  check(
    "hash opens a single shared section",
    query("dialog").open && document.querySelectorAll("#projects").length === 1,
  );
  query("dialog").dispatchEvent(new Event("cancel", { cancelable: true }));
  check(
    "Escape restores trigger focus",
    !query("dialog").open &&
      document.activeElement === query('nav a[href="#projects"]'),
  );
  query("[data-text-toggle]").click();
  await wait(100);
  check(
    "text mode restores all sections to flow",
    !query("[data-portfolio-content]").hidden &&
      query("[data-portfolio-content]").querySelectorAll(".content-section")
        .length === 5,
  );
  return results;
}
