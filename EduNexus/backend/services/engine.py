"""One place that talks to an AI model. Tries, in order: Gemini, Groq, OpenRouter (free API keys),
then a local Ollama (if running), then keyless free endpoints (best effort)."""
import time
import httpx
from fastapi import HTTPException
from ..core import config
from . import ollama

KEYLESS = [  # best-effort public endpoints that need no key (availability can change)
    ("pollinations", "https://text.pollinations.ai/openai", "openai"),
    ("ovhcloud", "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions", "Meta-Llama-3_3-70B-Instruct"),
]

def keyed() -> list[tuple[str, str, str, str]]:
    want = lambda n: config.AI_PROVIDER in ("auto", n)
    out = []
    if config.GEMINI_API_KEY and want("gemini"):
        out.append(("gemini", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", config.GEMINI_API_KEY, config.GEMINI_MODEL))
    if config.GROQ_API_KEY and want("groq"):
        out.append(("groq", "https://api.groq.com/openai/v1/chat/completions", config.GROQ_API_KEY, config.GROQ_MODEL))
    if config.OPENROUTER_API_KEY and want("openrouter"):
        out.append(("openrouter", "https://openrouter.ai/api/v1/chat/completions", config.OPENROUTER_API_KEY, config.OPENROUTER_MODEL))
    return out

def _openai_chat(url: str, key: str, model: str, messages: list[dict], timeout: int = 70) -> str:
    headers = {"Content-Type": "application/json"}
    if key: headers["Authorization"] = f"Bearer {key}"
    r = httpx.post(url, headers=headers, json={"model": model, "messages": messages, "temperature": 0.4}, timeout=timeout)
    if r.status_code >= 400:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:140]}")
    text = (r.json()["choices"][0]["message"].get("content") or "").strip()
    if not text: raise RuntimeError("empty answer")
    return text

_ol_cache = {"t": 0.0, "ok": False}
def ollama_up() -> bool:
    if time.time() - _ol_cache["t"] > 30:
        try: httpx.get(f"{config.OLLAMA_URL}/api/tags", timeout=1.5).raise_for_status(); _ol_cache["ok"] = True
        except Exception: _ol_cache["ok"] = False
        _ol_cache["t"] = time.time()
    return _ol_cache["ok"]

def chat(model: str | None, messages: list[dict]) -> str:
    errors = []
    for name, url, key, mdl in keyed():
        try: return _openai_chat(url, key, mdl, messages)
        except Exception as e: errors.append(f"{name}: {e}")
    if config.AI_PROVIDER in ("auto", "ollama") and ollama_up():
        try: return ollama.chat(model, messages)
        except Exception as e: errors.append(f"ollama: {getattr(e, 'detail', e)}")
    if config.AI_PROVIDER in ("auto", "free"):
        for name, url, mdl in KEYLESS:
            try: return _openai_chat(url, "", mdl, messages, timeout=60)
            except Exception as e: errors.append(f"{name}: {e}")
    hint = ("No working AI engine. Add a free key: set GEMINI_API_KEY (https://aistudio.google.com/apikey) or "
            "GROQ_API_KEY (https://console.groq.com/keys) in your environment settings.")
    raise HTTPException(503, hint + (" Details: " + " | ".join(errors)[:300] if errors else ""))

def status() -> dict:
    k = keyed()
    if k: return {"provider": k[0][0], "models": [k[0][3]], "note": "Using " + ", ".join(f"{n} ({m})" for n, _, _, m in k)}
    if config.AI_PROVIDER in ("auto", "ollama") and ollama_up():
        try: return {"provider": "ollama", "models": ollama.list_models(), "note": "Using local Ollama"}
        except Exception: pass
    return {"provider": "free", "models": ["Free AI (no key)"],
            "note": "No API key set. Using free keyless backup (may be slow or limited). For reliable answers add GEMINI_API_KEY (free)."}
