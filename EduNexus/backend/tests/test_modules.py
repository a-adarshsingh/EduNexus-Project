import os, tempfile
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/m.db"
from fastapi.testclient import TestClient
from backend.main import app
import backend.services.engine as engine

def reg(c, email):
    r = c.post("/api/auth/register", json=dict(full_name="U One", email=email, password="password123",
               confirm_password="password123", profession="Student", course="BSc"))
    return {"Authorization": "Bearer " + r.json()["token"]}

def test_library_planner_privacy(monkeypatch):
    def fake(m, msgs):
        if "Translate the following" in msgs[-1]["content"]: return "यह हिंदी अनुवाद है। MOCK Hindi"
        return "MOCK:" + msgs[0]["content"]
    monkeypatch.setattr(engine, "chat", fake)
    with TestClient(app) as c:
        h1, h2 = reg(c, "x@y.com"), reg(c, "z@y.com")
        txt = ("Photosynthesis is the process by which plants convert light into chemical energy. " * 5).encode()
        d = c.post("/api/library/upload", files={"file": ("bio.txt", txt)}, headers=h1).json()
        assert d["status"] == "ready"
        assert c.post("/api/library/upload", files={"file": ("a.exe", b"x")}, headers=h1).status_code == 400
        assert c.get(f"/api/library/{d['id']}", headers=h2).status_code == 404       # privacy
        assert c.get("/api/library", headers=h2).json() == []
        s = c.post(f"/api/library/{d['id']}/summarize", json={"mode": "short", "language": "hi"}, headers=h1).json()
        assert "Hindi" in s["summary"] and s["language"] == "hi"                       # language passed to model
        a = c.post(f"/api/library/{d['id']}/ask", json={"question": "प्रकाश संश्लेषण क्या है?"}, headers=h1).json()
        assert a["language"] == "hi" and a["sources"]
        g = c.post(f"/api/library/{d['id']}/generate", json={"kind": "mcq"}, headers=h1)
        assert g.status_code == 200
        t = c.post("/api/planner/tasks", json={"subject": "Bio", "title": "Read ch1", "due_date": "2030-01-01"}, headers=h1).json()
        assert c.patch(f"/api/planner/tasks/{t['id']}", json={"done": True}, headers=h2).status_code == 404
        assert c.patch(f"/api/planner/tasks/{t['id']}", json={"done": True}, headers=h1).json()["done"] is True
        c.post("/api/planner/sessions", json={"subject": "Bio", "minutes": 25}, headers=h1)
        an = c.get("/api/analytics", headers=h1).json()
        assert an["total_minutes"] == 25 and an["tasks_done"] == 1 and an["documents"] == 1
        assert c.get("/api/analytics", headers=h2).json()["total_minutes"] == 0
        r = c.post("/api/tools", json={"kind": "grammar", "text": "he go school"}, headers=h1).json()
        assert r["result"].startswith("MOCK")
        rd = c.post("/api/tools", json={"kind": "notes", "document_id": d["id"]}, headers=h1)   # tool on a library document
        assert rd.status_code == 200
        assert c.post("/api/tools", json={"kind": "notes", "document_id": d["id"]}, headers=h2).status_code == 404
        assert c.post("/api/tools", json={"kind": "notes"}, headers=h1).status_code == 400
        assert c.patch("/api/auth/profile", json={"theme": "dark", "interface_language": "ur"}, headers=h1).json()["theme"] == "dark"
        assert c.delete(f"/api/library/{d['id']}", headers=h1).status_code == 204

def test_docx_without_extra_libs():
    import io, zipfile
    W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    body = "".join(f"<w:p><w:r><w:t>{t}</w:t></w:r></w:p>" for t in
                   ["Photosynthesis converts light into chemical energy in plants.", "Chlorophyll absorbs red and blue light."])
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("word/document.xml", f'<w:document xmlns:w="{W}"><w:body>{body}</w:body></w:document>')
    with TestClient(app) as c:
        h = reg(c, "docx@y.com")
        d = c.post("/api/library/upload", files={"file": ("n.docx", buf.getvalue())}, headers=h).json()
        assert d["status"] == "ready"
        assert "Chlorophyll" in c.get(f"/api/library/{d['id']}", headers=h).json()["text"]


def test_reply_language_enforced_and_feedback(monkeypatch):
    calls = []
    def fake(model, msgs):
        calls.append(msgs[-1]["content"])
        return "আলোকসংশ্লেষণ হল একটি প্রক্রিয়া।" if "Translate the following" in msgs[-1]["content"] else "Photosynthesis is a process."
    monkeypatch.setattr(engine, "chat", fake)
    from backend.core import config
    monkeypatch.setattr(config, "ADMIN_KEY", "secret-admin")
    with TestClient(app) as c:
        h = reg(c, "bn@y.com")
        r = c.post("/api/chat", json={"message": "আলোকসংশ্লেষণ কী?"}, headers=h).json()
        assert r["language"] == "bn" and r["reply"].startswith("আলোক") and len(calls) == 2   # English answer was translated
        ok = c.post("/api/feedback", json={"overall": 4, "ratings": {"ease": 5, "design": 4}, "wrong": "Nothing", "ideas": "Dark mode"}, headers=h)
        assert ok.status_code == 201
        assert c.post("/api/feedback", json={"overall": 6}, headers=h).status_code == 422
        assert c.post("/api/feedback", json={"overall": 3, "ratings": {"bogus": 3}}, headers=h).status_code == 422
        assert len(c.get("/api/feedback/mine", headers=h).json()) == 1
        assert c.get("/api/admin/feedback?key=wrong").status_code == 404
        assert c.get("/api/admin/feedback?key=secret-admin").json()[0]["email"] == "bn@y.com"
        assert c.get("/api/models", headers=h).json()["provider"] in ("free", "ollama", "gemini", "groq", "openrouter")
