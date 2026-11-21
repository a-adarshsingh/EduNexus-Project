import re, uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from pathlib import Path
from ..database.session import get_db
from ..models.tables import Document, GeneratedResource, User
from ..services import documents as D, llm
from .deps import current_user

router = APIRouter(prefix="/api/library", tags=["library"])

def own_doc(db: Session, u: User, did: int) -> Document:
    d = db.get(Document, did)
    if not d or d.user_id != u.id:
        raise HTTPException(404, "Document not found.")
    return d

def need_text(d: Document) -> str:
    if d.status == "needs_ocr":
        raise HTTPException(422, "This looks like a scanned PDF. OCR is required to read it (OCR is not installed yet).")
    if not d.text or d.status != "ready":
        raise HTTPException(422, "No readable text could be extracted from this document.")
    return d.text

def card(d: Document, full=False) -> dict:
    r = {"id": d.id, "filename": d.filename, "file_type": d.file_type, "size_bytes": d.size_bytes,
         "category": d.category, "status": d.status, "created_at": d.created_at.isoformat(),
         "summary": d.summary}
    if full:
        r["text"] = (d.text or "")[:8000]; r["text_length"] = len(d.text or "")
    return r

@router.post("/upload", status_code=201)
async def upload(file: UploadFile = File(...), category: str = Form("General"),
                 u: User = Depends(current_user), db: Session = Depends(get_db)):
    name = re.sub(r"[^\w.\- ]", "_", Path(file.filename or "file").name)[:120]
    ext = Path(name).suffix.lower().lstrip(".")
    if ext not in D.ALLOWED:
        raise HTTPException(400, "Only PDF, DOCX and TXT files are allowed.")
    data = await file.read()
    if not data: raise HTTPException(400, "The file is empty.")
    if len(data) > D.MAX_BYTES: raise HTTPException(413, "File too large (max 15 MB).")
    D.UPLOAD_DIR.mkdir(exist_ok=True)
    stored = f"{u.id}_{uuid.uuid4().hex}.{ext}"
    path = D.UPLOAD_DIR / stored
    path.write_bytes(data)
    try:
        text = D.extract(path, ext)
        status = "ready" if len(text.strip()) >= 30 else ("needs_ocr" if ext == "pdf" else "empty")
    except Exception:
        text, status = "", "failed"
    d = Document(user_id=u.id, filename=name, stored_name=stored, file_type=ext, size_bytes=len(data),
                 category=category.strip()[:80] or "General", status=status, text=text)
    db.add(d); db.commit()
    return card(d)

@router.get("")
def list_docs(q: str = "", type: str = "", u: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Document).where(Document.user_id == u.id).order_by(Document.id.desc())).all()
    if type: rows = [d for d in rows if d.file_type == type]
    if q: rows = [d for d in rows if q.lower() in d.filename.lower() or q.lower() in d.category.lower()]
    return [card(d) for d in rows]

@router.get("/{did}")
def get_doc(did: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    return card(own_doc(db, u, did), full=True)

class PatchIn(BaseModel):
    filename: str | None = Field(None, min_length=1, max_length=120)
    category: str | None = Field(None, max_length=80)

@router.patch("/{did}")
def patch_doc(did: int, b: PatchIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    d = own_doc(db, u, did)
    if b.filename: d.filename = re.sub(r"[^\w.\- ]", "_", b.filename)
    if b.category is not None: d.category = b.category or "General"
    db.commit(); return card(d)

@router.delete("/{did}", status_code=204)
def delete_doc(did: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    d = own_doc(db, u, did)
    (D.UPLOAD_DIR / d.stored_name).unlink(missing_ok=True)
    for r in db.scalars(select(GeneratedResource).where(GeneratedResource.document_id == did)): db.delete(r)
    db.delete(d); db.commit()

class SumIn(BaseModel):
    mode: str = "medium"
    language: str = "auto"
    model: str | None = None

SPEC = {"short": "Write a short summary of 3-4 sentences.",
        "medium": "Write a medium summary of about 2 paragraphs.",
        "detailed": "Write a detailed summary with section-wise summaries."}

@router.post("/{did}/summarize")
def summarize(did: int, b: SumIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    d = own_doc(db, u, did); text = need_text(d)
    lang = llm.out_lang(u, b.language)
    chunks = D.chunk(text)[:12]
    material = chunks[0] if len(chunks) == 1 else "\n\n".join(
        llm.run("Summarize this part of a document in 4-6 bullet points. " + llm.GROUND, c, lang, b.model) for c in chunks)
    out = llm.run(f"{SPEC.get(b.mode, SPEC['medium'])} First state what the document is actually about and its purpose, "
                  f"then the main topic and key points as bullets, and important headings and difficult terms. {llm.GROUND}",
                  material, lang, b.model)
    d.summary = out
    db.add(GeneratedResource(user_id=u.id, document_id=d.id, kind=f"summary_{b.mode}", language=lang, content=out))
    db.commit()
    return {"summary": out, "language": lang, "chunks_used": len(chunks)}

class AskIn(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    model: str | None = None

@router.post("/{did}/ask")
def ask(did: int, b: AskIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    d = own_doc(db, u, did); text = need_text(d)
    from ..services import language
    lang = language.resolve(b.question, u.response_language)
    parts = D.top_chunks(text, b.question)
    ctx = "\n\n".join(f"[Part {i + 1}]\n{c}" for i, c in parts)
    ans = llm.run(f"Answer the question using the document parts below. {llm.GROUND}\nQuestion: {b.question}", ctx, lang, b.model)
    return {"answer": ans, "language": lang, "sources": [i + 1 for i, _ in parts]}

KINDS = {"notes": "Create revision notes.", "flashcards": "Create 10 flashcards as Q: and A: pairs.",
         "mcq": "Create 6 multiple-choice questions (A-D) with an answer key at the end.",
         "questions": "List 8 important questions with short answers.",
         "definitions": "Explain the difficult terms with simple definitions.",
         "headings": "List the important headings/sections with a one-line summary each.",
         "sections": "Write a section-wise summary."}

class GenIn(BaseModel):
    kind: str
    language: str = "auto"
    model: str | None = None

@router.post("/{did}/generate")
def generate(did: int, b: GenIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    d = own_doc(db, u, did); text = need_text(d)
    if b.kind not in KINDS: raise HTTPException(400, "Unknown resource type.")
    lang = llm.out_lang(u, b.language)
    out = llm.run(f"{KINDS[b.kind]} {llm.GROUND}", D.sample(text), lang, b.model)
    db.add(GeneratedResource(user_id=u.id, document_id=d.id, kind=b.kind, language=lang, content=out)); db.commit()
    return {"content": out, "language": lang}
