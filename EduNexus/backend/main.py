from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.session import init_db
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from .api import auth, chat, library, tools, planner, account, feedback
from .core import config
from .services import engine

app = FastAPI(title="EduNexus API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://localhost:8000"],
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
for r in (chat, library, tools, planner, account, feedback): app.include_router(r.router)

@app.on_event("startup")
def startup(): init_db()

@app.get("/api/health")
def health():
    return {"status": "ok", "persistent_database": (not config.IS_SQLITE) or (not config.ON_RENDER),
            "ai": engine.status()["provider"]}

# Serve the built React app (frontend/dist) from the same server, with a fallback to index.html
# so that refreshing or opening links like /library or /feedback works.
from fastapi import HTTPException
from fastapi.responses import FileResponse
_dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if _dist.exists():
    if (_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=_dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(404, "Not found")
        f = (_dist / path).resolve()
        if path and f.is_file() and _dist.resolve() in f.parents:
            return FileResponse(f)
        return FileResponse(_dist / "index.html")
