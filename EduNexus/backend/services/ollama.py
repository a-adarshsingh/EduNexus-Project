import httpx
from fastapi import HTTPException
from ..core import config

def list_models() -> list[str]:
    try:
        r = httpx.get(f"{config.OLLAMA_URL}/api/tags", timeout=5)
        r.raise_for_status()
        return [m["name"] for m in r.json().get("models", [])]
    except httpx.HTTPError:
        raise HTTPException(503, "Ollama is not reachable. Start it with 'ollama serve'.")

def chat(model: str | None, messages: list[dict]) -> str:
    installed = list_models()
    if not installed:
        raise HTTPException(503, "No Ollama models installed. Run: ollama pull llama3.2")
    if not model:
        model = next((m for m in installed if m.startswith(config.DEFAULT_MODEL)), installed[0])
    if model not in installed:
        raise HTTPException(404, f"Model '{model}' is not installed.")
    try:
        r = httpx.post(f"{config.OLLAMA_URL}/api/chat", timeout=180,
                       json={"model": model, "messages": messages, "stream": False,
                             "options": {"num_ctx": 4096}})
        r.raise_for_status()
        return r.json()["message"]["content"]
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Ollama request failed: {e}")

TUTOR = ("You are EduNexus, a patient AI tutor. Teach, don't just answer: explain step by step, "
         "give a simple example or analogy, and end with a short check-for-understanding question when useful.")
