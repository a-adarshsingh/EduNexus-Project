"""EduNexus - single entry point.

Run locally:      python app.py            (opens http://localhost:8000)
Run on Render:    python app.py            (uses the PORT that Render gives; no browser is opened)
Or with uvicorn:  uvicorn app:app --host 0.0.0.0 --port $PORT
"""
import os, shutil, subprocess, sys, threading, time, webbrowser
from pathlib import Path

os.environ.setdefault("DISABLE_SQLALCHEMY_CEXT_RUNTIME", "1")   # pure-Python SQLAlchemy (avoids files Windows may block)
ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))
HOSTED = bool(os.getenv("RENDER") or os.getenv("PORT"))        # running on a server such as Render
PORT = int(os.getenv("PORT", "8000"))

def __getattr__(name):                                          # lets "uvicorn app:app" work
    if name == "app":
        from backend.main import app
        return app
    raise AttributeError(name)

def check_packages():
    if sys.version_info >= (3, 14):
        print("WARNING: Python %d.%d is very new and some packages may not work. Use Python 3.12." % sys.version_info[:2])
    try:
        import fastapi, uvicorn, sqlalchemy, jwt, httpx, pypdf, multipart  # noqa
        import backend.main  # noqa  (loads everything once so a real error shows here)
    except Exception as e:
        sys.exit(f"\nCould not load a required package: {type(e).__name__}: {e}\n"
                 "Install the packages with:  python -m pip install -r backend/requirements.txt\n"
                 "(On Windows you can simply double-click START_EDUNEXUS.bat)\n")

def build_frontend():
    if (ROOT / "frontend" / "dist" / "index.html").exists():
        return
    npm = shutil.which("npm")
    if not npm:
        sys.exit("\nThe built frontend (frontend/dist) is missing and Node.js is not installed.\n"
                 "Install Node.js LTS from https://nodejs.org, or upload the project including the frontend/dist folder.\n")
    print("Building the frontend (1-2 minutes)...")
    fe = ROOT / "frontend"
    for cmd in ([npm, "install", "--no-audit", "--no-fund"], [npm, "run", "build"]):
        if subprocess.run(cmd, cwd=fe, shell=(os.name == "nt")).returncode != 0:
            sys.exit("\nFrontend build failed. See the messages above.\n")

def open_browser():
    time.sleep(2)
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == "__main__":
    check_packages()
    build_frontend()
    from backend.core import config
    from backend.services import engine
    print("AI engine:", engine.status()["note"])
    if not HOSTED and not (ROOT / ".env").exists():
        print("Note: no .env file. Copy .env.example to .env and set SECRET_KEY, and add a free GEMINI_API_KEY.")
    if config.ON_RENDER and config.IS_SQLITE:
        print("WARNING: SQLite on Render is temporary. Set DATABASE_URL to a free Postgres database or accounts will disappear.")
    host = "0.0.0.0" if HOSTED else "127.0.0.1"
    print(f"\nEduNexus is running on port {PORT}  (press Ctrl+C to stop)\n")
    if not HOSTED:
        threading.Thread(target=open_browser, daemon=True).start()
    import uvicorn
    uvicorn.run("backend.main:app", host=host, port=PORT)
