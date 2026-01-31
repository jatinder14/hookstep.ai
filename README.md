# Song to Bolly Beat

A music recognition app that identifies songs and finds related YouTube videos.

## Project structure

```
song-to-bolly-beat/
├── frontend/     # React + Vite
├── backend/      # Node-shazam recognize server + Supabase Edge Functions
└── .github/      # CI (deploy recognize to Cloud Run)
```

## Quick start

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # Add Supabase URL/key and VITE_RECOGNIZE_API_URL
npm run dev
```

### Backend

- **Song recognition:** Node-shazam server. Run `cd backend && npm run recognize` (local) or deploy to Cloud Run / Render. Set `VITE_RECOGNIZE_API_URL` in frontend `.env` to that URL.
- **YouTube search:** Supabase Edge Function. From `backend`: `npm run deploy` (deploys youtube-search). Add `YOUTUBE_API_KEY` in Supabase Dashboard → Edge Functions → Secrets.

See [backend/README.md](./backend/README.md) and [frontend/README.md](./frontend/README.md) for details.

## Environment

**Frontend** (`frontend/.env`):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` – Supabase
- `VITE_RECOGNIZE_API_URL` – recognize server URL (e.g. `http://localhost:3456` or your Cloud Run/Render URL)

**Backend:** Supabase secret `YOUTUBE_API_KEY` (YouTube Data API v3).

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind, Framer Motion, shadcn/ui, Supabase
- **Backend:** Node-shazam (recognize), Supabase Edge Functions (youtube-search)
