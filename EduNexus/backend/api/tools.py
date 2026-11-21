from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..models.tables import User
from ..services import documents as D, llm
from .deps import current_user
from .library import need_text, own_doc

router = APIRouter(prefix="/api", tags=["tools"])
P = {
 "notes": "Create clear, well-organized study notes from the following content or topic.",
 "explain": "Explain this topic simply, step by step, with an example and an analogy.",
 "simplify": "Simplify this paragraph so a beginner can understand it. Keep the meaning.",
 "summary": "Summarize the following text concisely.",
 "flashcards": "Create 8 flashcards as 'Q:' and 'A:' pairs from the following.",
 "mcq": "Create 5 multiple-choice questions (A-D) with an answer key at the end.",
 "questions": "List 8 important exam questions with short model answers.",
 "definitions": "Extract key terms and give a clear definition for each.",
 "vocabulary": "List difficult vocabulary with simple meanings and an example sentence each.",
 "revision": "Create quick revision material: key points, important facts, and a 5-line recap.",
 "qa": "Generate 6 question-answer pairs covering the main ideas.",
 "grammar": "Correct grammar, spelling and punctuation. Keep meaning and style. Return only the corrected text.",
 "rewrite": "Rewrite the text to be clearer and more polished. Return only the result.",
 "expand": "Expand the text with more detail and examples. Return only the result.",
 "shorten": "Shorten the text, keeping key points. Return only the result.",
 "tone": "Rewrite the text in a {tone} tone. Return only the result.",
 "headings": "Suggest a title and section headings for this text.",
 "bullets": "Convert the text into concise bullet points."}

class ToolIn(BaseModel):
    kind: str
    text: str = Field("", max_length=8000)
    document_id: int | None = None          # use a document from My Library instead of (or with) typed text
    language: str = "auto"
    tone: str = "professional"
    model: str | None = None

@router.post("/tools")
def run_tool(b: ToolIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    if b.kind not in P: raise HTTPException(400, "Unknown tool.")
    content, task = b.text.strip(), P[b.kind].format(tone=b.tone)
    if b.document_id:
        d = own_doc(db, u, b.document_id)
        doc_text = D.sample(need_text(d), 3)
        content = (f"Focus / instruction from the user: {content}\n\n" if content else "") + f"DOCUMENT TEXT:\n{doc_text}"
        task += " " + llm.GROUND
    if not content: raise HTTPException(400, "Type some text or choose a document.")
    lang = llm.out_lang(u, b.language, b.text)
    return {"result": llm.run(task, content, lang, b.model), "language": lang}
