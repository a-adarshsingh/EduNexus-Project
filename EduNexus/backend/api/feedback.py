import hmac, json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..core import config
from ..database.session import get_db
from ..models.tables import Feedback, User
from .deps import current_user

router = APIRouter(prefix="/api", tags=["feedback"])
QUESTIONS = {"ease", "language", "design", "library", "voice", "tools", "speed"}

class FeedbackIn(BaseModel):
    overall: int = Field(ge=1, le=5)
    ratings: dict[str, int] = {}
    liked: str = Field("", max_length=2000)
    wrong: str = Field("", max_length=2000)
    improve: str = Field("", max_length=2000)
    ideas: str = Field("", max_length=2000)
    comments: str = Field("", max_length=2000)
    @field_validator("ratings")
    @classmethod
    def check(cls, v):
        for k, n in v.items():
            if k not in QUESTIONS or not 1 <= n <= 5: raise ValueError("Invalid rating")
        return v

def out(f: Feedback, user: User | None = None) -> dict:
    d = {"id": f.id, "overall": f.overall, "ratings": json.loads(f.ratings or "{}"), "liked": f.liked, "wrong": f.wrong,
         "improve": f.improve, "ideas": f.ideas, "comments": f.comments, "created_at": f.created_at.isoformat()}
    if user: d.update(name=user.full_name, email=user.email)
    return d

@router.post("/feedback", status_code=201)
def send(b: FeedbackIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    f = Feedback(user_id=u.id, overall=b.overall, ratings=json.dumps(b.ratings), liked=b.liked.strip() or None,
                 wrong=b.wrong.strip() or None, improve=b.improve.strip() or None, ideas=b.ideas.strip() or None,
                 comments=b.comments.strip() or None)
    db.add(f); db.commit(); return out(f)

@router.get("/feedback/mine")
def mine(u: User = Depends(current_user), db: Session = Depends(get_db)):
    return [out(f) for f in db.scalars(select(Feedback).where(Feedback.user_id == u.id).order_by(Feedback.id.desc()))]

@router.get("/admin/feedback")
def all_feedback(key: str = "", db: Session = Depends(get_db)):
    """Developer view: /api/admin/feedback?key=YOUR_ADMIN_KEY (set ADMIN_KEY in the environment)."""
    if not config.ADMIN_KEY or not hmac.compare_digest(key, config.ADMIN_KEY):
        raise HTTPException(404, "Not found")
    rows = db.execute(select(Feedback, User).join(User, User.id == Feedback.user_id).order_by(Feedback.id.desc())).all()
    return [out(f, usr) for f, usr in rows]
