# EduNexus - Your Personal AI Learning & Productivity Workspace
React + TypeScript + Tailwind frontend, FastAPI backend, SQLite or Postgres database, free hosted AI (Gemini / Groq / OpenRouter) with optional local Ollama.

Everything starts from one file: **`app.py`**.

## Run on your PC (Windows 11)
Double-click `START_EDUNEXUS.bat` (it installs Python 3.12 + packages the first time), or:
```
python -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
copy .env.example .env     (set SECRET_KEY, add a free GEMINI_API_KEY)
python app.py
```
Open http://localhost:8000. The built frontend is included (`frontend/dist`), so Node.js is not needed.

## Free AI (no Ollama needed)
Add ONE free key to `.env` (or to Render's Environment tab). Engines are tried in this order and fall back automatically:
1. `GEMINI_API_KEY` (https://aistudio.google.com/apikey) - best for Indian languages
2. `GROQ_API_KEY` (https://console.groq.com/keys)
3. `OPENROUTER_API_KEY` (https://openrouter.ai/keys)
4. Local Ollama, only if it is running
5. Keyless public endpoints (best effort, may be slow or limited)

Settings -> "AI engine" shows which one is active. Free tiers have rate limits; adding two keys gives automatic backup.

## Deploy on Render (free)
1. Put this project on GitHub (keep `frontend/dist` in the repo; do NOT commit `.env`).
2. Render -> New -> Web Service -> pick the repo (or use "Blueprint" with `render.yaml`).
   - Build command: `pip install -r backend/requirements.txt`
   - Start command: `python app.py`
3. Environment tab - add:
   - `PYTHON_VERSION` = `3.12.8`
   - `SECRET_KEY` = a long random text (keep it fixed, otherwise everyone is logged out on each restart)
   - `GEMINI_API_KEY` = your free key
   - `DATABASE_URL` = a free Postgres URL (see below)
   - optional `ADMIN_KEY` = a secret word to read feedback
4. Deploy, open your Render URL, register, and check Settings -> AI engine.

### Important: why accounts/passwords disappeared on Render
Render's free web service has a **temporary disk**. A SQLite file is deleted whenever the service restarts, redeploys or spins down after 15 idle minutes, so your account no longer exists and login says the password is wrong. Fix: set `DATABASE_URL` to a Postgres database (for example a free Neon or Supabase project, or Render Postgres). Note: Render's own free Postgres expires after 30 days, so Neon/Supabase free plans are better for a long-lived demo (check their current free terms).
`https://YOUR-SITE/api/health` shows `"persistent_database": true` when this is set correctly.

## Reading user feedback
Set `ADMIN_KEY`, then open `https://YOUR-SITE/api/admin/feedback?key=YOUR_ADMIN_KEY` (JSON list with ratings, name and email).

## Tests
`python -m pip install -r backend/requirements-dev.txt` then `python -m pytest -q backend/tests`

## Docs
`docs/ARCHITECTURE.md`, `docs/USER_MANUAL.md`, `docs/TESTING.md`, `docs/PROJECT_REPORT.md`.
