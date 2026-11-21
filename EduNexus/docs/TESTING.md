# Testing - what was actually run

| Area | How | Result |
|---|---|---|
| Language detection incl. Bengali, Marathi, Hindi, Tamil, Spanish, Hinglish, explicit override | pytest | PASS |
| Wrong-language answers are translated into the question's language (English reply to a Bengali question is fixed) | pytest (AI mocked) | PASS |
| Register, login, duplicate email, "No account" / "Wrong password" messages, email trimming, protected routes | pytest | PASS |
| Per-user privacy for chats, documents, tasks, tools on documents | pytest | PASS |
| Library upload (TXT, DOCX), invalid type, summarize/ask/generate | pytest (AI mocked) | PASS |
| Study Tools using an uploaded/library document | pytest | PASS |
| Feedback: submit, validation (1-5), my feedback, admin view with ADMIN_KEY | pytest | PASS |
| Planner, analytics, profile/theme update | pytest | PASS |
| Frontend TypeScript check + production build | `npm run build` | PASS |
| Render-style start (`python app.py` with PORT), page refresh on /library and /feedback, `uvicorn app:app` | live smoke test | PASS |
| Postgres URL conversion (`postgres://` -> `postgresql+psycopg://`) | unit check | PASS |

Total: 5 backend tests pass.

## Not tested here (please test on your side)
- Live calls to Gemini / Groq / OpenRouter / keyless endpoints (this environment cannot reach them) - add your free key and check Settings -> AI engine.
- A real Postgres database on Render/Neon.
- Microphone and speech in your browser; layout in a real browser.
