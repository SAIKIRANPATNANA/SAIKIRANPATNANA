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

  if (maayaDock && event.key === "Escape" && maayaDock.classList.contains("open")) {
    closeMaaya();
  }
});

document.querySelectorAll(".interactive").forEach((element) => {
  element.addEventListener("click", () => {
    if (!element.closest(".project-card") && !element.classList.contains("tab-button")) {
      playButtonSound();
    }
  });
});

const maayaFab = document.getElementById("maaya-fab");
const maayaDock = document.getElementById("maaya-dock");
const maayaOpen = document.getElementById("maaya-open");
const maayaClose = document.getElementById("maaya-close");
const maayaClear = document.getElementById("maaya-clear");
const maayaChat = document.getElementById("maaya-chat");
const maayaForm = document.getElementById("maaya-form");
const maayaInput = document.getElementById("maaya-input");
const maayaSuggestionButtons = document.querySelectorAll("[data-maaya-question]");
const maayaPresence = document.getElementById("maaya-presence");
const MAAYA_API_URL = window.MAAYA_API_URL || "http://127.0.0.1:8008/api/maaya";
const MAAYA_MEMORY_KEY = "maaya-chat-history";
const MAAYA_MAX_HISTORY_TURNS = 10;

const maayaKnowledge = {
  links: {
    github: "https://github.com/SAIKIRANPATNANA",
    portfolio: "https://saikiranpatnana.github.io/SAIKIRANPATNANA/",
    linkedin: "https://www.linkedin.com/in/sai-kiran-patnana-55170a25b/",
    leetcode: "https://leetcode.com/u/saikiranpatnana5143/",
    resume: "./CV.pdf",
    genaiRepo: "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS",
    mlRepo: "https://github.com/SAIKIRANPATNANA/ML_PROJECTS",
    dlRepo: "https://github.com/SAIKIRANPATNANA/DL_PROJECTS",
    cvRepo: "https://github.com/SAIKIRANPATNANA/CV_PROJECTS",
    nlpRepo: "https://github.com/SAIKIRANPATNANA/NLP_PROJECTS",
    pythonRepo: "https://github.com/SAIKIRANPATNANA/PYTHON_PROJECTS",
    dsa: "https://github.com/SAIKIRANPATNANA/DSA_LEARNING",
    genaiLearning: "https://github.com/SAIKIRANPATNANA/GENERATIVE_AI_LEARNING",
    aiCoreLearning: "https://github.com/SAIKIRANPATNANA/AI_CORE_LEARNING",
    mlopsLearning: "https://github.com/SAIKIRANPATNANA/MLOPS_AND_DEPLOYMENT_LEARNING",
    dataFoundations: "https://github.com/SAIKIRANPATNANA/DATA_FOUNDATIONS",
    nlpLearning: "https://github.com/SAIKIRANPATNANA/NLP_LEARNING",
    programmingMath: "https://github.com/SAIKIRANPATNANA/PROGRAMMING_AND_MATH_FOUNDATIONS",
  },
  projectLinks: {
    "ai news generation": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/ainews-generation-agenticai",
    "ai guardrails": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/ai_guardrails",
    "ats using gemini": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/ats-using-gemini",
    "blood report parsing iisc": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/blood-report-parsing-iisc",
    "blog generation": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/blog-generation-agenticai",
    "calorie calc using gpv": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/calorie-calc-using-gpv",
    "disease diagnosis dhanvantari": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/disease-diagnosis-dhanvantari",
    "harassment bot": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/harassment-bot",
    "hybd cmr edtech": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/hybd_cmr_edtech",
    "med triage agentic ai": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/med-triage-agenticai",
    "rag evaluation": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/rag_evaluation",
    "sadhana genai project": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/sadhana-gen-ai-project",
    "stance detection": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/stance-detection",
    "whatsapp chat analyser": "https://github.com/SAIKIRANPATNANA/GENAI_PROJECTS/tree/main/whatsapp-chat-analyser",
    "crop recommendation classification": "https://github.com/SAIKIRANPATNANA/ML_PROJECTS/tree/main/crop-recommendation-classification",
    "customer segmentation mlops": "https://github.com/SAIKIRANPATNANA/ML_PROJECTS/tree/main/customer-segmentation-mlops",
    "diamond price prediction": "https://github.com/SAIKIRANPATNANA/ML_PROJECTS/tree/main/diamond-price-prediction",
    "red wine quality prediction": "https://github.com/SAIKIRANPATNANA/ML_PROJECTS/tree/main/red-wine-quality-prediction",
    "rural loan approval prediction": "https://github.com/SAIKIRANPATNANA/ML_PROJECTS/tree/main/rural-loan-approval-prediction",
    "sensor fault detection": "https://github.com/SAIKIRANPATNANA/ML_PROJECTS/tree/main/sensor-fault-detection",
    "student performance prediction": "https://github.com/SAIKIRANPATNANA/ML_PROJECTS/tree/main/student-performance-prediction",
    "brain tumor detection": "https://github.com/SAIKIRANPATNANA/CV_PROJECTS/tree/main/brain-tumor-detection",
    "face recognition": "https://github.com/SAIKIRANPATNANA/CV_PROJECTS/tree/main/face-recognition",
    "facial emotion detection": "https://github.com/SAIKIRANPATNANA/CV_PROJECTS/tree/main/facial-emotion-detection",
    "image super resolution gans": "https://github.com/SAIKIRANPATNANA/CV_PROJECTS/tree/main/image-super-resolution-gans",
    "sign language detection": "https://github.com/SAIKIRANPATNANA/CV_PROJECTS/tree/main/sign-language-detection",
    "traffic sign detection": "https://github.com/SAIKIRANPATNANA/CV_PROJECTS/tree/main/traffic-sign-detection",
    "imdb sentiment analysis": "https://github.com/SAIKIRANPATNANA/NLP_PROJECTS/tree/main/imdb-sentiment-analysis",
    "sentiment analysis nlp": "https://github.com/SAIKIRANPATNANA/NLP_PROJECTS/tree/main/sentiment-analysis-nlp",
    "spam message classifier": "https://github.com/SAIKIRANPATNANA/NLP_PROJECTS/tree/main/spam-message-classifier",
    "tmdb movie recommendation": "https://github.com/SAIKIRANPATNANA/NLP_PROJECTS/tree/main/tmdb-movie-recommendation",
    flames: "https://github.com/SAIKIRANPATNANA/PYTHON_PROJECTS/tree/main/flames",
    "python virtual assistant": "https://github.com/SAIKIRANPATNANA/PYTHON_PROJECTS/tree/main/python-virtual-assistant",
    "qr code generator": "https://github.com/SAIKIRANPATNANA/PYTHON_PROJECTS/tree/main/qr-code-generator",
    "rock paper scissors": "https://github.com/SAIKIRANPATNANA/PYTHON_PROJECTS/tree/main/rock-paper-scissors",
    "snake water gun": "https://github.com/SAIKIRANPATNANA/PYTHON_PROJECTS/tree/main/snake-water-gun",
    "telegram bot": "https://github.com/SAIKIRANPATNANA/PYTHON_PROJECTS/tree/main/telegram-bot",
    "tic tac toe": "https://github.com/SAIKIRANPATNANA/PYTHON_PROJECTS/tree/main/tit-tac-toe",
    "virtual voice assistant": "https://github.com/SAIKIRANPATNANA/PYTHON_PROJECTS/tree/main/virtual-voice-assistant",
  },
  projects: {
    blood: "Blood Report Parsing IISc is a healthcare-focused GenAI project built around OCR, structured extraction, abnormality detection, and blood-report insight generation.",
    sadhana: "Sadhana GenAI Project focuses on PDF chat, MCQ generation, Q&A workflows, and learner-facing educational AI experiences.",
    ats: "ATS Using Gemini is a multimodal resume-analysis project built with Streamlit and Gemini Pro Vision for match analysis and keyword feedback.",
  },
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(text) {
  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\[([^\]]+)\]\((\.\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/(^|[\s(>])((https?:\/\/)[^\s<]+)/g, (match, prefix, url) => {
      const trimmedUrl = url.replace(/[.,!?;:]+$/, "");
      const trailing = url.slice(trimmedUrl.length);
      return `${prefix}<a href="${trimmedUrl}" target="_blank" rel="noreferrer">${trimmedUrl}</a>${trailing}`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function markdownToHtml(markdown) {
  const safe = escapeHtml(markdown || "");
  const blocks = safe.split(/\n\s*\n/);

  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      const lines = trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
      const bulletLines = lines.filter((line) => /^[-*]\s+/.test(line));
      const numberedLines = lines.filter((line) => /^\d+\.\s+/.test(line));

      if (bulletLines.length === lines.length) {
        const items = lines
          .map((line) => line.replace(/^[-*]\s+/, ""))
          .map((line) => `<li>${renderInlineMarkdown(line)}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      if (numberedLines.length === lines.length) {
        const items = lines
          .map((line) => line.replace(/^\d+\.\s+/, ""))
          .map((line) => `<li>${renderInlineMarkdown(line)}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }

      return `<p>${renderInlineMarkdown(lines.join("<br/>"))}</p>`;
    })
    .join("");
}

function createMaayaMessage(role, content, useMarkdown = false) {
  if (!maayaChat) return;
  const bubble = document.createElement("div");
  bubble.className = `maaya-message ${role}`;
  if (useMarkdown) {
    bubble.innerHTML = markdownToHtml(content);
  } else {
    const paragraph = document.createElement("p");
    paragraph.textContent = content;
    bubble.appendChild(paragraph);
  }
  maayaChat.appendChild(bubble);
  maayaChat.scrollTop = maayaChat.scrollHeight;
  return bubble;
}

function setMaayaPresence(mode, label) {
  if (!maayaPresence) return;
  maayaPresence.textContent = label;
  maayaPresence.classList.toggle("is-local", mode === "local");
  maayaPresence.classList.toggle("is-live", mode === "live");
}

function createMaayaStatusMessage(content) {
  if (!maayaChat) return;
  const bubble = document.createElement("div");
  bubble.className = "maaya-message status";
  bubble.textContent = content;
  maayaChat.appendChild(bubble);
  maayaChat.scrollTop = maayaChat.scrollHeight;
  return bubble;
}

function loadMaayaHistory() {
  try {
    const stored = window.sessionStorage.getItem(MAAYA_MEMORY_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Unable to load Maaya chat history.", error);
    return [];
  }
}

function saveMaayaHistory(history) {
  try {
    window.sessionStorage.setItem(MAAYA_MEMORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn("Unable to save Maaya chat history.", error);
  }
}

let maayaHistory = loadMaayaHistory();

function appendMaayaHistory(role, content) {
  maayaHistory.push({ role, content });
  maayaHistory = maayaHistory.slice(-MAAYA_MAX_HISTORY_TURNS);
  saveMaayaHistory(maayaHistory);
}

function renderStoredMaayaHistory() {
  if (!maayaChat || maayaHistory.length === 0) return false;

  maayaHistory.forEach((entry) => {
    createMaayaMessage(entry.role, entry.content, entry.role === "bot");
  });

  return true;
}

function resetMaayaConversation() {
  maayaHistory = [];
  saveMaayaHistory(maayaHistory);
  if (maayaChat) {
    maayaChat.innerHTML = "";
  }

  const welcomeMessage = `Hi, I'm **Maaya**. Ask me anything about Sai Kiran's projects, skills, experience, or resume, and I'll guide you through it.`;
  createMaayaMessage("bot", welcomeMessage, true);
  appendMaayaHistory("bot", welcomeMessage);
  setMaayaPresence("live", "Live AI Ready");
}

function openMaaya() {
  if (!maayaDock) return;
  maayaDock.classList.add("open");
  maayaDock.setAttribute("aria-hidden", "false");
  if (maayaInput) {
    window.setTimeout(() => maayaInput.focus(), 120);
  }
  playModalOpenSound();
}

function closeMaaya() {
  if (!maayaDock) return;
  maayaDock.classList.remove("open");
  maayaDock.setAttribute("aria-hidden", "true");
  playModalCloseSound();
}

function normalizeQuestion(input) {
  return input.toLowerCase().replace(/[^\w\s+]/g, " ").replace(/\s+/g, " ").trim();
}

function findProjectLink(query) {
  const entries = Object.entries(maayaKnowledge.projectLinks);
  return entries.find(([name]) => query.includes(name));
}

function getRecentUserTopics() {
  return maayaHistory
    .filter((entry) => entry.role === "user")
    .slice(-3)
    .map((entry) => entry.content.trim())
    .filter(Boolean);
}

function getMaayaReply(question) {
  const q = normalizeQuestion(question);
  const recentTopics = getRecentUserTopics();

  if (!q) {
    return "Ask me about projects, skills, resume highlights, experience, healthcare AI work, or where to find a specific repo.";
  }

  if (/(hello|hi|hey|hellow)\b/.test(q)) {
    return "Hello! I'm Maaya. Ask me about Sai Kiran's projects, skills, experience, resume, or GitHub links, and I'll help you quickly.";
  }

  if (q.includes("how are you") || q.includes("what s up") || q.includes("whats up") || q.includes("are you there")) {
    return "I'm here and ready to help. You can ask me about Sai Kiran's projects, resume, skills, repo links, or learning journey.";
  }

  if (q.includes("remember") || q.includes("our convo") || q.includes("our conversation")) {
    if (recentTopics.length > 0) {
      return `Yes, in this session I remember recent topics like:

- ${recentTopics.join("\n- ")}

You can ask a follow-up like "tell me more about the last one".`;
    }

    return "I can remember the current chat session, but there is no strong earlier context in this session yet.";
  }

  if (q.includes("skill") || q.includes("tech stack") || q.includes("tools")) {
    return `His strongest skills are:

- **Generative AI**: RAG workflows, LLM apps, prompt design, multimodal systems
- **Core AI/ML**: Machine Learning, Deep Learning, NLP, Computer Vision
- **Tools**: Python, LangChain, Streamlit, FAISS, Gemini APIs, OCR pipelines
- **Problem Solving**: strong DSA depth with **700+ LeetCode solves**

If you want, I can also break this down by project or explain how he uses these skills in real builds.`;
  }

  if (q.includes("link") || q.includes("repo") || q.includes("github")) {
    const matchedProject = findProjectLink(q);
    if (matchedProject) {
      const [projectName, projectUrl] = matchedProject;
      return `Here is the direct repo link for **${projectName.replace(/\b\w/g, (char) => char.toUpperCase())}**:

- [Open Project](${projectUrl})`;
    }

    if (q.includes("profile") || q.includes("portfolio")) {
      return `Here are Sai Kiran's main profile links:

- [GitHub](${maayaKnowledge.links.github})
- [Portfolio](${maayaKnowledge.links.portfolio})
- [LinkedIn](${maayaKnowledge.links.linkedin})
- [LeetCode](${maayaKnowledge.links.leetcode})
- [Resume](${maayaKnowledge.links.resume})`;
    }

    if (q.includes("learning")) {
      return `Here are the learning repositories:

- [Generative AI Learning](${maayaKnowledge.links.genaiLearning})
- [AI Core Learning](${maayaKnowledge.links.aiCoreLearning})
- [MLOps and Deployment Learning](${maayaKnowledge.links.mlopsLearning})
- [Data Foundations](${maayaKnowledge.links.dataFoundations})
- [NLP Learning](${maayaKnowledge.links.nlpLearning})
- [DSA Learning](${maayaKnowledge.links.dsa})
- [Programming and Math Foundations](${maayaKnowledge.links.programmingMath})`;
    }

    return `Here are the main repository hubs:

- [GenAI Projects](${maayaKnowledge.links.genaiRepo})
- [ML Projects](${maayaKnowledge.links.mlRepo})
- [DL Projects](${maayaKnowledge.links.dlRepo})
- [CV Projects](${maayaKnowledge.links.cvRepo})
- [NLP Projects](${maayaKnowledge.links.nlpRepo})
- [Python Projects](${maayaKnowledge.links.pythonRepo})`;
  }

  if ((q.includes("cv") || q.includes("resume")) && (q.includes("project") || q.includes("link"))) {
    return `Here are some strong resume-aligned project links:

- [Blood Report Parsing IISc](${maayaKnowledge.projectLinks["blood report parsing iisc"]})
- [ATS Using Gemini](${maayaKnowledge.projectLinks["ats using gemini"]})
- [Sadhana GenAI Project](${maayaKnowledge.projectLinks["sadhana genai project"]})
- [Disease Diagnosis Dhanvantari](${maayaKnowledge.projectLinks["disease diagnosis dhanvantari"]})
- [Med Triage Agentic AI](${maayaKnowledge.projectLinks["med triage agentic ai"]})

Resume: [Open CV](${maayaKnowledge.links.resume})`;
  }

  if ((q.includes("project") || q.includes("projects")) && q.includes("link")) {
    return `Here are some major project links:

- [Blood Report Parsing IISc](${maayaKnowledge.projectLinks["blood report parsing iisc"]})
- [ATS Using Gemini](${maayaKnowledge.projectLinks["ats using gemini"]})
- [Sadhana GenAI Project](${maayaKnowledge.projectLinks["sadhana genai project"]})
- [AI News Generation](${maayaKnowledge.projectLinks["ai news generation"]})
- [WhatsApp Chat Analyser](${maayaKnowledge.projectLinks["whatsapp chat analyser"]})

If you want, I can also list project links by domain like GenAI, ML, CV, or NLP.`;
  }

  if (q.includes("resume") || q.includes("cv") || q.includes("achievement")) {
    return `Sai Kiran's resume highlights a strong GenAI profile with **Top 8 at IISc Bangalore OpenHack 2025**, **700+ LeetCode solves**, and strong work across healthcare AI, educational AI, multimodal resume analysis, and agentic workflows. Open it here: [Resume](${maayaKnowledge.links.resume}).`;
  }

  if (q.includes("experience") || q.includes("internship")) {
    return "He has internship experience as a Data Science Intern at NullClass Technologies and an AI Intern at Teachnook, alongside a strong self-driven portfolio of Generative AI and broader AI projects.";
  }

  if (q.includes("leetcode") || q.includes("dsa") || q.includes("problem solving")) {
    return `Sai Kiran has solved **700+ LeetCode problems** and is especially strong in arrays, graphs, trees, dynamic programming, and pattern-based problem solving. DSA repo: [DSA Learning](${maayaKnowledge.links.dsa}).`;
  }

  if (q.includes("blood") || q.includes("report parser") || q.includes("iisc")) {
    return `${maayaKnowledge.projects.blood} It is one of his strongest healthcare-AI portfolio pieces. Repo: [Blood Report Parsing IISc](${maayaKnowledge.links.genaiRepo}/tree/main/blood-report-parsing-iisc).`;
  }

  if (q.includes("healthcare") || q.includes("medical")) {
    return "His healthcare-focused GenAI work includes Blood Report Parsing IISc, Disease Diagnosis Dhanvantari, and Med Triage Agentic AI. Together they show interest in report parsing, diagnosis support, and healthcare assistant workflows.";
  }

  if (q.includes("sadhana") || q.includes("quiz") || q.includes("pdf chat")) {
    return `${maayaKnowledge.projects.sadhana} Repo: [Sadhana GenAI Project](${maayaKnowledge.links.genaiRepo}/tree/main/sadhana-gen-ai-project).`;
  }

  if (q.includes("ats") || q.includes("gemini") || q.includes("resume analysis")) {
    return `${maayaKnowledge.projects.ats} Repo: [ATS Using Gemini](${maayaKnowledge.links.genaiRepo}/tree/main/ats-using-gemini).`;
  }

  if (q.includes("genai") || q.includes("generative ai") || q.includes("best project") || q.includes("strongest project")) {
    return `His strongest GenAI portfolio signals are **Blood Report Parsing IISc**, **Sadhana GenAI Project**, **ATS Using Gemini**, **Med Triage Agentic AI**, and **Disease Diagnosis Dhanvantari**. Full collection: [GenAI Projects](${maayaKnowledge.links.genaiRepo}).`;
  }

  if (q.includes("contact") || q.includes("reach") || q.includes("linkedin") || q.includes("github")) {
    return `You can reach him through [LinkedIn](${maayaKnowledge.links.linkedin}), explore work on [GitHub](${maayaKnowledge.links.github}), check DSA depth on [LeetCode](${maayaKnowledge.links.leetcode}), or open the [resume](${maayaKnowledge.links.resume}).`;
  }

  if (q.includes("who are you") || q.includes("about") || q.includes("profile")) {
    return "Sai Kiran Patnana is an AI-focused builder working across Data Science, Machine Learning, Deep Learning, Computer Vision, NLP, and Generative AI, with a strong focus on hands-on project execution and polished presentation.";
  }

  return "Maaya's best quick summary: Sai Kiran is a project-driven AI builder with strong Generative AI momentum, healthcare-oriented experiments, solid DSA depth, and a portfolio built around RAG systems, multimodal apps, and agentic workflows. Ask about his projects, skills, resume, or experience.";
}

async function getLiveMaayaReply(question) {
  const historyForRequest = [...maayaHistory];
  const lastHistoryEntry = historyForRequest[historyForRequest.length - 1];
  if (lastHistoryEntry?.role === "user" && lastHistoryEntry.content === question) {
    historyForRequest.pop();
  }

  const payload = {
    question,
    profile: {
      name: "Sai Kiran Patnana",
      role: "AI Developer",
      portfolio: maayaKnowledge.links.portfolio,
      github: maayaKnowledge.links.github,
      resume: maayaKnowledge.links.resume,
      leetcode: maayaKnowledge.links.leetcode,
    },
    links: maayaKnowledge.links,
    project_links: maayaKnowledge.projectLinks,
    history: historyForRequest,
  };

  const response = await fetch(MAAYA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch (error) {
      errorBody = null;
    }

    const enrichedError = new Error(`Maaya API error: ${response.status}`);
    enrichedError.status = response.status;
    enrichedError.payload = errorBody;
    throw enrichedError;
  }

  const data = await response.json();
  return {
    answer: data.answer || "Maaya is online, but the response came back empty.",
    guardrail: data.guardrail || { action: "pass", rail: "none" },
    gateway: data.gateway || null,
  };
}

function formatGatewayLabel(gateway) {
  if (!gateway?.provider) return "Live AI Ready";
  const providerName = gateway.provider.charAt(0).toUpperCase() + gateway.provider.slice(1);
  return `Live AI: ${providerName}`;
}

function describeMaayaGateway(gateway) {
  if (!gateway?.attempts || gateway.attempts.length <= 1) return "";
  const failedProviders = gateway.attempts
    .filter((attempt) => attempt.status === "error")
    .map((attempt) => attempt.provider)
    .filter((provider, index, providers) => providers.indexOf(provider) === index);

  if (failedProviders.length === 0) return "";
  return `Maaya gateway recovered through ${gateway.provider} after ${failedProviders.join(", ")} was unavailable.`;
}

function describeMaayaGuardrail(guardrail) {
  if (!guardrail || guardrail.action === "pass") return "";

  const labels = {
    privacy: "Privacy rail protected a possible secret.",
    prompt_injection: "Instruction rail blocked a prompt override attempt.",
    safety: "Safety rail redirected an unsafe request.",
    topic: "Topic rail kept Maaya focused on Sai Kiran's portfolio.",
    length: "Length rail asked for a shorter question.",
  };

  return labels[guardrail.rail] || "Maaya guardrails handled this safely.";
}

async function handleMaayaQuestion(question) {
  const typingBubble = createMaayaMessage("bot", "Maaya is thinking...");

  try {
    const liveResult = await getLiveMaayaReply(question);
    const liveReply = liveResult.answer;
    const guardrailNote = describeMaayaGuardrail(liveResult.guardrail);
    const gatewayNote = describeMaayaGateway(liveResult.gateway);
    if (typingBubble) typingBubble.remove();
    setMaayaPresence("live", liveResult.guardrail?.action === "pass" ? formatGatewayLabel(liveResult.gateway) : "Guardrails Active");
    if (guardrailNote) {
      createMaayaStatusMessage(guardrailNote);
    }
    if (gatewayNote) {
      createMaayaStatusMessage(gatewayNote);
    }
    appendMaayaHistory("bot", liveReply);
    createMaayaMessage("bot", liveReply, true);
  } catch (error) {
    console.warn("Maaya API unavailable, using local fallback.", error);
    if (typingBubble) typingBubble.remove();
    setMaayaPresence("local", "Local Knowledge Mode");
    createMaayaStatusMessage("Maaya is waking up or the AI service is briefly busy, so local portfolio knowledge is being used for this reply.");
    createMaayaMessage(
      "bot",
      getMaayaReply(question),
      true
    );
    appendMaayaHistory(
      "bot",
      getMaayaReply(question)
    );
  }
}

if (maayaChat) {
  if (!renderStoredMaayaHistory()) {
    const welcomeMessage = `Hi, I'm **Maaya**. Ask me anything about Sai Kiran's projects, skills, experience, or resume, and I'll guide you through it.`;
    createMaayaMessage("bot", welcomeMessage, true);
    appendMaayaHistory("bot", welcomeMessage);
  }
}

setMaayaPresence("live", "Live AI Ready");

if (maayaFab) {
  maayaFab.addEventListener("click", openMaaya);
}

if (maayaOpen) {
  maayaOpen.addEventListener("click", openMaaya);
}

if (maayaClose) {
  maayaClose.addEventListener("click", closeMaaya);
}

if (maayaClear) {
  maayaClear.addEventListener("click", () => {
    resetMaayaConversation();
  });
}

maayaSuggestionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const question = button.dataset.maayaQuestion;
    createMaayaMessage("user", question);
    handleMaayaQuestion(question);
    openMaaya();
  });
});

if (maayaForm && maayaInput) {
  maayaForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = maayaInput.value.trim();
    if (!question) return;
    appendMaayaHistory("user", question);
    createMaayaMessage("user", question);
    maayaInput.value = "";
    handleMaayaQuestion(question);
  });
}

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
