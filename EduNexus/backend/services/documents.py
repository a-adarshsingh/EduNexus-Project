import re
from pathlib import Path

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
MAX_BYTES = 15 * 1024 * 1024
ALLOWED = {"pdf", "docx", "txt"}

def extract(path: Path, ext: str) -> str:
    """Return readable text. Scanned PDFs return little/no text (OCR hook goes here later)."""
    if ext == "txt":
        return path.read_text(encoding="utf-8", errors="ignore")
    if ext == "pdf":
        from pypdf import PdfReader
        return "\n".join((p.extract_text() or "") for p in PdfReader(str(path)).pages)
    if ext == "docx":
        import zipfile
        import xml.etree.ElementTree as ET
        W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
        with zipfile.ZipFile(path) as z:
            root = ET.fromstring(z.read("word/document.xml"))
        return "\n".join("".join(t.text or "" for t in p.iter(W + "t")) for p in root.iter(W + "p"))
    raise ValueError("Unsupported type")

def chunk(text: str, size: int = 3000, overlap: int = 200) -> list[str]:
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    out, i = [], 0
    while i < len(text):
        out.append(text[i:i + size]); i += size - overlap
    return out or [""]

def top_chunks(text: str, query: str, k: int = 4) -> list[tuple[int, str]]:
    """Simple keyword-overlap retrieval; swap for embeddings/RAG later. Returns (chunk_index, text)."""
    chunks = chunk(text)
    q = set(re.findall(r"\w{3,}", query.lower()))
    scored = sorted(((len(q & set(re.findall(r"\w{3,}", c.lower()))), i) for i, c in enumerate(chunks)), reverse=True)
    idx = sorted(i for _, i in scored[:k])
    return [(i, chunks[i]) for i in idx]

def sample(text: str, n: int = 3) -> str:
    cs = chunk(text)
    step = max(1, len(cs) // n)
    return "\n\n".join(cs[::step][:n])
