from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..models.tables import Conversation, Document, Message, User
from ..services import documents as D
from ..services import engine, language, llm, ollama
from .deps import current_user

router = APIRouter(prefix="/api", tags=["chat"])

class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: int | None = None
    model: str | None = None
    document_id: int | None = None

class RenameIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)

def owned_conv(db: Session, user: User, cid: int) -> Conversation:
    c = db.get(Conversation, cid)
    if not c or c.user_id != user.id:
        raise HTTPException(404, "Conversation not found.")
    return c

@router.get("/models")
def models(_: User = Depends(current_user)):
    return engine.status()

@router.get("/conversations")
def conversations(u: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Conversation).where(Conversation.user_id == u.id).order_by(Conversation.id.desc()))
    return [{"id": c.id, "title": c.title} for c in rows]

@router.get("/conversations/{cid}")
def messages(cid: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    owned_conv(db, u, cid)
    rows = db.scalars(select(Message).where(Message.conversation_id == cid).order_by(Message.id))
    return [{"role": m.role, "content": m.content, "language": m.language} for m in rows]

@router.delete("/conversations/{cid}", status_code=204)
def delete_conv(cid: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    c = owned_conv(db, u, cid)
    for m in db.scalars(select(Message).where(Message.conversation_id == cid)): db.delete(m)
    db.delete(c); db.commit()

@router.post("/chat")
def chat(b: ChatIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    conv = owned_conv(db, u, b.conversation_id) if b.conversation_id else None
    history, prev = [], None
    if conv:
        rows = db.scalars(select(Message).where(Message.conversation_id == conv.id)
                          .order_by(Message.id.desc()).limit(10)).all()[::-1]
        history = [{"role": m.role, "content": m.content} for m in rows]
        prev = next((m.language for m in reversed(rows) if m.role == "assistant"), None)
    lang = language.resolve(b.message, u.response_language, prev)
    system = f"{ollama.TUTOR} {language.instruction(lang)}"
    if b.document_id:
        d = db.get(Document, b.document_id)
        if not d or d.user_id != u.id: raise HTTPException(404, "Document not found.")
        if not d.text or d.status != "ready": raise HTTPException(422, "This document has no readable text.")
        ctx = "\n\n".join(c for _, c in D.top_chunks(d.text, b.message))
        system += f" Answer from this document only; say so if it lacks the information.\nDOCUMENT:\n{ctx}"
    reply = engine.chat(b.model, [{"role": "system", "content": system}, *history,
                                  {"role": "user", "content": f"{b.message}\n\n{language.reminder(lang)}"}])
    reply = llm.fix_language(reply, lang, b.model)
    if not conv:
        conv = Conversation(user_id=u.id, title=b.message[:40]); db.add(conv); db.flush()
    db.add_all([Message(conversation_id=conv.id, role="user", content=b.message, language=lang),
                Message(conversation_id=conv.id, role="assistant", content=reply, language=lang)])
    db.commit()
    return {"conversation_id": conv.id, "reply": reply, "language": lang}

@router.patch("/conversations/{cid}")
def rename_conv(cid: int, b: RenameIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    c = owned_conv(db, u, cid); c.title = b.title.strip(); db.commit()
    return {"id": c.id, "title": c.title}
