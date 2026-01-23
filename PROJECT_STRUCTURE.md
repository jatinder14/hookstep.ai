# Project Structure

This document describes the organization of the Song to Bolly Beat project.

## Directory Structure

```
song-to-bolly-beat/
│
├── frontend/                 # React frontend application
│   ├── src/                 # Source code
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── integrations/   # External integrations (Supabase)
│   │   └── lib/            # Utility functions
│   ├── public/             # Static assets
│   ├── index.html          # HTML entry point
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.ts      # Vite configuration
│   ├── tailwind.config.ts  # Tailwind CSS configuration
│   └── tsconfig.json       # TypeScript configuration
│
├── backend/                 # Supabase backend
│   └── supabase/           # Supabase configuration
│       ├── functions/     # Edge Functions
│       │   ├── shazam-detect/    # Shazam API wrapper
│       │   └── identify-song/     # Song identification
│       ├── migrations/     # Database migrations
│       └── config.toml     # Supabase config
│
└── [root]/                 # Project root
    ├── README.md           # Main project README
    ├── BACKEND_SETUP.md    # Backend setup guide
    ├── HOW_TO_GET_CREDENTIALS.md  # Credentials guide
    ├── TROUBLESHOOTING.md  # Troubleshooting guide
    └── .gitignore          # Git ignore rules
```

## Frontend

**Location:** `frontend/`

**Purpose:** React application that provides the user interface and handles client-side logic.

**Key Files:**
- `src/main.tsx` - Application entry point
- `src/pages/Index.tsx` - Main page component
- `src/hooks/useShazam.ts` - Shazam API integration hook
- `src/integrations/supabase/client.ts` - Supabase client

**Environment Variables:**
- `.env` file in `frontend/` directory
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Backend

**Location:** `backend/supabase/`

**Purpose:** Supabase Edge Functions that handle secure API calls.

**Key Files:**
- `functions/shazam-detect/index.ts` - Shazam API wrapper
- `config.toml` - Supabase project configuration

**Environment Variables:**
- Set in Supabase Secrets (via Dashboard or CLI)
- `SHAZAM_API_KEY` - RapidAPI key

## Development Workflow

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend/supabase
supabase functions deploy shazam-detect
supabase functions logs shazam-detect
```

## File Organization Principles

1. **Separation of Concerns**
   - Frontend code in `frontend/`
   - Backend code in `backend/`
   - Shared docs at root

2. **Environment Variables**
   - Frontend: `.env` in `frontend/` directory
   - Backend: Supabase Secrets (not in files)

3. **Configuration**
   - Each directory has its own config files
   - Paths are relative to their directory

4. **Documentation**
   - Root level for project-wide docs
   - Each directory has its own README

## Migration Notes

If you're migrating from the old structure:
- Frontend files moved from root to `frontend/`
- Backend files moved from `supabase/` to `backend/supabase/`
- Update any scripts that reference old paths
- Environment variables now go in `frontend/.env`
