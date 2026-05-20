# Setup and Hosting
Explaining the two modes and how to setup the GitHub-App:

- **Public mode** (website + read API + separate upload API)
- **Private mode** (local/private viewer with optional auto-import)
- **GitHub App integration** (checks + PR comments)

---

## 1) Prerequisites

- Docker + Docker Compose
- Optional: GitHub App credentials (for PR comments/check runs)

---

## 2) Runtime Modes

### Public mode
Runs three services:

- `web` on port `8080` (React app + proxied read API at `/api/*`)
- `api-public` (read-only API, internal)
- `uploader` on port `3001` (upload-only API)

### Private mode
Runs two services:

- `web-private` on port `8081`
- `api-private` (read + upload API)

Use this for local/private analysis with mounted result files.
This is used in qlever-control for the visualize command.

---

## 3) Environment Variables

Use the template and then edit values:

```bash
cp .env.example .env
```

The full variable list is documented in [server/config.js](server/config.js). The most important ones are below.

### Minimal `.env` (public)

```env
# Required for uploader auth
API_KEY=replace-with-strong-random-key

# Public UI URL used in generated links/comments
WEBSITE_URL=https://conformance.example.com

# Optional GitHub App integration (set all 3 to enable)
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_INSTALLATION_ID=

# Optional behavior
LOG_LEVEL=info
```

For GitHub App-enabled public deployments, also set:

```env
GITHUB_REPO_OWNER=your-org-or-user
GITHUB_REPO_NAME=your-repository
CHECK_NAME=SPARQL 1.1 Conformance Check
CHECK_TITLE=SPARQL Test Suite
CHECK_RUNNING_TITLE=Running SPARQL Test Suite
COMMENT_AUTHOR=conformance-test[bot]
```

### Minimal `.env` (private)

```env
# Host path mounted read-only into /results in api-private
LOCAL_RESULTS_DIR=/absolute/path/to/results

# Optional
LOG_LEVEL=info
```

Notes:

- In private mode, GitHub App integration is disabled.
- `GITHUB_APP_PRIVATE_KEY` can be plain PEM text **or** base64-encoded PEM.
- `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME` are recommended defaults when running GitHub integration.

---

## 4) Public Hosting (Docker Compose)

### Start

```bash
docker compose --profile public up -d --build
```

### Endpoints

- Website: `http://localhost:8080`
- Uploader API: `http://localhost:3001/api/upload`
- Health: `http://localhost:8080/health`

You can change host ports via `.env`:

```env
PUBLIC_WEB_PORT=8080
PUBLIC_UPLOAD_PORT=3001
```

---

## 5) Private Hosting (Docker Compose)

### Start

```bash
LOCAL_RESULTS_DIR=/absolute/path/to/results docker compose --profile private up -d --build
```

### Endpoints

- Private website: `http://localhost:8081`
- API (proxied): `http://localhost:8081/api/*`

You can change the private web host port via:

```env
PRIVATE_WEB_PORT=8081
```

### Auto-import behavior

On startup, private mode can recursively import:

- `.json`
- `.json.gz`
- `.json.bz2`

from `LOCAL_RESULTS_DIR` into SQLite.

Recommended folder layout:

```text
<LOCAL_RESULTS_DIR>/<engine_name>/<engine_version>/<file>.json(.gz|.bz2)
```

This improves inferred metadata (`engine_name`, `engine_version`).

---

## 6) GitHub App Setup (Public mode)

If you want automatic PR comments and check runs, configure a GitHub App.

### 6.1 Create App

1. GitHub → Settings → Developer settings → GitHub Apps → New GitHub App
2. Set app name and homepage URL.
3. Install the app on the target repository/org.

### 6.2 Required repository permissions

- **Checks**: Read & write
- **Pull requests**: Read
- **Issues**: Read & write (PR comments are issue comments)
- **Metadata**: Read-only (default)
- **Contents**: Read-only (used when querying default branch commit)

### 6.3 Collect credentials

- `GITHUB_APP_ID` from app settings
- `GITHUB_INSTALLATION_ID` from the app installation URL
- `GITHUB_APP_PRIVATE_KEY` from generated private key (PEM file contents)
- `GITHUB_REPO_OWNER` default owner/org for your target repository
- `GITHUB_REPO_NAME` default repository name

Tip: if storing the private key in one line, you can base64-encode it:

```bash
base64 -w0 your-github-app-private-key.pem
```

and paste the output into `GITHUB_APP_PRIVATE_KEY`.

### 6.4 Configure environment

Set these values in `.env`:

- Required for integration: `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_INSTALLATION_ID`
- Recommended defaults: `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`
- For links in comments/checks: `WEBSITE_URL`

Then restart the public profile:

```bash
docker compose --profile public up -d --build
```

### 6.5 Verify

Use:

- `GET /api/github/status` via website domain, e.g. `https://conformance.example.com/api/github/status`

Expected:

- `configured: true`
- `authenticated: true`

If `configured` is `false`, at least one required GitHub App variable is missing.

---

## 7) Uploading Results

### 7.1 CI upload (public uploader)

```bash
curl -X POST "https://upload.conformance.example.com/api/upload" \
  -H "x-api-key: $API_KEY" \
  -H "x-upload-source: ci" \
  -H "x-repo-full-name: owner/repo" \
  -H "x-commit-sha: <sha>" \
  -H "x-workflow-run-id: <run-id>" \
  -H "x-ref-name: main" \
  -H "x-engine-name: qlever" \
  -H "x-engine-version: nightly-2026-03-01" \
  -F "file=@results.json.bz2"
```

### 7.2 Manual upload (public uploader)

```bash
curl -X POST "https://upload.conformance.example.com/api/upload" \
  -H "x-api-key: $API_KEY" \
  -H "x-upload-source: manual" \
  -H "x-repo-full-name: manual/uploads" \
  -H "x-engine-name: graphdb" \
  -H "x-engine-version: v10.8" \
  -F "file=@results.json.bz2"
```

---
## 8) Operations

### Check running services

```bash
docker compose ps
```

### View logs

```bash
docker compose logs -f web api-public uploader
```

or private:

```bash
docker compose logs -f web-private api-private
```

### Stop services

```bash
docker compose --profile public down
# or
docker compose --profile private down
```

---

### "Endpoint is not available in the current API surface mode"

You are calling an endpoint disabled for that service (`read` vs `upload` API surface).

### Upload returns 401

`x-api-key` does not match `API_KEY` for uploader.

### GitHub status not authenticated

Check all GitHub App envs and ensure app is installed on the target repo/org.

