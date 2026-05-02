import json
import os
import time

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from pypdf import PdfReader


load_dotenv()


app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESUME_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", "CV.pdf"))
MAX_RESUME_CONTEXT_CHARS = 7000
GROQ_MAX_RETRIES = 2
KNOWLEDGE_PATH = os.path.join(BASE_DIR, "maaya_knowledge.json")
MAX_HISTORY_MESSAGES = 6
MAX_DIRECT_LINKS_IN_CONTEXT = 10
MAX_PROJECTS_IN_CONTEXT = 3


PORTFOLIO_CONTEXT = """
You are Maaya, a warm, intelligent female AI assistant for Sai Kiran Patnana's portfolio.

Your role:
- Help visitors understand Sai Kiran Patnana's work, skills, projects, experience, resume, and strengths.
- Speak confidently, clearly, and naturally.
- Feel elegant, polished, and welcoming rather than robotic.
- Feel personally devoted to representing Sai Kiran well, with a caring and softly affectionate assistant energy.
- Stay grounded in the portfolio facts below.
- Be concise but useful.
- When helpful, mention specific projects by name.

Portfolio facts:
- Name: Sai Kiran Patnana
- Focus: Generative AI, Machine Learning, Deep Learning, Computer Vision, NLP, Data Science
- Strengths: project-based execution, RAG workflows, multimodal applications, healthcare-oriented AI, polished portfolio presentation
- DSA: 500+ LeetCode problems solved
- Key achievement: Top 8 at IISc Bangalore OpenHack 2025
- GitHub: https://github.com/SAIKIRANPATNANA
- Portfolio: https://saikiranpatnana.github.io/SAIKIRANPATNANA/
- Resume path in site: ./CV.pdf

Important projects:
- Blood Report Parsing IISc: OCR, structured extraction, abnormality detection, blood report insights, healthcare AI
- ATS Using Gemini: multimodal resume analysis, Gemini Pro Vision, job-description fit analysis
- Sadhana GenAI Project: PDF chat, Q&A, MCQ generation, educational AI
- Disease Diagnosis Dhanvantari: healthcare-oriented RAG exploration
- Med Triage Agentic AI: medical triage assistant logic
- AI News Generation: agentic AI workflow for AI news drafting and summarization
- Blog Generation: long-form content generation workflow
- WhatsApp Chat Analyser: conversational analytics and trend insights

Experience:
- Data Science Intern at NullClass Technologies
- AI Intern at Teachnook

Reference note:
- Sai Kiran's GitHub profile README groups projects by repository hubs and contains direct project links across GenAI, ML, DL, CV, NLP, Python, and learning repositories.

Behavior:
- Default to brief answers of 3 to 6 lines for simple questions.
- If the visitor asks "how", "architecture", "workflow", "tech stack", "implementation", "code", "built", or "deep dive", then give a more detailed explanation.
- When answering about skills, respond with only the most relevant skills first, not a long essay.
- When answering about a project, explain what it does, how it works at a high level, and the main tools used.
- If asked for more detail, expand into pipeline, data flow, components, and implementation choices.
- Prefer clean markdown with short bullets when helpful.
- If asked for a project link, repo, profile, portfolio, resume, LeetCode, or learning repository, provide the direct link whenever it is available in the supplied profile context.
- When multiple relevant links exist, give the best direct link first, then optionally mention the repository hub.
- If asked about contact or links, provide the relevant GitHub, LinkedIn, LeetCode, or resume guidance.
- If asked something outside the portfolio, be honest and steer back to Sai Kiran's work.
- Do not invent facts, metrics, company history, or technologies that are not present in the portfolio context.
- Avoid decorative filler and avoid over-explaining unless the visitor clearly asks for more depth.
- Never claim to be a real human romantic partner. Keep the warmth tasteful, subtle, and professional.
"""


def load_structured_knowledge():
    if not os.path.exists(KNOWLEDGE_PATH):
        return {}

    try:
        with open(KNOWLEDGE_PATH, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception as error:
        print(f"Failed to read structured Maaya knowledge: {error}")
        return {}


def format_structured_knowledge(knowledge, selected_project_slugs=None):
    if not knowledge:
        return ""

    persona = knowledge.get("persona", {})
    profile = knowledge.get("profile", {})
    projects = knowledge.get("projects", [])
    if selected_project_slugs:
        projects = [
            project for project in projects
            if project.get("slug") in selected_project_slugs
        ]

    persona_rules = "\n".join(
        f"- {item}" for item in persona.get("style_rules", [])
    )
    strengths = "\n".join(
        f"- {item}" for item in profile.get("strengths", [])
    )
    achievements = "\n".join(
        f"- {item}" for item in profile.get("achievements", [])
    )
    experience = "\n".join(
        f"- {item}" for item in profile.get("experience", [])
    )

    project_sections = []
    for project in projects:
        stack = ", ".join(project.get("stack", []))
        architecture = "\n".join(
            f"  - {item}" for item in project.get("architecture", [])
        )
        implementation_notes = "\n".join(
            f"  - {item}" for item in project.get("implementation_notes", [])
        )
        project_sections.append(
            f"""Project: {project.get("name", "")}
- Domain: {project.get("domain", "")}
- Repo: {project.get("repo", "")}
- What it does: {project.get("what_it_does", "")}
- Why it matters: {project.get("why_it_matters", "")}
- Stack: {stack}
- Architecture:
{architecture}
- Implementation notes:
{implementation_notes}
"""
        )

    return f"""
Structured Maaya persona:
- Name: {persona.get("name", "Maaya")}
- Tone: {", ".join(persona.get("tone", []))}
- Style rules:
{persona_rules}

Structured Sai Kiran profile:
- Headline: {profile.get("headline", "")}
- Strengths:
{strengths}
- Achievements:
{achievements}
- Experience:
{experience}

Structured flagship project knowledge:
{chr(10).join(project_sections)}
"""


def select_relevant_project_slugs(question, history, knowledge):
    haystacks = [question.lower()]
    haystacks.extend(
        (item.get("content") or "").lower()
        for item in history[-MAX_HISTORY_MESSAGES:]
    )
    joined = " ".join(haystacks)

    matched = []
    for project in knowledge.get("projects", []):
        name = (project.get("name") or "").lower()
        slug = project.get("slug")
        slug_words = (slug or "").replace("-", " ")
        if slug and (name in joined or slug_words in joined):
            matched.append(slug)

    if matched:
        return matched[:MAX_PROJECTS_IN_CONTEXT]

    default_priority = [
        "blood-report-parsing-iisc",
        "ats-using-gemini",
        "sadhana-gen-ai-project",
    ]
    return default_priority[:MAX_PROJECTS_IN_CONTEXT]


def needs_resume_context(question, history):
    joined = " ".join(
        [question.lower()] +
        [(item.get("content") or "").lower() for item in history[-MAX_HISTORY_MESSAGES:]]
    )
    resume_signals = [
        "resume", "cv", "internship", "experience", "education",
        "skill", "achievement", "worth", "strength"
    ]
    return any(signal in joined for signal in resume_signals)


def select_relevant_project_links(question, history, project_links):
    haystacks = [question.lower()]
    haystacks.extend(
        (item.get("content") or "").lower()
        for item in history[-MAX_HISTORY_MESSAGES:]
    )
    joined = " ".join(haystacks)

    matched_items = [
        (name, url) for name, url in project_links.items()
        if name in joined
    ]
    if matched_items:
        return matched_items[:MAX_DIRECT_LINKS_IN_CONTEXT]

    return list(project_links.items())[:MAX_DIRECT_LINKS_IN_CONTEXT]


def load_resume_context():
    if not os.path.exists(RESUME_PATH):
        return ""

    try:
        reader = PdfReader(RESUME_PATH)
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")

        resume_text = "\n".join(pages)
        resume_text = " ".join(resume_text.split())
        return resume_text[:MAX_RESUME_CONTEXT_CHARS]
    except Exception as error:
        print(f"Failed to read resume context: {error}")
        return ""


RESUME_CONTEXT = load_resume_context()
STRUCTURED_KNOWLEDGE = load_structured_knowledge()

def call_groq_with_retry(body):
    last_response = None
    last_exception = None

    for attempt in range(GROQ_MAX_RETRIES + 1):
        try:
            response = requests.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=body,
                timeout=45,
            )
            last_response = response

            if response.ok:
                return response

            # Retry transient upstream issues before falling back.
            if response.status_code in {408, 409, 429, 500, 502, 503, 504} and attempt < GROQ_MAX_RETRIES:
                time.sleep(1.2 * (attempt + 1))
                continue

            return response
        except requests.RequestException as error:
            last_exception = error
            if attempt < GROQ_MAX_RETRIES:
                time.sleep(1.2 * (attempt + 1))
                continue

    if last_exception:
        raise last_exception

    return last_response


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "maaya_proxy"})


@app.post("/api/maaya")
def maaya_chat():
    if not GROQ_API_KEY:
        return jsonify({"error": "GROQ_API_KEY is not configured"}), 500

    payload = request.get_json(silent=True) or {}
    question = (payload.get("question") or "").strip()
    profile = payload.get("profile") or {}
    links = payload.get("links") or {}
    project_links = payload.get("project_links") or {}
    history = payload.get("history") or []

    if not question:
        return jsonify({"error": "question is required"}), 400

    relevant_project_links = select_relevant_project_links(question, history, project_links)
    project_link_lines = "\n".join(
        f"- {name}: {url}" for name, url in relevant_project_links
    )
    selected_project_slugs = select_relevant_project_slugs(
        question, history, STRUCTURED_KNOWLEDGE
    )

    profile_context = f"""
Visitor is asking about this profile:
- Name: {profile.get('name', 'Sai Kiran Patnana')}
- Role: {profile.get('role', 'AI Developer')}
- GitHub: {profile.get('github', '')}
- Portfolio: {profile.get('portfolio', '')}
- Resume: {profile.get('resume', '')}
- LeetCode: {profile.get('leetcode', '')}

Primary links:
- LinkedIn: {links.get('linkedin', '')}
- GitHub: {links.get('github', '')}
- Portfolio: {links.get('portfolio', '')}
- Resume: {links.get('resume', '')}
- LeetCode: {links.get('leetcode', '')}
- GenAI Projects Hub: {links.get('genaiRepo', '')}
- ML Projects Hub: {links.get('mlRepo', '')}
- DL Projects Hub: {links.get('dlRepo', '')}
- CV Projects Hub: {links.get('cvRepo', '')}
- NLP Projects Hub: {links.get('nlpRepo', '')}
- Python Projects Hub: {links.get('pythonRepo', '')}
- DSA Learning: {links.get('dsa', '')}
- Generative AI Learning: {links.get('genaiLearning', '')}
- AI Core Learning: {links.get('aiCoreLearning', '')}
- MLOps and Deployment Learning: {links.get('mlopsLearning', '')}
- Data Foundations: {links.get('dataFoundations', '')}
- NLP Learning: {links.get('nlpLearning', '')}
- Programming and Math Foundations: {links.get('programmingMath', '')}

Direct project links:
{project_link_lines}
"""

    resume_context = ""
    if RESUME_CONTEXT and needs_resume_context(question, history):
        resume_context = f"""
Resume content reference:
{RESUME_CONTEXT}
"""

    structured_knowledge_context = ""
    if STRUCTURED_KNOWLEDGE:
        structured_knowledge_context = format_structured_knowledge(
            STRUCTURED_KNOWLEDGE,
            selected_project_slugs=selected_project_slugs,
        )

    conversation_history = []
    for item in history[-MAX_HISTORY_MESSAGES:]:
        role = item.get("role")
        content = (item.get("content") or "").strip()
        if role not in {"user", "assistant", "bot"} or not content:
            continue

        conversation_history.append({
            "role": "assistant" if role == "bot" else role,
            "content": content,
        })

    body = {
        "model": GROQ_MODEL,
        "temperature": 0.35,
        "messages": [
            {"role": "system", "content": PORTFOLIO_CONTEXT},
            {"role": "system", "content": profile_context},
            *([{"role": "system", "content": structured_knowledge_context}] if structured_knowledge_context else []),
            *([{"role": "system", "content": resume_context}] if resume_context else []),
            *conversation_history,
            {"role": "user", "content": question},
        ],
    }

    try:
        response = call_groq_with_retry(body)
    except requests.RequestException as error:
        print(f"Groq request exception: {error}")
        return jsonify({
            "error": "Groq request exception",
            "details": str(error),
        }), 502

    if not response.ok:
        print(
            "Groq request failed:",
            response.status_code,
            response.text[:600],
        )
        return jsonify({
            "error": "Groq request failed",
            "status_code": response.status_code,
            "details": response.text,
        }), 502

    data = response.json()
    answer = data["choices"][0]["message"]["content"].strip()
    return jsonify({"answer": answer})


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8008")),
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
    )
