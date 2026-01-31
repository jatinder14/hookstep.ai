# Backend - Song to Bolly Beat

Song recognition via **Node-shazam** (recognize server), called directly by the frontend. YouTube search via **Supabase Edge Function**.

## Structure

```
backend/
├── recognize/              # Node-shazam recognize server (run locally or host on Render/etc.)
│   └── server.ts           # POST /api/recognize, multipart audio → track
└── supabase/
    ├── functions/          # Edge Functions
    │   └── youtube-search/ # YouTube API integration
    ├── migrations/         # Database migrations
    └── config.toml         # Supabase configuration
```

## Song recognition (direct to Node server)

The frontend calls your Node recognize server at `VITE_RECOGNIZE_API_URL/api/recognize`. No Supabase proxy.

1. **Run or host the Node-shazam server** (localhost, Render, Railway, etc.).
2. **Set frontend** (`frontend/.env`): `VITE_RECOGNIZE_API_URL=http://localhost:3456` or your hosted URL (e.g. `https://your-service.onrender.com`).

### Run locally

```bash
cd backend
npm install
npm run recognize
```
Runs at `http://localhost:3456`. Frontend uses `VITE_RECOGNIZE_API_URL=http://localhost:3456`.

### Deploy to Render (Web Service, free tier)

1. In Render: **+ New → Web Service** (not Background Worker).
2. Connect your repo. **Root Directory:** `song-to-bolly-beat/backend` (or the folder with `package.json` and `recognize/`).
3. **Build:** `npm install` · **Start:** `npm run recognize` · **Instance:** Free.
4. Copy the service URL (e.g. `https://your-service.onrender.com`).
5. In `frontend/.env`: `VITE_RECOGNIZE_API_URL=https://your-service.onrender.com`.

Render’s Node image includes ffmpeg; no Dockerfile needed.

### Deploy to Google Cloud Run

The repo includes a **Dockerfile** in `backend/` that builds the recognize server (Node + ffmpeg). Cloud Run runs it as a container.

**Prerequisites**

- [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed and logged in
- A GCP project with **billing enabled**
- These APIs enabled: Cloud Run, Cloud Build, Artifact Registry

**One-time setup**

```bash
# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

**Deploy from the backend directory**

From the **backend** directory (the one that contains `Dockerfile` and `recognize/`):

```bash
cd backend   # or song-to-bolly-beat/backend from repo root

gcloud run deploy recognize \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --no-invoker-iam-check \
  --platform managed
```

Or use the script: `./deploy-techtank.sh` (set `GCP_PROJECT_ID` and `GCP_REGION` if needed).

- `--no-invoker-iam-check` allows public access when your org blocks adding `allUsers` to IAM.
- `--region` can be `us-central1`, `us-east1`, `europe-west1`, etc.

**First deploy**

Cloud Build will build the image, push it to Artifact Registry, and create/update the Cloud Run service. The first run can take a few minutes.

When it finishes, gcloud prints the **service URL**, e.g.:

```
Service [recognize] revision [...] has been deployed and is serving 100 percent of traffic.
Service URL: https://recognize-xxxxx-uc.a.run.app
```

**Configure the frontend**

In `frontend/.env`:

```
VITE_RECOGNIZE_API_URL=https://recognize-xxxxx-uc.a.run.app
```

Use the **exact** URL from the deploy output (no trailing slash). The frontend calls `VITE_RECOGNIZE_API_URL/api/recognize`.

**Re-deploy after code changes**

From `backend/` again:

```bash
gcloud run deploy recognize --source . --region us-central1 --allow-unauthenticated --no-invoker-iam-check --platform managed
```

**Useful commands**

```bash
# List services
gcloud run services list --region us-central1

# View logs
gcloud run services logs read recognize --region us-central1

# Describe service (includes URL)
gcloud run services describe recognize --region us-central1
```

**CI/CD (GitHub Actions)**

The workflow `.github/workflows/deploy-recognize-cloudrun.yml` deploys the recognize server to Cloud Run on every push to `main` that touches `backend/**`. You can also run it manually (**Actions → Deploy recognize to Cloud Run → Run workflow**).

1. **Create a GCP service account** for deploys:
   - In [IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts), create a service account (e.g. `github-deploy-recognize`).
   - Grant it: **Cloud Run Admin**, **Service Account User**, **Cloud Build Editor** (or use a custom role that can deploy Run and trigger builds).
   - Create a JSON key and download it.

2. **Add GitHub secrets** (repo **Settings → Secrets and variables → Actions**):
   - `GCP_SA_KEY`: paste the **entire contents** of the JSON key file.
   - `GCP_PROJECT_ID`: your GCP project ID (e.g. `my-project-123`).

3. **(Optional) Repository variable**  
   - `GCP_REGION`: Cloud Run region (e.g. `us-central1`). Defaults to `us-central1` if unset.

4. **Repo layout**  
   The workflow runs from the repo root and uses `--source ./backend`. Your repo must have a `backend/` directory at the root that contains the `Dockerfile` and `recognize/` folder. If your repo root is a parent folder, either move the workflow’s `--source` path or mirror that layout.

After the first successful run, use the printed **service URL** as `VITE_RECOGNIZE_API_URL` in the frontend.

## Edge Functions

### youtube-search

Secure wrapper for YouTube Data API v3.

**Endpoint:** `/functions/v1/youtube-search`

**Method:** POST

**Body:**
```json
{
  "query": "song title artist",
  "maxResults": 10,
  "videoDuration": "short"
}
```

**Response:**
```json
{
  "success": true,
  "videos": [
    {
      "id": "video_id",
      "title": "Video Title",
      "channelTitle": "Channel Name",
      "thumbnail": "thumbnail_url",
      "description": "Video description"
    }
  ],
  "totalResults": 100
}
```

## Setup

### Prerequisites

- Supabase CLI installed
- Supabase project created
- Google Cloud account with YouTube Data API v3 enabled

### Installation

1. **Install Supabase CLI:**
   ```bash
   brew install supabase/tap/supabase  # macOS
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   cd backend/supabase
   supabase link --project-ref your-project-ref
   ```

4. **Add secrets:** `YOUTUBE_API_KEY` (YouTube Data API v3). Via Dashboard: Settings → Edge Functions → Secrets.

5. **Deploy Edge Functions:**
   ```bash
   cd backend
   npm run deploy
   ```
   Deploys **youtube-search** only. Song recognition is direct to your Node server.

## Development

### Local Development

```bash
# Start Node-shazam server (required for recognition)
npm run recognize

# Deploy Edge Functions (youtube-search)
npm run deploy
```

### View Logs

```bash
supabase functions logs youtube-search
```

## Environment Variables

**Supabase secrets:** `YOUTUBE_API_KEY` – YouTube Data API v3 key.

**Frontend** (`frontend/.env`):
- `VITE_RECOGNIZE_API_URL` – Node recognize server URL (e.g. `http://localhost:3456` or `https://your-service.onrender.com`)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` – for youtube-search and auth

## Security

✅ No Shazam/RapidAPI key; recognition via node-shazam  
✅ YouTube API key in Supabase Secrets only  
✅ CORS handled by the Node recognize server  
