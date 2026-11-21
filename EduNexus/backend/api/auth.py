from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..core.security import hash_password, verify_password, make_token
from ..database.session import get_db
from ..models.tables import User
from .deps import current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])
Profession = Literal["Student", "Teacher", "Professor", "Researcher", "Writer", "Working Professional", "Other"]

class RegisterIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str
    profession: Profession
    course: str = Field(min_length=1, max_length=160)
    institution: str | None = None
    interests: str | None = None
    interface_language: str = "en"
    @field_validator("email", mode="before")
    @classmethod
    def trim(cls, v):
        return v.strip() if isinstance(v, str) else v
    @model_validator(mode="after")
    def match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self

class LoginIn(BaseModel):
    email: EmailStr
    password: str
    @field_validator("email", mode="before")
    @classmethod
    def trim(cls, v):
        return v.strip() if isinstance(v, str) else v

def public(u: User) -> dict:
    return {"id": u.id, "email": u.email, "full_name": u.full_name, "profession": u.profession,
            "course": u.course, "institution": u.institution, "interface_language": u.interface_language,
            "response_language": u.response_language, "theme": u.theme}

@router.post("/register", status_code=201)
def register(b: RegisterIn, db: Session = Depends(get_db)):
    email = b.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "An account with this email already exists.")
    u = User(email=email, password_hash=hash_password(b.password), full_name=b.full_name.strip(),
             profession=b.profession, course=b.course.strip(), institution=b.institution,
             interests=b.interests, interface_language=b.interface_language)
    db.add(u); db.commit()
    return {"token": make_token(u.id), "user": public(u)}

@router.post("/login")
def login(b: LoginIn, db: Session = Depends(get_db)):
    u = db.scalar(select(User).where(User.email == b.email.lower()))
    if not u:
        raise HTTPException(401, "No account found with this email. Please create a new account first.")
    if not verify_password(b.password, u.password_hash):
        raise HTTPException(401, "Wrong password. Please try again.")
    return {"token": make_token(u.id), "user": public(u)}

@router.get("/me")
def me(u: User = Depends(current_user)):
    return public(u)
