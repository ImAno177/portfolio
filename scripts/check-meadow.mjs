import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { profile, projects, certificates } from "../src/data/portfolio.ts";

const base = new URL(process.argv[2] ?? "http://127.0.0.1:4321/portfolio/");
const executable = process.env.BROWSER_EXECUTABLE ?? [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/chromium", "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find(path => existsSync(path));
assert(executable, "Set BROWSER_EXECUTABLE to an installed Chrome/Chromium/Edge binary.");
const output = mkdtempSync(join(tmpdir(), "portfolio-gallery-"));
const reservation = createServer();
await new Promise(resolve => reservation.listen(0, "127.0.0.1", resolve));
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
const browser = spawn(executable, [
  "--headless=new", `--remote-debugging-port=${port}`, "--remote-debugging-address=127.0.0.1",
  `--user-data-dir=${join(output, "profile")}`, "--no-first-run", "--no-default-browser-check",
  "--disable-extensions", "--enable-unsafe-swiftshader", "about:blank",
], { stdio: "ignore" });
let launchError;
browser.on("error", error => { launchError = error; });
let socket;
let send;
const waiting = new Map();
const exceptions = [];
const failedRequests = [];
const watchdog = setTimeout(() => {
  browser.kill();
  console.error("Browser checks timed out.");
  process.exit(1);
}, 150_000);

try {
  let target;
  for (let attempt = 0; attempt < 100 && !target; attempt++) {
    if (launchError) throw launchError;
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
      target = pages.find(page => page.type === "page");
    } catch {}
    if (!target) await delay(100);
  }
  assert(target, "Browser did not expose a debugging page.");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let sequence = 0;
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = waiting.get(message.id);
      if (!request) return;
      waiting.delete(message.id);
      clearTimeout(request.timeout);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown")
      exceptions.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    if (message.method === "Network.responseReceived" && message.params.response.status >= 400)
      failedRequests.push(`${message.params.response.status} ${message.params.response.url}`);
  });
  send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { waiting.delete(id); reject(new Error(`Timed out: ${method}`)); }, 20000);
    waiting.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    assert(!result.exceptionDetails, result.exceptionDetails?.exception?.description ?? expression);
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let i = 0; i < 200; i++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    assert.fail(`Not ready: ${expression}`);
  };
  const click = async selector => {
    const point = await evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      el.scrollIntoView({block:'center', behavior:'instant'});
      const r = el.getBoundingClientRect();
      return {x:r.x+r.width/2,y:r.y+r.height/2};
    })()`);
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  };
  const screenshot = async name => {
    const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    const path = join(output, `${name}.png`);
    writeFileSync(path, Buffer.from(data, "base64"));
    console.log(`Screenshot: ${path}`);
  };
  const ready = "document.querySelector('[data-gallery-stage]')?.dataset.sceneState === 'ready'";
  const opened = id => `document.querySelector('[data-gallery-dialog]')?.open && document.querySelector('[data-panel-body] > [id]')?.id === '${id}'`;
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    window.__galleryFrames = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => raf(time => { window.__galleryFrames++; callback(time); });
  ` });
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.navigate", { url: base.href });
  await waitFor(ready);
  await delay(500);
  assert.equal(await evaluate("document.querySelectorAll('[data-gallery-root] canvas').length"), 1);
  assert.equal(await evaluate("document.querySelectorAll('[data-certificate]').length"), certificates.length);
  for (const certificate of certificates) {
    assert(await evaluate(`!!document.querySelector('a[href="${certificate.href}"]')`), `${certificate.issuer} has its real verification link`);
    const asset = await fetch(new URL(certificate.image, base));
    assert.equal(asset.status, 200, `Local certificate ${certificate.id}`);
    assert.match(asset.headers.get("content-type"), /image\/webp/);
  }
  for (const project of projects)
    assert(await evaluate(`!!document.querySelector('a[href="${project.href}"]')`), `${project.title} is preserved`);
  assert(!(await evaluate("performance.getEntriesByType('resource').some(r => /cat-room|phaser|coursera/i.test(r.name))")), "Homepage has no Phaser or runtime certificate-provider dependency");
  const stillFrames = await evaluate("window.__galleryFrames");
  await delay(350);
  assert.equal(await evaluate("window.__galleryFrames"), stillFrames, "Reduced motion must not run a perpetual frame loop");
  await screenshot("desktop-day");

  await click("[data-time-toggle]");
  assert.equal(await evaluate("document.querySelector('[data-gallery-app]').dataset.time"), "evening");
  assert.equal(await evaluate("document.querySelector('[data-time-toggle]').getAttribute('aria-pressed')"), "true");
  await screenshot("desktop-evening");
  await click("[data-time-toggle]");
  await click("[data-motion-toggle]");
  const movingFrames = await evaluate("window.__galleryFrames");
  await delay(350);
  assert((await evaluate("window.__galleryFrames")) > movingFrames, "Motion control resumes the scene");
  await click("[data-motion-toggle]");
  await delay(150);
  const pausedFrames = await evaluate("window.__galleryFrames");
  await delay(350);
  assert.equal(await evaluate("window.__galleryFrames"), pausedFrames, "Pause stops the frame loop");

  const first = certificates[0].id;
  const original = await evaluate(`document.querySelector('[data-frame-link="${first}"]').style.left`);
  const origin = await evaluate("(() => {const r=document.querySelector('[data-gallery-root]').getBoundingClientRect(); return {x:r.x+r.width*.55,y:r.y+r.height*.72}})()");
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...origin, button: "left", clickCount: 1 });
  for (let i = 1; i <= 6; i++)
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: origin.x + i * 15, y: origin.y, button: "left", buttons: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: origin.x + 90, y: origin.y, button: "left", clickCount: 1 });
  assert.notEqual(await evaluate(`document.querySelector('[data-frame-link="${first}"]').style.left`), original, "Dragging changes the view");
  assert.equal(await evaluate("document.querySelector('[data-gallery-dialog]').open"), false, "Dragging cannot open a certificate");
  await click("[data-reset-view]");
  assert(Math.abs(parseFloat(await evaluate(`document.querySelector('[data-frame-link="${first}"]').style.left`)) - parseFloat(original)) < 0.1, "Reset restores the camera");
  const picture = await evaluate(`(() => {const r=document.querySelector('[data-frame-link="${first}"]').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y-85}})()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...picture, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...picture, button: "left", clickCount: 1 });
  await waitFor(opened(first));
  assert.equal(await evaluate("document.activeElement.hasAttribute('data-panel-close')"), true, "Viewer receives keyboard focus");
  await waitFor("document.querySelector('[data-panel-body] .certificate-image').naturalWidth === 1200");
  await screenshot("certificate-detail");
  await click("[data-next-certificate]");
  await waitFor(opened(certificates[1].id));
  await evaluate("history.back()");
  await waitFor(opened(first));
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await waitFor("!document.querySelector('[data-gallery-dialog]').open");
  assert.equal(await evaluate("document.activeElement.dataset.selectFrame"), first, "Closing restores focus");

  await click("[data-collection-link]");
  await waitFor(opened("collection"));
  assert.equal(await evaluate("document.querySelectorAll('[data-panel-body] [data-certificate]').length"), 3);
  await screenshot("collection");
  await click("[data-panel-close]");
  await click('a[href="#contact"]');
  await waitFor(opened("contact"));
  await evaluate("Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText:async()=>{throw new Error('denied')}}})");
  await click("[data-copy-discord]");
  await waitFor(`document.querySelector('[data-copy-status]').textContent.includes('${profile.discord}')`);
  await click("[data-panel-close]");

  for (const width of [390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 2, mobile: true });
    await delay(250);
    assert(await evaluate("document.documentElement.scrollWidth <= innerWidth"), `No overflow at ${width}px`);
    assert(await evaluate("(() => {const c=document.querySelector('[data-gallery-root] canvas'); return c.width>0 && c.width<=c.clientWidth*1.5+2})()"), "Pixel ratio is capped");
    if (width === 390) await screenshot("mobile-room");
    await click(`[data-select-frame="${certificates[2].id}"]`);
    await waitFor(opened(certificates[2].id));
    assert(await evaluate("document.querySelector('[data-gallery-dialog]').scrollWidth <= document.querySelector('[data-gallery-dialog]').clientWidth + 1"), "Mobile viewer does not overflow");
    if (width === 390) await screenshot("mobile-certificate");
    await click("[data-panel-close]");
  }

  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  const blocked = await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return /webgl/i.test(type) ? null : getContext.call(this, type, ...args);
    };
    window.__restoreWebGL = () => { HTMLCanvasElement.prototype.getContext = getContext; };
  ` });
  await send("Page.navigate", { url: base.href });
  await waitFor("document.querySelector('[data-gallery-stage]')?.dataset.sceneState === 'error'");
  assert(await evaluate("document.querySelector('.fallback-frame img').naturalWidth === 1200"), "WebGL fallback uses the real certificates");
  await screenshot("webgl-fallback");
  await click("[data-collection-link]");
  await waitFor(opened("collection"));
  await click("[data-panel-close]");
  await evaluate("window.__restoreWebGL()");
  await click("[data-gallery-retry]");
  await waitFor(ready);
  assert.equal(await evaluate("document.querySelectorAll('[data-gallery-root] canvas').length"), 1, "Retry creates only one canvas");
  await evaluate("document.querySelector('[data-gallery-root] canvas').dispatchEvent(new Event('webglcontextlost', {cancelable:true}))");
  await waitFor("document.querySelector('[data-gallery-stage]').dataset.sceneState === 'error'");
  await click("[data-gallery-retry]");
  await waitFor(ready);
  assert.equal(await evaluate("document.querySelectorAll('[data-gallery-root] canvas').length"), 1);
  await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: blocked.identifier });
  await send("Page.navigate", { url: `${base.href}#${certificates[2].id}` });
  await waitFor(opened(certificates[2].id));
  await waitFor(ready);
  await click("[data-panel-close]");
  await send("Emulation.setScriptExecutionDisabled", { value: true });
  await send("Page.navigate", { url: base.href });
  await waitFor("document.querySelector('#collection')?.clientHeight > 0 && document.querySelector('.fallback-frame img')?.naturalWidth === 1200");
  assert.equal(await evaluate("document.querySelectorAll('[data-gallery-root] canvas').length"), 0, "No-JS edition is real HTML");
  assert.equal(await evaluate("[...document.querySelectorAll('[data-certificate]')].filter(el=>el.clientHeight>0).length"), 3, "All certificates are readable without JS");
  assert(await evaluate("document.querySelector('[data-copy-discord]').hidden"), "No-JS edition hides script-only controls");
  await send("Emulation.setScriptExecutionDisabled", { value: false });
  assert.deepEqual(exceptions, [], "No uncaught browser exceptions");
  assert.deepEqual(failedRequests, [], "No missing resources under the GitHub Pages base path");
  console.log("Passed: real local certificates, 3D render, reduced motion, lighting, pause, drag, reset, raycast selection, viewer, keyboard/focus, history/deep links, collection, clipboard fallback, 390/320px layouts, DPR cap, WebGL failure/retry, context loss, no-JS.");
} catch (error) {
  console.error({ exceptions, failedRequests });
  if (send && socket?.readyState === WebSocket.OPEN) {
    const { data } = await send("Page.captureScreenshot", { format: "png" }).catch(() => ({}));
    if (data) {
      const path = join(output, "failure.png");
      writeFileSync(path, Buffer.from(data, "base64"));
      console.error(`Failure screenshot: ${path}`);
    }
  }
  throw error;
} finally {
  clearTimeout(watchdog);
  if (send && socket?.readyState === WebSocket.OPEN)
    await Promise.race([send("Browser.close").catch(() => {}), delay(1500)]);
  socket?.close();
  for (const request of waiting.values()) clearTimeout(request.timeout);
  browser.kill();
}
