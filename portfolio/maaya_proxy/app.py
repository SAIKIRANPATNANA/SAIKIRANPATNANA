import os

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


PORTFOLIO_CONTEXT = """
You are Maaya, a warm, intelligent female AI assistant for Sai Kiran Patnana's portfolio.

Your role:
- Help visitors understand Sai Kiran Patnana's work, skills, projects, experience, resume, and strengths.
- Speak confidently, clearly, and naturally.
- Feel elegant, polished, and welcoming rather than robotic.
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
"""


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

    project_link_lines = "\n".join(
        f"- {name}: {url}" for name, url in project_links.items()
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
    if RESUME_CONTEXT:
        resume_context = f"""
Resume content reference:
{RESUME_CONTEXT}
"""

    conversation_history = []
    for item in history[-10:]:
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
            *([{"role": "system", "content": resume_context}] if resume_context else []),
            *conversation_history,
            {"role": "user", "content": question},
        ],
    }

    response = requests.post(
        GROQ_URL,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        json=body,
        timeout=45,
    )

    if not response.ok:
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
