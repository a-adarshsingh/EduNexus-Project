from collections import defaultdict
from datetime import datetime, timedelta
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..models.tables import Conversation, Document, StudySession, StudyTask, User
from .deps import current_user

router = APIRouter(prefix="/api", tags=["planner"])

class TaskIn(BaseModel):
    subject: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=200)
    due_date: datetime | None = None
    priority: Literal["low", "medium", "high"] = "medium"
    duration_min: int = Field(30, ge=1, le=600)

class TaskPatch(BaseModel):
    subject: str | None = None; title: str | None = None; due_date: datetime | None = None
    priority: Literal["low", "medium", "high"] | None = None
    duration_min: int | None = Field(None, ge=1, le=600); done: bool | None = None

def tdict(t: StudyTask) -> dict:
    return {"id": t.id, "subject": t.subject, "title": t.title, "due_date": t.due_date.isoformat() if t.due_date else None,
            "priority": t.priority, "duration_min": t.duration_min, "done": t.done}

def own_task(db, u, tid) -> StudyTask:
    t = db.get(StudyTask, tid)
    if not t or t.user_id != u.id: raise HTTPException(404, "Task not found.")
    return t

@router.get("/planner/tasks")
def tasks(upcoming: bool = False, u: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(StudyTask).where(StudyTask.user_id == u.id).limit(1000)).all()
    if upcoming:
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        rows = [t for t in rows if not t.done and (t.due_date is None or t.due_date >= today)]
    rows.sort(key=lambda t: (t.due_date is None, t.due_date or datetime.max))
    return [tdict(t) for t in (rows[:6] if upcoming else rows)]

@router.post("/planner/tasks", status_code=201)
def add_task(b: TaskIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    t = StudyTask(user_id=u.id, **b.model_dump()); db.add(t); db.commit(); return tdict(t)

@router.patch("/planner/tasks/{tid}")
def patch_task(tid: int, b: TaskPatch, u: User = Depends(current_user), db: Session = Depends(get_db)):
    t = own_task(db, u, tid)
    for k, v in b.model_dump(exclude_unset=True).items(): setattr(t, k, v)
    db.commit(); return tdict(t)

@router.delete("/planner/tasks/{tid}", status_code=204)
def del_task(tid: int, u: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(own_task(db, u, tid)); db.commit()

class SessionIn(BaseModel):
    subject: str | None = None
    minutes: int = Field(ge=1, le=600)

@router.post("/planner/sessions", status_code=201)
def add_session(b: SessionIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    db.add(StudySession(user_id=u.id, subject=b.subject, minutes=b.minutes)); db.commit()
    return {"ok": True}

@router.get("/analytics")
def analytics(u: User = Depends(current_user), db: Session = Depends(get_db)):
    sess = db.scalars(select(StudySession).where(StudySession.user_id == u.id)).all()
    tasks_ = db.scalars(select(StudyTask).where(StudyTask.user_id == u.id)).all()
    by_day, subj = defaultdict(int), defaultdict(lambda: [0, 0])
    for s in sess:
        by_day[s.created_at.date()] += s.minutes
        subj[s.subject or "General"][0] += s.minutes
    for t in tasks_:
        if t.done: subj[t.subject][1] += 1
    today = datetime.utcnow().date()
    days = lambda n: [today - timedelta(days=i) for i in range(n - 1, -1, -1)]
    mk = lambda d: {"date": d.isoformat(), "label": d.strftime("%a"), "minutes": by_day[d]}
    cnt = lambda m: db.scalar(select(func.count()).select_from(m).where(m.user_id == u.id))
    return {"total_minutes": sum(s.minutes for s in sess), "tasks_total": len(tasks_),
            "tasks_done": sum(t.done for t in tasks_), "documents": cnt(Document), "ai_sessions": cnt(Conversation),
            "daily": [mk(d) for d in days(7)], "monthly": [mk(d) for d in days(30)],
            "subjects": [{"subject": k, "minutes": v[0], "tasks_done": v[1]} for k, v in subj.items()]}
