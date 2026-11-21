import os, secrets, warnings
from dotenv import load_dotenv
load_dotenv()

def _env(key: str, default: str = "") -> str:
    return (os.getenv(key) or default).strip()

SECRET_KEY = _env("SECRET_KEY")
if not SECRET_KEY:
    warnings.warn("SECRET_KEY not set: using a temporary key, so everyone is logged out on every restart. Set SECRET_KEY.")
    SECRET_KEY = secrets.token_urlsafe(48)

DATABASE_URL = _env("DATABASE_URL", "sqlite:///./edunexus.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgres://"):]
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]
IS_SQLITE = DATABASE_URL.startswith("sqlite")
ON_RENDER = bool(os.getenv("RENDER"))
if ON_RENDER and IS_SQLITE:
    warnings.warn("Running on Render with SQLite: Render's free disk is temporary, so accounts and data are LOST on every "
                  "restart or redeploy. Set DATABASE_URL to a free Postgres database.")

TOKEN_EXPIRE_MINUTES = int(_env("TOKEN_EXPIRE_MINUTES", "43200"))  # 30 days

# --- AI engines (any one is enough; they are tried in this order) ---
AI_PROVIDER = _env("AI_PROVIDER", "auto").lower()       # auto | gemini | groq | openrouter | ollama | free
GEMINI_API_KEY = _env("GEMINI_API_KEY")
GEMINI_MODEL = _env("GEMINI_MODEL", "gemini-2.5-flash")
GROQ_API_KEY = _env("GROQ_API_KEY")
GROQ_MODEL = _env("GROQ_MODEL", "llama-3.3-70b-versatile")
OPENROUTER_API_KEY = _env("OPENROUTER_API_KEY")
OPENROUTER_MODEL = _env("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
OLLAMA_URL = _env("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = _env("DEFAULT_MODEL", "llama3.2")        # Ollama model name (optional)

ADMIN_KEY = _env("ADMIN_KEY")                            # lets you read all feedback
