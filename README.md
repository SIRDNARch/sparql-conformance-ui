# SPARQL 1.1 Compliance Website For QLever

Web UI and API for browsing, comparing and uploading SPARQL compliance test results.

## Overview

- React frontend (Vite)
- Fastify API server
- SQLite (`better-sqlite3`) with FTS5
- Upload endpoint for `.json`, `.json.gz`, and `.json.bz2`
- Public and private Docker Compose profiles

## UI routes

- `/` — Search and list runs
- `/manual-engines` — Manual/private uploads view
- `/run/:id` — Single run details
- `/compare/:id1/:id2` — Compare two runs

## API endpoints used by frontend

- `GET /api/search?q=...&source=...`
- `GET /api/runs?repo=&engine=&version=&source=&limit=&offset=`
- `GET /api/runs/:id`
- `GET /api/latest-master?repo=owner/repo`
- `GET /api/github/status`

Upload endpoint:

- `POST /api/upload` (available on upload surface or private mode)

## Upload examples

### Public uploader (API key required)

```bash
curl -X POST "http://localhost:3001/api/upload" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "x-upload-source: manual" \
  -H "x-repo-full-name: manual/uploads" \
  -H "x-engine-name: qlever" \
  -H "x-engine-version: nightly-2026-03-01" \
  -F "file=@./results/qlever.json.bz2"
```

### Private API (no API key)

```bash
curl -X POST "http://localhost:3000/api/upload" \
  -H "x-upload-source: manual" \
  -H "x-engine-name: graphdb" \
  -H "x-engine-version: v10.8" \
  -F "file=@./results/graphdb.json"
```

## Docker Compose modes

### Public mode

- Website: `http://localhost:8080`
- Uploader: `http://localhost:3001`

```bash
docker compose --profile public up --build
```

### Private mode

- Website: `http://localhost:8081`
- Auto-imports files from `LOCAL_RESULTS_DIR` on startup

```bash
LOCAL_RESULTS_DIR=./public/results docker compose --profile private up --build
```

## Key environment variables

- `VITE_BASE_PATH` — URL path the site is served under: `/` (root/subdomain) or a
  subpath like `/sparql-conformance-ui-v2/`. The only required frontend var; the API
  base URL and SPA router basename are derived from it.
- `API_KEY` — Required in public mode for uploader auth. Any strong random string —
  generate one with `openssl rand -hex 32`.
- `WEBSITE_URL` — Optional. Full public URL (e.g. `https://conformance.example.com`),
  used only for GitHub PR-comment links.
- `LOCAL_RESULTS_DIR` — Private mode only. Absolute path to the results folder to
  auto-import (e.g. `/home/me/results`).
- `LOG_LEVEL` — Optional. Log verbosity: `info` (default) or `debug` to troubleshoot.

The application mode (`public`/`private`) and endpoint surface are fixed by the
Docker Compose profile you start, not set via `.env`.

Every variable is explained inline in [.env.example](./.env.example). For full
deployment and GitHub App setup (App ID, installation ID, private key), see
[SETUP.md](./SETUP.md).
