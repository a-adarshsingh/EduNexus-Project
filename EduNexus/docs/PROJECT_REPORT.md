# EduNexus - Major Project Documentation
**Title:** EduNexus - Your Personal AI Learning & Productivity Workspace

## 1. Abstract
EduNexus is a local-first web application combining an AI tutor, a private document library, a document summarizer, study tools, a writing studio, a study planner and analytics. It runs on a personal computer using Ollama, so data stays on the machine.

## 2. Problem statement
Learners use separate tools for notes, documents, planning and AI help, and most AI tools answer mainly in English. EduNexus offers one workspace that answers in the learner's own language.

## 3. Objectives
Multilingual AI tutoring with automatic language detection; document understanding grounded in the source; voice interaction; study planning with real analytics; privacy through local models and per-user data.

## 4. Technology
React, TypeScript, Vite, Tailwind CSS, Framer Motion (frontend); FastAPI, SQLAlchemy, Pydantic (backend); SQLite; Ollama; pypdf and python-docx; Web Speech API; bcrypt and JWT.

## 5. Design
Four design foundations: light dashboard, dark dashboard, colourful AI orb, Smart My Library. Diagrams are in ARCHITECTURE.md.

## 6. Modules
Authentication; language detection; Learning Assistant; Voice Assistant; Library; Summarizer; Study Tools; Writing Studio; Planner; Analytics; Settings.

## 7. Security
bcrypt hashing, signed tokens, ownership checks on every record, upload type/size validation, safe stored file names, secrets only in `.env`.

## 8. Testing
See TESTING.md.

## 9. Limitations
OCR not implemented; keyword retrieval instead of embeddings; no migration tool yet (tables are created at start-up); summaries are synchronous; voice depends on browser support.

## 10. Future scope
OCR, embeddings-based RAG with citations, more languages and voice engines, cloud backup, collaborative classrooms, mobile app, recommendations, other model providers.
