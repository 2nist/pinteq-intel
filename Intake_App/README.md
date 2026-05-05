# Pinteq Case Intelligence Pipeline

Discovery intake and intelligence system for the Law Office of Charles M. Ayres.

## Setup

### 1. Clone and create virtual environment

```bash
git clone <repo-url> pinteq-pipeline
cd pinteq-pipeline
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> **Windows note:** `python-magic` requires `libmagic`. The `python-magic-bin`
> package bundles it for Windows and is installed automatically via the
> `platform_system == "Windows"` marker in `requirements.txt`. No separate
> install is needed.

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your actual paths and credentials
```

Required variables for Sprint 1:

| Variable | Description |
|---|---|
| `DATABASE_PATH` | Path to the SQLite database file |
| `DROP_FOLDER_PATH` | Folder to watch for incoming discovery files |
| `PROCESSED_FOLDER_PATH` | Destination for normalized file copies |
| `ORIGINAL_ARCHIVE_PATH` | Immutable archive of original files |
| `QUARANTINE_FOLDER_PATH` | Files that failed processing land here |
| `LOG_LEVEL` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`) |

### 4. Run the pipeline

```bash
python -m pinteq_pipeline.main
```

Drop discovery files into `DROP_FOLDER_PATH`. The watcher will classify,
hash, archive the original, create a normalized copy, and queue the file
for processing.

Press `Ctrl-C` to stop.

## Run tests

```bash
pytest
```

Coverage report is printed automatically. To skip coverage:

```bash
pytest --no-cov
```

## Project structure

```
pinteq-pipeline/
├── pinteq_pipeline/
│   ├── config.py          # env loading + validation
│   ├── main.py            # entry point + watcher startup
│   ├── database/
│   │   ├── schema.py      # CREATE TABLE statements
│   │   ├── connection.py  # SQLite context manager (WAL + FK)
│   │   └── queries.py     # all SQL query functions
│   ├── intake/
│   │   ├── classifier.py  # MIME + extension → category
│   │   ├── hasher.py      # SHA-256 + duplicate detection
│   │   ├── renamer.py     # normalized filename builder
│   │   └── watcher.py     # watchdog handler + quarantine
│   ├── processing/        # Sprint 2 stubs
│   ├── smokeball/         # Sprint 2 stubs
│   └── api/               # Sprint 2 stubs
└── tests/
```

## Batch workspace isolation

Each batch run is isolated under its own directory tree so outputs never
collide across runs.

### Layout

```
<root>/
└── batches/
    └── <batch_id>/
        ├── drop_folder/          ← files placed here for watcher pickup
        ├── original_archive/     ← immutable copy of each original
        ├── processed_folder/     ← normalized file copies
        ├── quarantine_folder/    ← files that failed processing
        ├── database/
        │   └── pinteq_<batch_id>.db
        ├── logs/
        │   └── watcher_<batch_id>.log
        ├── reports/              ← per-batch report output
        └── manifests/
            └── batch_manifest.csv
```

### Creating and using a batch workspace (Python)

```python
from pathlib import Path
from pinteq_pipeline.intake.batch_workspace import BatchWorkspace

ws = BatchWorkspace.from_root(Path(r"C:\PinteqCaseTesting"), "batch_003")
ws.create_folders()   # idempotent; safe to call repeatedly

# Paths are ready:
ws.drop_folder        # Path to watch
ws.database_path      # SQLite DB path
ws.log_path           # log file path
ws.manifest_path      # batch_manifest.csv path
```

### Using environment variables

Set `PINTEQ_TEST_ROOT` and `BATCH_ID` to let `Config` and scripts discover
the workspace automatically:

```
PINTEQ_TEST_ROOT=C:\PinteqCaseTesting
BATCH_ID=batch_003
```

```python
ws = BatchWorkspace.from_env()   # returns None if env vars absent
```

### Resetting a batch workspace

```python
# Clears drop_folder, original_archive, processed_folder, quarantine_folder.
# Does NOT touch database/, logs/, reports/, or manifests/.
ws.clean_working_dirs(confirm_batch_id="batch_003")

# Remove only the SQLite database file:
ws.remove_database()
```

`clean_working_dirs()` refuses to run if `confirm_batch_id` does not match
`ws.batch_id`, and guards against any path that escapes `batch_root`.

### Source dump is read-only

`C:\PinteqCaseTesting\source_dump` is never walked with `rglob` or modified
by the pipeline.  Validation scripts reference only the specific paths listed
in `batch_manifest.csv`.

### Legacy scripts

Existing validation scripts that hard-code flat paths
(e.g. `C:\PinteqCaseTesting\drop_folder`) continue to work without
any changes.  `BatchWorkspace` is opt-in for new or isolated runs.

---

## Filename convention

```
YYYY-MM-DD_CASE-ID_SOURCE_CATEGORY_SEQ.ext
2026-05-02_KENT-25-7082_COURTHOUSE_POLICE-REPORT_001.pdf
```

- `SOURCE`: `COURTHOUSE | FOIA | PROSECUTION | DEFENSE | OSINT | UNKNOWN`
- `CATEGORY`: `POLICE-REPORT | AUDIO-VIDEO | PHONE-RECORDS | PHOTOS | LAB-REPORT | COURT-FILING | TRANSCRIPT | CORRESPONDENCE | OTHER`
- `SEQ`: zero-padded 3 digits
- Original filename is always preserved in the database
