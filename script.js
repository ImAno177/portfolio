const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const clock = document.querySelector("#clock");
const palette = document.querySelector("#command-palette");
const commandInput = document.querySelector("#command-input");
const sceneShell = document.querySelector("[data-scene]");
const sceneMessage = document.querySelector("#scene-message");
const sceneRuntime = document.querySelector("#scene-runtime");
const motionStatus = document.querySelector("#motion-status");
const sceneCoordinate = document.querySelector("#scene-coordinate");

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

function openPalette() {
  if (!palette || typeof palette.showModal !== "function") return;
  palette.showModal();
  commandInput?.focus();
}

document.querySelectorAll("[data-open-palette]").forEach((trigger) => {
  trigger.addEventListener("click", openPalette);
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;

  if (event.key === "/" && !isTyping && !palette?.open) {
    event.preventDefault();
    openPalette();
  }

  if (event.key.toLowerCase() === "p" && !isTyping && !palette?.open) {
    event.preventDefault();
    pulseScene();
  }
});

document.querySelectorAll("[data-jump]").forEach((jump) => {
  jump.addEventListener("click", () => {
    const destination = document.querySelector(jump.dataset.jump);
    if (!destination) return;

    palette?.close();
    destination.scrollIntoView({
      behavior: reduceMotionQuery.matches ? "auto" : "smooth",
      block: "start",
    });
    destination.focus({ preventScroll: true });
  });
});

const filterButtons = [...document.querySelectorAll("[data-filter]")];
const projectRows = [...document.querySelectorAll("[data-category]")];

function applyFilter(filter) {
  projectRows.forEach((row) => {
    const isVisible = filter === "all" || row.dataset.category === filter;
    row.hidden = !isVisible;
    row.setAttribute("aria-hidden", String(!isVisible));
  });

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (motionApi?.animate && !reduceMotionQuery.matches) {
    motionApi.animate(projectRows.filter((row) => !row.hidden), {
      opacity: [0.55, 1],
      translateX: [-8, 0],
      duration: 260,
      delay: motionApi.stagger(35),
      ease: "outExpo",
    });
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => applyFilter(button.dataset.filter));
});

if (commandInput) {
  const paletteChoices = [...document.querySelectorAll("[data-jump]")];
  commandInput.addEventListener("input", () => {
    const query = commandInput.value.trim().toLowerCase();
    paletteChoices.forEach((choice) => {
      choice.hidden = query !== "" && !choice.textContent.toLowerCase().includes(query);
    });
  });

  palette?.addEventListener("close", () => {
    commandInput.value = "";
    paletteChoices.forEach((choice) => {
      choice.hidden = false;
    });
  });
}

let motionApi = null;
const motionReady = import("https://cdn.jsdelivr.net/npm/animejs/+esm")
  .then((module) => {
    motionApi = module;
    if (motionStatus) motionStatus.textContent = reduceMotionQuery.matches ? "anime.js / reduced" : "anime.js / ready";
    return module;
  })
  .catch(() => {
    if (motionStatus) motionStatus.textContent = "anime.js / fallback";
    return null;
  });

function setSceneMessage(message) {
  if (sceneMessage) sceneMessage.textContent = message;
}

function animatePulseUi() {
  if (!motionApi?.animate) return;

  motionApi.animate(".scene-pulse", {
    scale: [0.35, 1.3],
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

let pulseMessageTimer = 0;
let sceneApi = null;

document.querySelectorAll("[data-pulse-scene]").forEach((trigger) => {
  trigger.addEventListener("click", pulseScene);
});

function runEntrance() {
  motionReady.then((module) => {
    if (!module || reduceMotionQuery.matches) return;

    const { animate, stagger } = module;
    animate(".system-bar", {
      opacity: [0, 1],
      translateY: [-10, 0],
      duration: 500,
      ease: "outExpo",
    });
    animate(".hero-name", {
      opacity: [0, 1],
      translateY: [26, 0],
      duration: 760,
      ease: "outExpo",
    });
    animate(".hero-verb", {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 620,
      delay: 110,
      ease: "outExpo",
    });
    animate(".hero-role, .hero-description, .hero-actions, .hero-notes", {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 560,
      delay: stagger(70, { start: 220 }),
      ease: "outExpo",
    });
    animate(".hero-stage", {
      opacity: [0, 1],
      translateX: [24, 0],
      duration: 900,
      delay: 120,
      ease: "outExpo",
    });
    animate(".project-feature", {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 650,
      delay: 320,
      ease: "outExpo",
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries, currentObserver) => {
        const targets = entries.filter((entry) => entry.isIntersecting).map((entry) => {
          currentObserver.unobserve(entry.target);
          return entry.target;
        });
        if (!targets.length) return;

        animate(targets, {
          opacity: [0, 1],
          translateY: [18, 0],
          duration: 520,
          delay: stagger(55),
          ease: "outExpo",
        });
      }, { threshold: 0.12 });

      document.querySelectorAll(".project-row, .info-panel, .contact-section").forEach((element) => observer.observe(element));
    }
  });
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

      const particleCount = 720;
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
      let visible = true;
      let frameId = 0;
      let previousTime = 0;
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

      sceneShell.addEventListener("pointermove", (event) => updatePointer(event.clientX, event.clientY), { passive: true });
      sceneShell.addEventListener("pointerleave", resetPointer, { passive: true });
      canvas.addEventListener("touchstart", (event) => {
        const touch = event.touches[0];
        if (touch) updatePointer(touch.clientX, touch.clientY);
      }, { passive: true });
      canvas.addEventListener("touchmove", (event) => {
        const touch = event.touches[0];
        if (touch) updatePointer(touch.clientX, touch.clientY);
      }, { passive: true });
      window.addEventListener("resize", resize, { passive: true });

      function render(time) {
        frameId = 0;
        if (!visible) return;

        const delta = Math.min(time - previousTime, 50);
        previousTime = time;
        if (!reduceMotionQuery.matches) {
          pointer.x += (pointerTarget.x - pointer.x) * 0.045;
          pointer.y += (pointerTarget.y - pointer.y) * 0.045;
          coreGroup.rotation.y += delta * 0.00028;
          coreGroup.rotation.x += (pointer.y * 0.18 - coreGroup.rotation.x) * 0.035;
          coreGroup.rotation.z += delta * 0.00005;
          particles.rotation.y -= delta * 0.000035;
          particles.rotation.x = pointer.y * 0.04;

          const pulseProgress = Math.min(1, Math.max(0, (time - pulseStarted) / 900));
          const pulseEnvelope = pulseProgress < 1 ? Math.sin(pulseProgress * Math.PI) : 0;
          coreGroup.scale.setScalar(1 + pulseEnvelope * 0.11);
          particleMaterial.opacity = 0.6 + pulseEnvelope * 0.25;
        }

        renderer.render(scene, camera);
        if (!reduceMotionQuery.matches) frameId = window.requestAnimationFrame(render);
      }

      sceneApi = {
        pulse() {
          pulseStarted = performance.now();
          if (reduceMotionQuery.matches) {
            renderer.render(scene, camera);
          } else if (!frameId) {
            frameId = window.requestAnimationFrame(render);
          }
        },
      };

      const visibilityObserver = "IntersectionObserver" in window ? new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduceMotionQuery.matches && !frameId) frameId = window.requestAnimationFrame(render);
      }, { threshold: 0.05 }) : null;
      visibilityObserver?.observe(sceneShell);

      sceneShell.dataset.webgl = "live";
      if (sceneRuntime) sceneRuntime.textContent = "three.js / live";
      setSceneMessage("move through the field");
      resize();
      if (reduceMotionQuery.matches) renderer.render(scene, camera);
      else frameId = window.requestAnimationFrame(render);
    } catch {
      canvas.hidden = true;
      sceneShell.dataset.webgl = "fallback";
      if (sceneRuntime) sceneRuntime.textContent = "three.js / fallback";
      setSceneMessage("fallback field / no WebGL required");
    }
  })();
}

runEntrance();
initSignalScene();
