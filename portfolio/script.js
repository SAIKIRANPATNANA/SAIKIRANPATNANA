const reveals = document.querySelectorAll(".reveal");
const loader = document.getElementById("loader");
const loaderProgress = document.getElementById("loader-progress");

document.body.classList.add("loading");

let progressValue = 0;
const progressTimer = window.setInterval(() => {
  progressValue = Math.min(progressValue + 14, 94);
  loaderProgress.style.width = `${progressValue}%`;
}, 120);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.14 }
);

reveals.forEach((item) => revealObserver.observe(item));

const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");
const stars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createStars() {
  stars.length = 0;
  const count = Math.min(220, Math.floor((window.innerWidth * window.innerHeight) / 10000));

  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.7 + 0.2,
      speed: Math.random() * 0.22 + 0.04,
      alpha: Math.random() * 0.55 + 0.2,
    });
  }
}

function renderStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const star of stars) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();

    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = -2;
      star.x = Math.random() * canvas.width;
    }
  }

  requestAnimationFrame(renderStars);
}

resizeCanvas();
createStars();
renderStars();

window.addEventListener("resize", () => {
  resizeCanvas();
  createStars();
});

const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");

window.addEventListener("mousemove", (event) => {
  const { clientX, clientY } = event;
  cursorDot.style.transform = `translate(${clientX}px, ${clientY}px)`;
  cursorRing.style.transform = `translate(${clientX}px, ${clientY}px)`;
});

document.querySelectorAll(".interactive, .tilt-card").forEach((element) => {
  element.addEventListener("mouseenter", () => cursorRing.classList.add("active"));
  element.addEventListener("mouseleave", () => cursorRing.classList.remove("active"));
});

document.querySelectorAll(".tilt-card").forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -8;
    const rotateY = ((x / rect.width) - 0.5) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

let audioContext;
let masterGain;
let audioUnlocked = false;

function ensureAudio() {
  if (!audioContext) {
    audioContext = new window.AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.06;
    masterGain.connect(audioContext.destination);
  }
}

async function unlockAudio() {
  ensureAudio();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  audioUnlocked = true;
}

function createTone(frequency, type, duration, volume, delay = 0) {
  if (!audioUnlocked) {
    return;
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime + delay;

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

function playButtonSound() {
  createTone(640, "triangle", 0.11, 0.08);
  createTone(920, "sine", 0.08, 0.045, 0.015);
}

function playTabSound() {
  createTone(520, "sine", 0.08, 0.05);
  createTone(740, "triangle", 0.12, 0.04, 0.02);
}

function playModalOpenSound() {
  createTone(360, "sine", 0.18, 0.04);
  createTone(540, "triangle", 0.22, 0.045, 0.04);
  createTone(810, "sine", 0.18, 0.03, 0.08);
}

function playModalCloseSound() {
  createTone(780, "sine", 0.09, 0.035);
  createTone(420, "triangle", 0.14, 0.035, 0.04);
}

const tabButtons = document.querySelectorAll(".tab-button");
const projectCards = document.querySelectorAll(".project-card");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    tabButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    playTabSound();

    projectCards.forEach((card) => {
      const category = card.dataset.category;
      const show = filter === "all" || category === filter || category === "all";
      card.classList.toggle("hidden", !show);
    });
  });
});

const modal = document.getElementById("project-modal");
const modalTitle = document.getElementById("modal-title");
const modalDomain = document.getElementById("modal-domain");
const modalDescription = document.getElementById("modal-description");
const modalStack = document.getElementById("modal-stack");
const modalClose = document.getElementById("modal-close");

function openModal(card) {
  modalTitle.textContent = card.dataset.title || "Project";
  modalDomain.textContent = card.dataset.domain || "Project Domain";
  modalDescription.textContent = card.dataset.description || "Details coming soon.";
  modalStack.textContent = card.dataset.stack || "Custom stack";

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  playModalOpenSound();
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  playModalCloseSound();
}

document.querySelectorAll(".project-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    const clickedButton = event.target.closest(".card-link") || event.target.closest(".project-card");
    if (!clickedButton) {
      return;
    }

    openModal(card);
  });
});

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("open")) {
    closeModal();
  }
});

document.querySelectorAll(".interactive").forEach((element) => {
  element.addEventListener("click", () => {
    if (!element.closest(".project-card") && !element.classList.contains("tab-button")) {
      playButtonSound();
    }
  });
});

window.addEventListener(
  "pointerdown",
  async () => {
    if (!audioUnlocked) {
      await unlockAudio();
    }
  },
  { once: true }
);

window.addEventListener("load", () => {
  window.clearInterval(progressTimer);
  loaderProgress.style.width = "100%";

  window.setTimeout(() => {
    loader.classList.add("hidden");
    document.body.classList.remove("loading");
  }, 420);
});
