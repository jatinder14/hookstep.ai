# Song to Bolly Beat

A music recognition app that identifies songs and automatically finds related YouTube videos.

## 🏗️ Project Structure

```
song-to-bolly-beat/
├── frontend/          # React + Vite frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
│
├── backend/          # Supabase Edge Functions
│   └── supabase/     # Supabase configuration
│       ├── functions/    # Edge Functions
│       └── migrations/   # Database migrations
│
└── docs/             # Documentation files
    ├── BACKEND_SETUP.md
    ├── HOW_TO_GET_CREDENTIALS.md
    └── TROUBLESHOOTING.md
```

## 🚀 Quick Start

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env  # Add your Supabase credentials
npm run dev
```

### Backend Setup

```bash
cd backend/supabase
supabase login
supabase link --project-ref your-project-ref
supabase secrets set SHAZAM_API_KEY=your_key
supabase secrets set YOUTUBE_API_KEY=your_key

# Deploy all functions at once
cd ..
npm run deploy

# OR deploy individually
cd supabase
supabase functions deploy shazam-detect
supabase functions deploy youtube-search
```

See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed instructions.

## 📚 Documentation

- **[Frontend README](./frontend/README.md)** - Frontend setup and development
- **[Backend README](./backend/README.md)** - Backend setup and deployment
- **[Backend Setup Guide](./BACKEND_SETUP.md)** - Complete backend setup instructions
- **[How to Get Credentials](./HOW_TO_GET_CREDENTIALS.md)** - Where to find all API keys
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions

## 🎯 Features

- 🎵 **Music Recognition** - Shazam API integration
- 🎤 **Speech Recognition** - Continuous audio listening
- 📹 **YouTube Integration** - Automatic video search and playback
- 🎨 **Modern UI** - Beautiful, responsive design with animations
- 🔒 **Secure** - API keys stored on backend, never exposed

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- shadcn/ui

### Backend
- Supabase Edge Functions
- Shazam API (via RapidAPI)

## 📝 Environment Variables

### Frontend (.env in `frontend/` directory)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### Backend (Supabase Secrets)
- `SHAZAM_API_KEY` - Your RapidAPI key

See [HOW_TO_GET_CREDENTIALS.md](./HOW_TO_GET_CREDENTIALS.md) for detailed instructions.

## 🔐 Security

- ✅ API keys stored securely on Supabase backend
- ✅ No API keys in frontend code
- ✅ CORS protection
- ✅ Request validation

## 📖 Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend/supabase
supabase functions deploy shazam-detect
supabase functions logs shazam-detect
```

## 🐛 Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## 📄 License

[Your License Here]
