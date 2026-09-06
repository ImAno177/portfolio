const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const clock = document.querySelector("#clock");
const palette = document.querySelector("#command-palette");
const commandInput = document.querySelector("#command-input");

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
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

  if (event.key === "/" && !isTyping && !palette?.open) {
    event.preventDefault();
    openPalette();
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
const projectRows = [...document.querySelectorAll(".project-row")];

function applyFilter(filter) {
  projectRows.forEach((row) => {
    row.hidden = filter !== "all" && row.dataset.category !== filter;
  });

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
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
}

async function runMotion() {
  if (reduceMotionQuery.matches) return;

  try {
    const { animate, stagger } = await import("https://cdn.jsdelivr.net/npm/animejs/+esm");

    animate(".system-bar, .workspace-window", {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 360,
      delay: stagger(70),
      ease: "outExpo",
    });

    animate(".project-row", {
      opacity: [0, 1],
      translateX: [-8, 0],
      duration: 320,
      delay: stagger(40),
      ease: "outExpo",
    });

    animate(".cursor-block", {
      opacity: [1, 0.2],
      duration: 720,
      loop: true,
      alternate: true,
      ease: "inOutSine",
    });
  } catch {
    document.documentElement.dataset.motion = "fallback";
  }
}

runMotion();
