# Pinteq Intel — API & Schema Reference

> **Purpose:** Single source of truth aligning the `pinteq-interface` (FastAPI backend, port 8000) with the `pinteq-intel` (React reporting frontend, port 5174).  
> **Covers:** SQLite schema tables, API route contracts, which frontend components consume each endpoint, and integration gaps.

---

## 1. Database Schema (`pinteq_pipeline.db`)

The intel backend connects to a single SQLite database whose path is resolved relative to the repo root:

```
pinteq-interface/routers/intel.py → ../pinteq-intake/pinteq_pipeline.db
```

### 1.1 Tables queried by the intel API

| Table | Columns (key ones) | Queried By | Purpose |
|---|---|---|---|
| `intake_files` | `intake_id`, `original_filename`, `normalized_filename`, `file_category`, `document_subtype`, `processing_status`, `metadata_json` (TEXT — JSON blob), `created_at`, `matter_id` | `/timeline`, `/network`, `/evidence-gaps`, `/witnesses`, `/search` | Central file registry. `metadata_json` stores AI-extracted entities as `{"entities": {"suspects": [...], "witnesses": [...], "charges": [...]}}` |
| `communications` | `id`, `intake_id` (FK), `source_entity`, `target_entity`, `interaction_time` (ISO 8601), `duration_seconds` (int), `type` | `/network` | Time-series interaction records extracted from CDRs, call logs, DMs. Populated by AI post-processor. |

### 1.2 Tables defined but **not yet queried** by intel API

| Table | Relevant Columns | Potential Use | Frontend Need |
|---|---|---|---|
| `phone_records` | `record_id`, `intake_id`, `party_number`, `contact_number`, `direction`, `duration_seconds`, `timestamp`, `message_content`, `platform`, `record_type` | Raw CDR data before entity extraction | **Phone Analysis** workspace (currently placeholder) |
| `extracted_text` | `text_id`, `intake_id`, `full_text`, `page_count`, `language`, `word_count` | Full-text search across OCR output | **Evidence Search** tool could use this instead of scanning `metadata_json` |
| `entities` | `entity_id`, `matter_id`, `source_intake_id`, `entity_type`, `entity_value`, `context_snippet`, `confidence` | Structured entity store (alternative to parsing `metadata_json`) | All entity-dependent workspaces |
| `police_reports` | `report_id`, `intake_id`, `case_id`, `incident_date`, `report_type`, `reporting_officer`, `report_number` | Rich police report metadata | **Prosecution Timeline Deconstruction** workspace |
| `intake_batches` | `batch_id`, `matter_id`, `source_type`, `batch_date`, `file_count` | Case-level aggregation | **Dashboard** stats |
| `known_contacts` | `contact_id`, `matter_id`, `full_name`, `role`, `phone_numbers`, `addresses` | Entity enrichment | **Contact Graph** labeling |

---

## 2. API Endpoints (`/api/intel/*`)

All intel endpoints are registered in `routers/intel.py` and mounted in `main.py`:

```python
app.include_router(intel.router, prefix="/api/intel", tags=["intel"])
```

---

### 2.1 `GET /api/intel/timeline?case_id=default`

**Purpose:** Returns aggregated start/end events for the Recharts Gantt chart.

**Query params:** `case_id` (string, optional, defaults to `"default"`)

**Response shape:**

```json
{
  "case_id": "default",
  "timeline": [
    {
      "event": "filename.pdf",
      "start": 1700000000,
      "end": 1700003600,
      "category": "forensic",
      "flag": null
    }
  ]
}
```

**SQL source:**

```sql
SELECT normalized_filename, created_at, file_category
FROM intake_files
ORDER BY created_at ASC
```

**Frontend consumer:** `TimelineWorkspace.tsx` → calls `fetchTimelineData()` from `lib/interfaceApi.ts`

**Notes:** Uses `created_at` (file ingestion time), not document date. Duration defaults to 1 hour. The `flag` field is always null — no critical/gap flagging is implemented.

---

### 2.2 `GET /api/intel/network?case_id=default`

**Purpose:** Returns nodes + links for the D3 force-directed graph, enriched with timestamp/duration metadata from the `communications` table.

**Query params:** `case_id` (string, optional, defaults to `"default"`)

**Response shape:**

```json
{
  "case_id": "default",
  "nodes": [
    {
      "id": "John Doe",
      "group": 1,
      "connections": 3,
      "role": "suspect"
    }
  ],
  "links": [
    {
      "source": "John Doe",
      "target": "Jane Smith",
      "value": 1,
      "timestamp": "2023-10-25T14:30:00Z",
      "duration": 120
    }
  ]
}
```

**SQL source:**

```sql
SELECT c.source_entity, c.target_entity, c.interaction_time,
       c.duration_seconds, c.type
FROM communications c
ORDER BY c.interaction_time ASC
```

Then enriched with entity roles from `intake_files.metadata_json -> entities -> suspects/witnesses`.

**Frontend consumer:** `ContactGraphWorkspace.tsx` → calls `fetchNetworkData()` from `lib/interfaceApi.ts`

**Notes:**
- Each node has `id`, `group` (1=suspect, 2=witness), `connections` (degree count), `role` ("person", "suspect", "witness")
- Each link has optional `timestamp` and `duration` fields — present when the communications table has non-null values
- The ContactGraphWorkspace already has a **Time Frame** filter dropdown (All Time / Last 30 Days / Pre-Incident / Post-Incident) and a **Min Interactions** slider — both are ready to consume these fields

---

### 2.3 `GET /api/intel/evidence-gaps?case_id=default`

**Purpose:** Returns dynamic evidence gap distribution and a registry of issues.

**Query params:** `case_id` (string, optional, defaults to `"default"`)

**Response shape:**

```json
{
  "case_id": "default",
  "distribution": [
    { "category": "Processed Documents", "strong": 10, "weak": 5, "suspect": 0 },
    { "category": "Unprocessed/Gaps", "strong": 0, "weak": 3, "suspect": 0 }
  ],
  "registry": [
    {
      "category": "Processing Backlog",
      "issue": "3 files are still pending or missing OCR.",
      "source": "Intake Pipeline",
      "impact": "HIGH"
    }
  ]
}
```

**SQL source:**

```sql
SELECT COUNT(*) FROM intake_files WHERE processing_status = 'completed'
SELECT COUNT(*) FROM intake_files WHERE processing_status != 'completed'
```

**Frontend consumer:** `EvidenceGapWorkspace.tsx` → calls `fetchEvidenceGaps()` from `lib/interfaceApi.ts`

**Notes:** Distribution is simplistic — only splits by processing_status. No analysis of `metadata_json` for missing entity fields or single-source assertions. Hardcoded dashboard stats (15 suspect claims, 8 single-source, 4 contradicted) are mock data.

---

### 2.4 `GET /api/intel/witnesses?case_id=default`

**Purpose:** Returns all unique witnesses and suspects extracted from file metadata for the B4 Brief roster.

**Query params:** `case_id` (string, optional, defaults to `"default"`)

**Response shape:**

```json
[
  {
    "id": 1,
    "full_name": "John Doe",
    "role": "Suspect / Target",
    "role_tag": "target",
    "matter_id": "MAT-001",
    "case_no": "default"
  },
  {
    "id": 2,
    "full_name": "Jane Smith",
    "role": "Witness",
    "role_tag": "civilian",
    "matter_id": "MAT-001",
    "case_no": "default"
  }
]
```

**SQL source:**

```sql
SELECT metadata_json FROM intake_files WHERE metadata_json IS NOT NULL
```

Then parses `metadata_json -> entities -> suspects` and `-> witnesses`.

**Frontend consumer:** `B4BriefWorkspace.tsx` — fetches directly via `fetch('http://localhost:8000/api/intel/witnesses')` (not through `lib/interfaceApi.ts`)

**Notes:**
- `role_tag` is hardcoded: suspects → `"target"`, witnesses → `"civilian"`. The B4 workspace uses `role_tag` (not `role`) for badge coloring.
- The B4 workspace also calls `http://localhost:3001/api/brief/{id}` and `http://localhost:3001/api/witnesses/{id}/photo` — these are served by a **separate Node.js server** (`scripts/b4-server.js`) on port 3001, NOT by the FastAPI backend.

---

### 2.5 `GET /api/intel/search?query=&case_id=default`

**Purpose:** Searches documents by filename, metadata, and category.

**Query params:**
- `query` (string, **required**) — search term
- `case_id` (string, optional, defaults to `"default"`)

**Response shape:**

```json
{
  "results": [
    {
      "id": 1,
      "filename": "report.pdf",
      "category": "documents",
      "subtype": "POLICE_REPORT",
      "snippet": "{\"suspects\": [\"John Doe\"], ...}"
    }
  ]
}
```

**SQL source:**

```sql
SELECT intake_id, original_filename, file_category, metadata_json, document_subtype
FROM intake_files
WHERE original_filename LIKE ? OR metadata_json LIKE ? OR file_category LIKE ?
LIMIT 50
```

**Frontend consumer:** `EvidenceSearchTool.tsx` (right toolbar) → calls `fetchEvidenceSearch()` from `lib/interfaceApi.ts`

**Notes:**
- Search is case-insensitive (SQLite default)
- No full-text search — only filename, metadata_json, and file_category
- The `extracted_text` table is available but not used for full-text search
- Snippet is limited to 100 chars of the metadata JSON string

---

## 3. Separate Node.js Server (Port 3001)

The `B4BriefWorkspace` also communicates with a separate server at `http://localhost:3001`:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/witnesses` | GET | Return full witness roster (seeded 30-witness JSON) |
| `/api/witnesses` | POST | Add new witness to roster |
| `/api/witnesses/{id}/photo/fetch-web` | POST | Searches DuckDuckGo for a public photo |
| `/api/witnesses/{id}/photo/confirm-web` | POST | Saves a selected photo |
| `/api/witnesses/{id}/photo` | GET | Serve saved witness photo |
| `/api/witnesses/{id}/photo` | POST | Direct photo upload |
| `/api/witnesses/photos/fetch-all` | POST | Scan discovery source dump for photos |
| `/api/brief/{id}` | GET | Load witness brief data |
| `/api/brief/{id}` | POST | Save witness brief data |
| `/api/case` | GET | Return case metadata |

These are served by `pinteq-intel/scripts/b4-server.js` and are separate from the FastAPI intel router.

---

## 4. Integration Gaps & Enhancement Opportunities

### 4.1 Unused but Valuable Tables

| Table | Data Available | Frontend That Could Use It |
|---|---|---|
| `phone_records` | Raw CDR rows with direction, duration, timestamp, phone numbers | **Phone Analysis** workspace (currently a placeholder) |
| `extracted_text` | Full OCR text per file | **Evidence Search** could offer full-text search instead of filename-only matching |
| `known_contacts` | Named contacts with phone numbers, addresses | **Contact Graph** could label nodes with full contact info |
| `police_reports` | Structured report metadata | **Prosecution Timeline** could pull real data instead of hardcoded samples |
| `entities` | Structured entity store | All entity-dependent workspaces (cleaner than parsing `metadata_json`) |
| `intake_batches` | Case-level aggregation | **Dashboard** stats |

### 4.2 Missing API Coverage

| Need | Frontend | Current Status | Suggested Route |
|---|---|---|---|
| Phone/CDR analysis data | `PhoneAnalysisWorkspace.tsx` | Placeholder — "Phase 5 — Planned" | `GET /api/intel/phone-records?case_id=default` |
| Full-text search across OCR text | `EvidenceSearchTool.tsx` | Filename-only search | `GET /api/intel/search/fulltext?query=&case_id=` |
| Case/batch-level stats | `DashboardWorkspace.tsx` | Not yet inspected | `GET /api/intel/dashboard?case_id=default` |
| Per-file timeline date (not created_at) | `TimelineWorkspace.tsx` | Uses created_at (ingestion time, not incident time) | Use `document_date` or `incident_date` from `intake_files` |
| OSINT search results | `OSINTSearchWorkspace.tsx` | Enhanced with source selector, uses client-side APIs | (separate service) |
| Case law search results | `CaseLawWorkspace.tsx` | Uses Harvard CAP API directly | (separate service) |

### 4.3 Data Quality Notes

- The `/timeline` endpoint uses `created_at` (file ingestion timestamp) rather than the document's actual date. Consider using `document_date` or `incident_date` columns from `intake_files` for meaningful timeline events.
- The `/evidence-gaps` distribution is simplistic (completed vs. pending count). A richer analysis could examine `metadata_json` for missing entity fields, single-source assertions, and cross-document contradictions.
- The `/network` node roles are drawn from `metadata_json -> entities` in `intake_files`, but the `entities` table provides a more queryable alternative.
- The search endpoint uses `LIKE` matching which is slow on large datasets. A proper FTS5 virtual table on `extracted_text.full_text` would be more performant.
- The B4Brief workspace has a **dual-backend architecture** — it talks to both port 8000 (FastAPI) and port 3001 (Express) simultaneously. The witness data from port 8000 and the brief/photo data from port 3001 are separate data pipelines.

---

## 5. Detailed Schema DDL

For reference, the canonical table definitions live in `pinteq-intake/pinteq_pipeline/database/schema.py`. Key tables for the intel app:

```sql
-- Core file registry
CREATE TABLE intake_files (
    intake_id               INTEGER PRIMARY KEY AUTOINCREMENT,
    matter_id               TEXT NOT NULL,
    original_filename       TEXT NOT NULL,
    normalized_filename     TEXT,
    file_type               TEXT,
    document_category       TEXT,
    processing_status       TEXT DEFAULT 'received',
    metadata_json           TEXT,             -- JSON blob with entities
    file_category           TEXT,
    document_subtype        TEXT,
    document_date           TEXT,
    incident_date           TEXT,
    created_at              TEXT DEFAULT (datetime('now')),
    ...
);

-- Time-series interactions (NEW)
CREATE TABLE communications (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    intake_id           INTEGER NOT NULL REFERENCES intake_files(intake_id),
    source_entity       TEXT NOT NULL,
    target_entity       TEXT NOT NULL,
    interaction_time    TEXT,
    duration_seconds    INTEGER,
    type                TEXT NOT NULL DEFAULT 'phone_call'
);

-- Raw phone records (available, not yet queried)
CREATE TABLE phone_records (
    record_id           INTEGER PRIMARY KEY AUTOINCREMENT,
    intake_id           INTEGER NOT NULL REFERENCES intake_files(intake_id),
    party_number        TEXT,
    contact_number      TEXT,
    direction           TEXT,
    duration_seconds    INTEGER,
    timestamp           TEXT,
    message_content     TEXT,
    platform            TEXT DEFAULT 'unknown',
    record_type         TEXT DEFAULT 'call'
);

-- Full OCR text (available, not yet queried)
CREATE TABLE extracted_text (
    text_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    intake_id           INTEGER NOT NULL REFERENCES intake_files(intake_id),
    full_text           TEXT,
    page_count          INTEGER,
    word_count          INTEGER,
    ...
);
```

---

## 6. Architecture Diagram (Text)

```
pinteq-intel (React, Vite)
  Port 5174
  │
  ├── lib/interfaceApi.ts ───→ http://localhost:8000/api/intel/* ───→ pinteq-interface (FastAPI)
  │   │                                                                    Port 8000
  │   ├── fetchTimelineData()   → GET /api/intel/timeline                  │
  │   ├── fetchNetworkData()    → GET /api/intel/network                   ├── routers/intel.py
  │   ├── fetchEvidenceGaps()   → GET /api/intel/evidence-gaps            │       ↕ SQLite
  │   ├── fetchEvidenceSearch() → GET /api/intel/search                   ├── pinteq_pipeline.db
  │   └── fetchWitnesses()      → GET /api/intel/witnesses                │
  │                                                                        └── main.py (also: /api/batches, /api/upload...)
  │
  ├── lib/capApi.ts ──────────→ https://api.case.law/v1/cases/ (Harvard CAP — direct, no backend)
  │
  ├── lib/osintApi.ts ────────→ External OSINT APIs (BreachDirectory, Hunter, Numverify, Reddit — direct)
  │
  └── B4BriefWorkspace.tsx ──→ http://localhost:8000/api/intel/witnesses   (same FastAPI)
                               → http://localhost:3001/api/brief/*         (separate Node.js server)
                               → http://localhost:3001/api/witnesses/*/photo (separate Node.js server)

pinteq-interface (FastAPI)
  Port 8000
  ├── GET  /api/intel/timeline       → SQLite: intake_files
  ├── GET  /api/intel/network        → SQLite: communications, intake_files
  ├── GET  /api/intel/evidence-gaps  → SQLite: intake_files
  ├── GET  /api/intel/witnesses      → SQLite: intake_files.metadata_json
  ├── GET  /api/intel/search         → SQLite: intake_files (LIKE)
  ├── POST /api/upload               → GCS (Google Cloud Storage)
  ├── GET  /api/batches              → GCS (batch metadata JSON)
  ├── GET  /api/settings             → Static config
  └── ...batch/file CRUD endpoints   → GCS

scripts/b4-server.js (Express, Node.js)
  Port 3001
  ├── GET  /api/witnesses            → JSON file: b4_witnesses.json
  ├── POST /api/witnesses            → JSON file: b4_witnesses.json
  ├── GET  /api/brief/:id            → JSON file: b4_briefs/:id.json
  ├── POST /api/brief/:id            → JSON file: b4_briefs/:id.json
  ├── GET  /api/witnesses/:id/photo  → File system: witness_photos/:id.{jpg,png,webp}
  ├── POST /api/witnesses/:id/photo  → File system: witness_photos/:id.{jpg,png,webp}
  ├── POST .../fetch-web             → DuckDuckGo Image Search (external)
  ├── POST .../confirm-web           → Downloads + saves photo
  └── POST .../fetch-all             → Scans C:\PinteqCaseTesting\source_dump
```

---

*Reference version: 1.0 — Generated from code audit on 2026-05-07*
