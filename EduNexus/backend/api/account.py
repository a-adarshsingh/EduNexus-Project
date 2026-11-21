from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..core.security import hash_password, verify_password
from ..database.session import get_db
from ..models.tables import Conversation, Message, User
from ..services.language import NAMES
from .auth import Profession, public
from .deps import current_user

router = APIRouter(prefix="/api", tags=["account"])

class ProfileIn(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=120)
    profession: Profession | None = None
    course: str | None = Field(None, min_length=1, max_length=160)
    institution: str | None = None
    interests: str | None = None
    interface_language: str | None = None
    response_language: str | None = None
    theme: Literal["light", "dark"] | None = None

@router.patch("/auth/profile")
def profile(b: ProfileIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    data = b.model_dump(exclude_unset=True)
    if data.get("interface_language") not in (None, *NAMES): raise HTTPException(400, "Unsupported language.")
    if data.get("response_language") not in (None, "auto", *NAMES): raise HTTPException(400, "Unsupported language.")
    for k, v in data.items():
        if v is not None: setattr(u, k, v)
    db.commit(); return public(u)

class PwIn(BaseModel):
    current: str
    new: str = Field(min_length=8, max_length=128)

@router.post("/auth/password")
def password(b: PwIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    if not verify_password(b.current, u.password_hash): raise HTTPException(400, "Current password is incorrect.")
    u.password_hash = hash_password(b.new); db.commit(); return {"ok": True}

@router.delete("/data/chats", status_code=204)
def clear_chats(u: User = Depends(current_user), db: Session = Depends(get_db)):
    for c in db.scalars(select(Conversation).where(Conversation.user_id == u.id)).all():
        for m in db.scalars(select(Message).where(Message.conversation_id == c.id)): db.delete(m)
        db.delete(c)
    db.commit()
