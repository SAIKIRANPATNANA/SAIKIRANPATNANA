# Maaya Groq Proxy

This is the backend proxy for Maaya, the AI portfolio assistant.

## Why this exists

The portfolio is a static GitHub Pages site, so the Groq API key must not be exposed in frontend JavaScript. This proxy safely keeps the key on the server side and forwards portfolio-aware chat requests to Groq.

## How GitHub Pages will work with Maaya

GitHub Pages hosts only the frontend.

Flow:
1. Visitor opens `https://saikiranpatnana.github.io/SAIKIRANPATNANA/`
2. The Maaya widget in the page sends chat requests to a deployed backend URL
3. That backend runs this Python proxy
4. The proxy uses `GROQ_API_KEY` on the server side and calls Groq
5. The answer comes back to the portfolio chat UI

So:
- GitHub Pages hosts `index.html`, `styles.css`, and `script.js`
- Render or Railway hosts `app.py`
- The Groq key stays only in backend environment variables

## Local setup

1. Create a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Export the variables from `.env.example`:

```bash
export GROQ_API_KEY="your_groq_api_key"
export GROQ_MODEL="llama-3.1-8b-instant"
export PORT="8008"
```

Keep the real key in a local `.env` or exported shell variable only. Do not commit it to Git.

If you prefer `.env`, create:

```bash
cp .env.example .env
```

Then fill in your real `GROQ_API_KEY`. The app now loads `.env` automatically.

4. Run the server:

```bash
python app.py
```

## Local test flow

1. Start the backend from `portfolio/maaya_proxy`
2. Open the portfolio locally
3. Click the Maaya icon and ask a question
4. If the proxy is running and the key is valid, you will get live Groq responses
5. If not, the widget falls back to local portfolio knowledge

## Local endpoint

- Health: `http://127.0.0.1:8008/health`
- Chat: `http://127.0.0.1:8008/api/maaya`

## Production deployment for GitHub Pages

This repo now includes [render.yaml](/home/user/Documents/SAIKIRANPATNANA/portfolio/maaya_proxy/render.yaml) so you can deploy the backend on Render more easily.

### Option 1: Render

1. Push this repo to GitHub.
2. Go to Render and create a new Web Service from your GitHub repo.
3. Use root directory:

```text
portfolio/maaya_proxy
```

4. Set environment variables in Render:

```text
GROQ_API_KEY=your_real_key
GROQ_MODEL=llama-3.1-8b-instant
```

Do not manually set `PORT` on Render. Render provides that automatically.

5. Deploy.
6. Copy the deployed URL, for example:

```text
https://maaya-groq-proxy.onrender.com
```

7. In [index.html](/home/user/Documents/SAIKIRANPATNANA/portfolio/index.html), replace the current localhost value with:

```html
<script>
  window.MAAYA_API_URL = "https://maaya-groq-proxy.onrender.com/api/maaya";
</script>
```

8. Push the portfolio again.

After that, your GitHub Pages site will call the Render backend and Maaya will work live.

Note:
- `GET /health` should return JSON
- `GET /` returning `404` is okay because the backend does not define a homepage route

## Important security note

Do not put the Groq API key into:
- `index.html`
- `script.js`
- any tracked `.env` file
- GitHub Pages secrets expecting frontend JS to read them directly

GitHub Pages cannot securely hide a frontend-exposed API key. The backend proxy is required.
