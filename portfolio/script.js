const reveals = document.querySelectorAll(".reveal");
const loader = document.getElementById("loader");
const loaderProgress = document.getElementById("loader-progress");

document.body.classList.add("loading");

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function hideLoader() {
  window.clearInterval(progressTimer);
  if (loaderProgress) loaderProgress.style.width = "100%";

  window.setTimeout(() => {
    if (loader) loader.classList.add("hidden");
    document.body.classList.remove("loading");
  }, 120);
}

let progressValue = 0;
const progressTimer = window.setInterval(() => {
  progressValue = Math.min(progressValue + 14, 94);
  if (loaderProgress) loaderProgress.style.width = `${progressValue}%`;
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
const ctx = canvas ? canvas.getContext("2d") : null;
const stars = [];

function resizeCanvas() {
  if (!canvas) return;
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
  if (!ctx || !canvas) return;
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

if (canvas && ctx) {
  resizeCanvas();
  createStars();
  renderStars();
}

window.addEventListener("resize", () => {
  resizeCanvas();
  createStars();
});

const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");
const touchEffects = document.getElementById("touch-effects");

window.addEventListener("mousemove", (event) => {
  const { clientX, clientY } = event;
  cursorDot.style.transform = `translate(${clientX}px, ${clientY}px)`;
  cursorRing.style.transform = `translate(${clientX}px, ${clientY}px)`;
});

document.querySelectorAll(".interactive, .tilt-card").forEach((element) => {
  element.addEventListener("mouseenter", () => cursorRing.classList.add("active"));
  element.addEventListener("mouseleave", () => cursorRing.classList.remove("active"));
});

function spawnTouchBubble(x, y) {
  if (!touchEffects) {
    return;
  }

  const bubble = document.createElement("span");
  bubble.className = "touch-bubble";
  bubble.style.left = `${x}px`;
  bubble.style.top = `${y}px`;
  touchEffects.appendChild(bubble);

  for (let i = 0; i < 7; i += 1) {
    const particle = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 7;
    const distance = 24 + Math.random() * 26;
    const driftX = Math.cos(angle) * distance;
    const driftY = Math.sin(angle) * distance;

    particle.className = "touch-particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty("--drift-x", `${driftX}px`);
    particle.style.setProperty("--drift-y", `${driftY}px`);
    particle.style.setProperty("--particle-delay", `${Math.random() * 0.06}s`);
    touchEffects.appendChild(particle);

    window.setTimeout(() => {
      particle.remove();
    }, 780);
  }

  window.setTimeout(() => {
    bubble.remove();
  }, 760);
}

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
const projectToggles = document.querySelectorAll(".project-toggle");

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

projectToggles.forEach((button) => {
  button.addEventListener("click", () => {
    const section = button.closest(".project-domain-section");
    const isOpen = section.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
    button.textContent = isOpen ? "Hide Projects" : "View Projects";
    playButtonSound();
  });
});

const modal = document.getElementById("project-modal");
const modalTitle = document.getElementById("modal-title");
const modalDomain = document.getElementById("modal-domain");
const modalDescription = document.getElementById("modal-description");
const modalImage = document.getElementById("modal-image");
const modalStack = document.getElementById("modal-stack");
const modalStatus = document.getElementById("modal-status");
const modalHighlights = document.getElementById("modal-highlights");
const modalLink = document.getElementById("modal-link");
const modalClose = document.getElementById("modal-close");
const profilePhotoTrigger = document.getElementById("profile-photo-trigger");
const profileShowcase = document.querySelector(".profile-showcase");
const photoModal = document.getElementById("photo-modal");
const photoModalClose = document.getElementById("photo-modal-close");

function openModal(card) {
  modalTitle.textContent = card.dataset.title || "Project";
  modalDomain.textContent = card.dataset.domain || "Project Domain";
  modalDescription.textContent = card.dataset.description || "Details coming soon.";
  modalImage.src = card.dataset.image || "./assets/project-genai.svg";
  modalImage.alt = `${card.dataset.title || "Project"} preview`;
  modalStack.textContent = card.dataset.stack || "Custom stack";
  modalStatus.textContent = card.dataset.status || "In Progress";
  modalHighlights.textContent = card.dataset.highlights || "Representative work will appear here.";

  const link = card.dataset.link || "https://github.com/SAIKIRANPATNANA";
  const linkLabel = card.dataset.linkLabel || "Visit Repository";
  modalLink.href = link;
  modalLink.textContent = linkLabel;

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

function openPhotoModal() {
  photoModal.classList.add("open");
  photoModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  playModalOpenSound();
}

function closePhotoModal() {
  photoModal.classList.remove("open");
  photoModal.setAttribute("aria-hidden", "true");
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

if (modalClose) {
  modalClose.addEventListener("click", closeModal);
}

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

if (profilePhotoTrigger) {
  profilePhotoTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openPhotoModal();
  });
}

if (profileShowcase) {
  profileShowcase.addEventListener("click", (event) => {
    if (event.target.closest("#profile-photo-trigger")) {
      return;
    }
  });
}

if (photoModalClose) {
  photoModalClose.addEventListener("click", closePhotoModal);
}

if (photoModal) {
  photoModal.addEventListener("click", (event) => {
    if (event.target === photoModal) {
      closePhotoModal();
    }
  });
}

window.addEventListener("keydown", (event) => {
  if (modal && event.key === "Escape" && modal.classList.contains("open")) {
    closeModal();
  }

  if (photoModal && event.key === "Escape" && photoModal.classList.contains("open")) {
    closePhotoModal();
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
  async (event) => {
    if (!audioUnlocked) {
      await unlockAudio();
    }

    if (event.pointerType === "touch") {
      spawnTouchBubble(event.clientX, event.clientY);
    }
  },
  { once: true }
);

window.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch") {
    spawnTouchBubble(event.clientX, event.clientY);
  }
});

window.addEventListener("DOMContentLoaded", hideLoader, { once: true });
window.addEventListener("load", hideLoader, { once: true });
window.setTimeout(hideLoader, 1400);

if (document.body.classList.contains("article-page") && !window.location.hash) {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

const readingProgressBar = document.getElementById("reading-progress-bar");

if (readingProgressBar) {
  const updateReadingProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
    readingProgressBar.style.width = `${progress}%`;
  };

  updateReadingProgress();
  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  window.addEventListener("resize", updateReadingProgress);
}

document.querySelectorAll('[data-quiz-type="choice"], [data-quiz-type="mcq"]').forEach((card) => {
  const answer = card.dataset.answer;
  const feedback = card.querySelector(".quiz-feedback");
  const blank = card.querySelector(".quiz-blank");
  const buttons = card.querySelectorAll(".quiz-chip, .quiz-option");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");

      const value = button.dataset.value;
      if (blank) {
        blank.textContent = value;
      }

      if (value === answer) {
        feedback.textContent = "Correct.";
        feedback.className = "quiz-feedback correct";
      } else {
        feedback.textContent = "Not quite. Try again.";
        feedback.className = "quiz-feedback wrong";
      }
    });
  });
});

const articleQuiz = document.querySelector(".article-quiz");

if (articleQuiz) {
  const quizCards = Array.from(articleQuiz.querySelectorAll(".quiz-card"));
  const prevButton = articleQuiz.querySelector(".quiz-prev");
  const nextButton = articleQuiz.querySelector(".quiz-next");
  const restartButton = articleQuiz.querySelector(".quiz-restart");
  const progressCopy = articleQuiz.querySelector("#quiz-progress-copy");
  const progressFill = articleQuiz.querySelector("#quiz-progress-fill");
  const summary = articleQuiz.querySelector("#quiz-summary");
  const scoreNode = articleQuiz.querySelector("#quiz-score");
  const totalNode = articleQuiz.querySelector("#quiz-total");
  const summaryCopy = articleQuiz.querySelector("#quiz-summary-copy");

  let currentQuizIndex = 0;
  const results = new Array(quizCards.length).fill(null);

  const evaluateQuizCard = (card) => {
    const type = card.dataset.quizType;
    const feedback = card.querySelector(".quiz-feedback");

    if (type === "match") {
      const selects = Array.from(card.querySelectorAll(".match-select"));
      const values = selects.map((select) => select.value);
      const answered = values.every(Boolean);

      if (!answered) {
        feedback.textContent = "Match both rows before moving on.";
        feedback.className = "quiz-feedback wrong";
        return { answered: false, correct: false };
      }

      const expected = ["similarity", "hierarchy"];
      const correct = values.every((value, index) => value === expected[index]);
      feedback.textContent = correct ? "Great match." : "Close, but swap the approaches.";
      feedback.className = `quiz-feedback ${correct ? "correct" : "wrong"}`;
      return { answered: true, correct };
    }

    const selected = card.querySelector(".quiz-chip.selected, .quiz-option.selected");
    if (!selected) {
      feedback.textContent = "Choose an answer before moving on.";
      feedback.className = "quiz-feedback wrong";
      return { answered: false, correct: false };
    }

    const correct = selected.dataset.value === card.dataset.answer;
    feedback.textContent = correct ? "Correct." : "Not quite. Try to remember the key idea.";
    feedback.className = `quiz-feedback ${correct ? "correct" : "wrong"}`;
    return { answered: true, correct };
  };

  const updateQuizStep = () => {
    quizCards.forEach((card, index) => {
      card.hidden = index !== currentQuizIndex;
    });

    const total = quizCards.length;
    if (progressCopy) {
      progressCopy.textContent = `Question ${currentQuizIndex + 1} of ${total}`;
    }
    if (progressFill) {
      progressFill.style.width = `${((currentQuizIndex + 1) / total) * 100}%`;
    }
    if (prevButton) {
      prevButton.disabled = currentQuizIndex === 0;
    }
    if (nextButton) {
      nextButton.textContent = currentQuizIndex === total - 1 ? "See Results" : "Next Question";
    }
  };

  const showQuizSummary = () => {
    quizCards.forEach((card) => {
      card.hidden = true;
    });
    if (summary) {
      summary.hidden = false;
    }

    const score = results.filter((result) => result?.correct).length;
    if (scoreNode) scoreNode.textContent = String(score);
    if (totalNode) totalNode.textContent = String(quizCards.length);

    if (summaryCopy) {
      if (score === quizCards.length) {
        summaryCopy.textContent = "Excellent. You understood both the mechanics and the tradeoffs clearly.";
      } else if (score >= Math.ceil(quizCards.length * 0.66)) {
        summaryCopy.textContent = "Strong work. You’ve got the main idea; the answer list below will sharpen the details.";
      } else {
        summaryCopy.textContent = "Nice start. Read the answer list once, then try the quiz again to lock the ideas in.";
      }
    }

    if (progressCopy) {
      progressCopy.textContent = "Quiz complete";
    }
    if (progressFill) {
      progressFill.style.width = "100%";
    }
    if (prevButton) prevButton.hidden = true;
    if (nextButton) nextButton.hidden = true;
  };

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (currentQuizIndex > 0) {
        currentQuizIndex -= 1;
        updateQuizStep();
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      const result = evaluateQuizCard(quizCards[currentQuizIndex]);
      if (!result.answered) {
        return;
      }

      results[currentQuizIndex] = result;

      if (currentQuizIndex === quizCards.length - 1) {
        showQuizSummary();
        return;
      }

      currentQuizIndex += 1;
      updateQuizStep();
    });
  }

  if (restartButton) {
    restartButton.addEventListener("click", () => {
      currentQuizIndex = 0;
      results.fill(null);

      quizCards.forEach((card) => {
        card.hidden = false;
        card.querySelectorAll(".quiz-chip, .quiz-option").forEach((button) => {
          button.classList.remove("selected");
        });
        card.querySelectorAll(".match-select").forEach((select) => {
          select.value = "";
        });
        const blank = card.querySelector(".quiz-blank");
        if (blank) {
          blank.textContent = "_____";
        }
        const feedback = card.querySelector(".quiz-feedback");
        if (feedback) {
          feedback.textContent = "";
          feedback.className = "quiz-feedback";
        }
      });

      if (summary) {
        summary.hidden = true;
      }
      if (prevButton) prevButton.hidden = false;
      if (nextButton) nextButton.hidden = false;
      updateQuizStep();
    });
  }

  updateQuizStep();
}
