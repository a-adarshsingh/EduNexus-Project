# EduNexus - Architecture, ER diagram, workflow

## 1. System architecture
```mermaid
flowchart LR
  B[Browser: React + TS + Tailwind + Framer Motion] -->|REST /api, JWT| A[FastAPI]
  B -->|Web Speech API| V[(Mic / Speaker)]
  A --> S1[Auth + Account]
  A --> S2[Chat + Language detector]
  A --> S3[Library + Summarizer]
  A --> S4[Tools / Writing]
  A --> S5[Planner + Analytics]
  S2 & S3 & S4 --> O[Ollama local API :11434]
  S1 & S2 & S3 & S5 --> D[(SQLite via SQLAlchemy)]
  S3 --> F[uploads/ files]
```
Layers: `api/` (routes + validation), `services/` (language, ollama, llm, documents), `models/` (ORM), `core/` (config, security), `database/` (session).

## 2. ER diagram
```mermaid
erDiagram
  USERS ||--o{ DOCUMENTS : owns
  USERS ||--o{ CONVERSATIONS : owns
  CONVERSATIONS ||--o{ MESSAGES : has
  USERS ||--o{ STUDY_TASKS : plans
  USERS ||--o{ STUDY_SESSIONS : logs
  USERS ||--o{ GENERATED_RESOURCES : saves
  DOCUMENTS ||--o{ GENERATED_RESOURCES : produces
  USERS { int id PK string email UK string password_hash string full_name string profession string course string interface_language string response_language string theme }
  DOCUMENTS { int id PK int user_id FK string filename string stored_name string file_type string status text text text summary }
  CONVERSATIONS { int id PK int user_id FK string title }
  MESSAGES { int id PK int conversation_id FK string role text content string language }
  STUDY_TASKS { int id PK int user_id FK string subject string title datetime due_date string priority int duration_min bool done }
  STUDY_SESSIONS { int id PK int user_id FK string subject int minutes }
  GENERATED_RESOURCES { int id PK int user_id FK int document_id FK string kind string language text content }
```
User preferences (interface language, response language, theme) are columns on `users`.

## 3. Automatic response-language flow
```mermaid
flowchart TD
  M[User message] --> E{Explicit request? e.g. 'explain in English'}
  E -- yes --> L[Use requested language]
  E -- no --> P{Manual response language set?}
  P -- yes --> L
  P -- no --> D[Detect script / Roman-Hindi words / ES / FR]
  D -->|confident| L
  D -->|short and unsure| PR[Reuse previous reply language]
  PR --> L
  L --> SYS[System prompt: Reply entirely in X] --> O[Ollama]
```

## 4. User workflow
```mermaid
flowchart LR
  R[Register] --> LG[Login] --> DB[Dashboard]
  DB --> AS[Ask AI by text or voice] & LB[Upload to Library] & PL[Plan tasks]
  LB --> OP[Open document] --> SM[Summary / Notes / Flashcards / MCQ / Ask]
  PL --> TM[Study timer] --> AN[Analytics]
```

## 5. Future scope (extension points)
- OCR: `services/documents.extract()` (documents with status `needs_ocr`).
- RAG with citations: replace `documents.top_chunks()` with embeddings; `/ask` already returns source part numbers.
- Other AI providers: `services/ollama.chat()` is the single model entry point.
- Cloud sync / classrooms: all rows are keyed by `user_id`.
