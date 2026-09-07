const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const clock = document.querySelector("#clock");
const palette = document.querySelector("#command-palette");
const commandInput = document.querySelector("#command-input");
const commandItems = [...document.querySelectorAll("[data-command-item]")];
const commandStatus = document.querySelector("#command-status");
const sceneShell = document.querySelector("[data-scene]");
const sceneMessage = document.querySelector("#scene-message");
const sceneRuntime = document.querySelector("#scene-runtime");
const railRuntime = document.querySelector("#rail-runtime");
const motionStatus = document.querySelector("#motion-status");
const sceneCoordinate = document.querySelector("#scene-coordinate");
const projectPanels = [...document.querySelectorAll(".project-panel")];
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const sectionCount = document.querySelector(".section-count");

let motionApi = null;
let sceneApi = null;
let pulseMessageTimer = 0;

function updateClock() {
  if (!clock) return;

  const now = new Date();
  clock.textContent = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  clock.dateTime = now.toISOString();
}

updateClock();
window.setInterval(updateClock, 60_000);

function setSceneMessage(message) {
  if (sceneMessage) sceneMessage.textContent = message;
}

function openPalette() {
  if (!palette || typeof palette.showModal !== "function") return;
  palette.showModal();
  commandInput?.focus();
}

document.querySelectorAll("[data-open-palette]").forEach((trigger) => {
  trigger.addEventListener("click", openPalette);
});

function isTypingTarget(target) {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target?.isContentEditable;
}

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !isTypingTarget(event.target) && !palette?.open) {
    event.preventDefault();
    openPalette();
  }

  if (event.key.toLowerCase() === "p" && !isTypingTarget(event.target) && !palette?.open) {
    event.preventDefault();
    pulseScene();
  }
});

commandItems.forEach((item) => {
  item.addEventListener("click", () => {
    palette?.close();
    const destination = item.getAttribute("href");
    if (!destination?.startsWith("#")) return;
    window.setTimeout(() => {
      document.querySelector(destination)?.focus({ preventScroll: true });
    }, 0);
  });
});

if (commandInput) {
  commandInput.addEventListener("input", () => {
    const query = commandInput.value.trim().toLowerCase();
    let matches = 0;

    commandItems.forEach((item) => {
      const isMatch = query === "" || item.textContent.toLowerCase().includes(query);
      item.hidden = !isMatch;
      if (isMatch) matches += 1;
    });

    if (commandStatus) {
      commandStatus.textContent = query
        ? `${matches} route${matches === 1 ? "" : "s"} match / esc to close`
        : "/ to open · esc to close";
    }
  });

  palette?.addEventListener("close", () => {
    commandInput.value = "";
    commandItems.forEach((item) => { item.hidden = false; });
    if (commandStatus) commandStatus.textContent = "/ to open · esc to close";
  });
}

function moveProjectFocus(current, direction) {
  const visiblePanels = projectPanels.filter((panel) => !panel.hidden);
  const currentIndex = visiblePanels.indexOf(current.closest(".project-panel"));
  if (currentIndex < 0) return;
  const nextIndex = (currentIndex + direction + visiblePanels.length) % visiblePanels.length;
  visiblePanels[nextIndex].querySelector("[data-project-trigger]")?.focus();
}

function setProjectOpen(panel, shouldOpen, shouldAnimate = true) {
  const body = panel.querySelector(".project-body");
  const trigger = panel.querySelector("[data-project-trigger]");
  if (!body || !trigger) return;

  panel.classList.toggle("is-open", shouldOpen);
  trigger.setAttribute("aria-expanded", String(shouldOpen));
  body.hidden = !shouldOpen;

  if (shouldOpen && shouldAnimate && motionApi?.animate && !reduceMotionQuery.matches) {
    motionApi.animate(body, {
      opacity: [0.45, 1],
      translateX: [16, 0],
      duration: 420,
      ease: "outExpo",
    });
  }
}

function toggleProject(panel) {
  const shouldOpen = !panel.classList.contains("is-open");
  projectPanels.forEach((candidate) => setProjectOpen(candidate, candidate === panel && shouldOpen));
}

projectPanels.forEach((panel) => {
  const trigger = panel.querySelector("[data-project-trigger]");
  if (!trigger) return;

  trigger.addEventListener("click", () => toggleProject(panel));
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveProjectFocus(trigger, 1);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveProjectFocus(trigger, -1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      projectPanels.find((candidate) => !candidate.hidden)?.querySelector("[data-project-trigger]")?.focus();
    }
    if (event.key === "End") {
      event.preventDefault();
      [...projectPanels].reverse().find((candidate) => !candidate.hidden)?.querySelector("[data-project-trigger]")?.focus();
    }
  });
});

function applyFilter(filter) {
  const visiblePanels = [];

  projectPanels.forEach((panel) => {
    const isVisible = filter === "all" || panel.dataset.category === filter;
    panel.hidden = !isVisible;
    panel.setAttribute("aria-hidden", String(!isVisible));
    if (isVisible) visiblePanels.push(panel);
  });

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  const openPanel = visiblePanels.find((panel) => panel.classList.contains("is-open"));
  const nextOpen = openPanel || visiblePanels[0];
  projectPanels.forEach((panel) => setProjectOpen(panel, panel === nextOpen, false));

  if (sectionCount) {
    sectionCount.textContent = `${visiblePanels.length.toString().padStart(2, "0")} ${visiblePanels.length === 1 ? "verified trail" : "verified trails"}`;
  }

  if (motionApi?.animate && !reduceMotionQuery.matches) {
    motionApi.animate(visiblePanels, {
      opacity: [0.55, 1],
      translateY: [10, 0],
      duration: 360,
      delay: motionApi.stagger(45),
      ease: "outExpo",
    });
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => applyFilter(button.dataset.filter));
});

function animatePulseUi() {
  if (!motionApi?.animate || reduceMotionQuery.matches) return;

  motionApi.animate(".scene-pulse", {
    scale: [0.3, 1.3],
    opacity: [0.82, 0],
    duration: 820,
    ease: "outExpo",
  });
  motionApi.animate(".scene-control", {
    color: ["#d8ff4a", "#63e6ff"],
    duration: 420,
    ease: "outExpo",
  });
}

function pulseScene() {
  sceneApi?.pulse?.();
  animatePulseUi();
  setSceneMessage(reduceMotionQuery.matches ? "pulse acknowledged / reduced motion" : "signal pulse sent / field recalibrating");
  window.clearTimeout(pulseMessageTimer);
  pulseMessageTimer = window.setTimeout(() => setSceneMessage("move through the field"), 1500);
}

document.querySelectorAll("[data-pulse-scene]").forEach((trigger) => {
  trigger.addEventListener("click", pulseScene);
});

function runEntrance() {
  if (!motionApi?.animate || reduceMotionQuery.matches) return;

  const { animate, stagger } = motionApi;
  animate(".hero-copy", {
    opacity: [0, 1],
    translateY: [24, 0],
    duration: 720,
    ease: "outExpo",
  });
  animate(".hero-stage", {
    opacity: [0, 1],
    translateX: [28, 0],
    duration: 900,
    delay: 120,
    ease: "outExpo",
  });
  animate(".status-cell", {
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 500,
    delay: stagger(55, { start: 260 }),
    ease: "outExpo",
  });

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries, currentObserver) => {
    const targets = entries
      .filter((entry) => entry.isIntersecting)
      .map((entry) => {
        currentObserver.unobserve(entry.target);
        return entry.target;
      });
    if (!targets.length) return;

    animate(targets, {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 560,
      delay: stagger(60),
      ease: "outExpo",
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".work-section, .stack-section, .contact-section").forEach((section) => observer.observe(section));
}

const motionReady = import("https://cdn.jsdelivr.net/npm/animejs@4.0.2/+esm")
  .then((module) => {
    motionApi = module;
    if (motionStatus) {
      motionStatus.textContent = reduceMotionQuery.matches ? "anime.js / reduced" : "anime.js / ready";
    }
    runEntrance();
    return module;
  })
  .catch(() => {
    if (motionStatus) motionStatus.textContent = "anime.js / fallback";
    return null;
  });

function setRuntimeStatus(value) {
  if (sceneRuntime) sceneRuntime.textContent = value;
  if (railRuntime) railRuntime.textContent = value;
}

function initSignalScene() {
  if (!sceneShell) return Promise.resolve();

  return (async () => {
    const canvas = sceneShell.querySelector("#signal-canvas");
    if (!canvas) return;

    try {
      const probeCanvas = document.createElement("canvas");
      const hasWebgl = Boolean(probeCanvas.getContext("webgl2") || probeCanvas.getContext("webgl"));
      if (!hasWebgl) throw new Error("WebGL unavailable");

      const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.185.0/build/three.module.js");
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(0, 0, 7.4);

      const coreGroup = new THREE.Group();
      scene.add(coreGroup);

      const coreGeometry = new THREE.IcosahedronGeometry(1.06, 2);
      const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0x111b12,
        emissive: 0x263b0f,
        emissiveIntensity: 0.75,
        metalness: 0.7,
        roughness: 0.28,
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      coreGroup.add(core);

      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(coreGeometry),
        new THREE.LineBasicMaterial({ color: 0xd8ff4a, transparent: true, opacity: 0.76 }),
      );
      wire.scale.setScalar(1.02);
      coreGroup.add(wire);

      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(1.34, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x1f3a15, transparent: true, opacity: 0.2, wireframe: true }),
      );
      coreGroup.add(halo);

      const ringSpecs = [
        { radius: 1.75, color: 0xd8ff4a, rotation: [0.9, 0.15, 0.2] },
        { radius: 1.98, color: 0x63e6ff, rotation: [0.2, 0.8, -0.35] },
        { radius: 2.22, color: 0xa99aff, rotation: [-0.5, 0.1, 0.75] },
      ];

      ringSpecs.forEach((spec) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(spec.radius, 0.014, 8, 128),
          new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.75 }),
        );
        ring.rotation.set(...spec.rotation);
        coreGroup.add(ring);
      });

      coreGroup.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xd8ff4a }),
      ));

      const particleCount = 480;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let index = 0; index < particleCount; index += 1) {
        const angle = index * 12.9898;
        const radius = 2.7 + (index % 23) / 23 * 2.3;
        particlePositions[index * 3] = Math.sin(angle) * radius;
        particlePositions[index * 3 + 1] = Math.cos(angle * 0.73) * radius * 0.7;
        particlePositions[index * 3 + 2] = Math.sin(angle * 0.41) * radius * 0.48;
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        color: 0x63e6ff,
        size: 0.024,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.6,
      });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particles);

      scene.add(new THREE.AmbientLight(0xf5f2e9, 0.58));
      const limeLight = new THREE.PointLight(0xd8ff4a, 7, 9);
      limeLight.position.set(-2.5, 2.2, 3.5);
      scene.add(limeLight);
      const cyanLight = new THREE.PointLight(0x63e6ff, 5, 8);
      cyanLight.position.set(2.5, -1.5, 2.7);
      scene.add(cyanLight);

      const pointer = { x: 0, y: 0 };
      const pointerTarget = { x: 0, y: 0 };
      let frameId = 0;
      let visible = true;
      let pulseStarted = -Infinity;

      function resize() {
        const bounds = sceneShell.getBoundingClientRect();
        const width = Math.max(1, bounds.width);
        const height = Math.max(1, bounds.height);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        if (reduceMotionQuery.matches) renderer.render(scene, camera);
      }

      function updatePointer(clientX, clientY) {
        const bounds = sceneShell.getBoundingClientRect();
        pointerTarget.x = ((clientX - bounds.left) / bounds.width) * 2 - 1;
        pointerTarget.y = -(((clientY - bounds.top) / bounds.height) * 2 - 1);
        if (sceneCoordinate) sceneCoordinate.textContent = `${pointerTarget.x.toFixed(2)} : ${pointerTarget.y.toFixed(2)}`;
        if (reduceMotionQuery.matches) renderer.render(scene, camera);
      }

      function resetPointer() {
        pointerTarget.x = 0;
        pointerTarget.y = 0;
        if (sceneCoordinate) sceneCoordinate.textContent = "0.00 : 0.00";
      }

      sceneShell.addEventListener("pointermove", (event) => updatePointer(event.clientX, event.clientY));
      sceneShell.addEventListener("pointerleave", resetPointer);
      sceneShell.addEventListener("touchmove", (event) => {
        const touch = event.touches[0];
        if (touch) updatePointer(touch.clientX, touch.clientY);
      }, { passive: true });

      function render(time) {
        frameId = 0;
        if (!visible || document.hidden) return;

        const elapsed = time * 0.001;
        pointer.x += (pointerTarget.x - pointer.x) * 0.035;
        pointer.y += (pointerTarget.y - pointer.y) * 0.035;
        coreGroup.rotation.y = elapsed * 0.16 + pointer.x * 0.34;
        coreGroup.rotation.x = Math.sin(elapsed * 0.22) * 0.09 + pointer.y * 0.2;
        particles.rotation.y = elapsed * 0.025;
        particles.rotation.x = pointer.y * 0.04;

        if (Number.isFinite(pulseStarted)) {
          const pulseAge = performance.now() - pulseStarted;
          coreGroup.scale.setScalar(1 + Math.max(0, 1 - pulseAge / 720) * 0.12);
          if (pulseAge > 720) {
            pulseStarted = -Infinity;
            coreGroup.scale.setScalar(1);
          }
        }

        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(render);
      }

      function startRender() {
        if (reduceMotionQuery.matches) {
          resize();
          return;
        }
        if (!frameId) frameId = window.requestAnimationFrame(render);
      }

      sceneApi = {
        pulse() {
          if (reduceMotionQuery.matches) {
            renderer.render(scene, camera);
            return;
          }
          pulseStarted = performance.now();
          startRender();
        },
      };

      const visibilityObserver = "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) startRender();
        }, { threshold: 0.04 })
        : null;
      visibilityObserver?.observe(sceneShell);

      const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
      resizeObserver?.observe(sceneShell);
      window.addEventListener("resize", resize, { passive: true });

      sceneShell.classList.add("is-live");
      setRuntimeStatus("three.js / live");
      setSceneMessage("move through the field");
      resize();
      startRender();

      window.addEventListener("pagehide", () => {
        visibilityObserver?.disconnect();
        resizeObserver?.disconnect();
        window.cancelAnimationFrame(frameId);
        scene.traverse((object) => {
          if (!object.isMesh && !object.isLineSegments && !object.isPoints) return;
          object.geometry?.dispose?.();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
          else object.material?.dispose?.();
        });
        renderer.dispose();
      }, { once: true });
    } catch (error) {
      setRuntimeStatus("three.js / fallback");
      setSceneMessage("CSS core / runtime fallback");
    }
  })();
}

Promise.allSettled([motionReady, initSignalScene()]);
