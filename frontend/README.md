# Frontend - Song to Bolly Beat

React + TypeScript + Vite frontend application for music recognition and YouTube video discovery.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **shadcn/ui** - UI components
- **Supabase** - Backend integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

See `../HOW_TO_GET_CREDENTIALS.md` for detailed instructions.

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── integrations/   # External service integrations
│   └── lib/            # Utility functions
├── public/             # Static assets
└── index.html          # HTML entry point
```

## Features

- 🎵 **Music Recognition** - Shazam API integration (via backend)
- 🎤 **Speech Recognition** - Continuous listening
- 📹 **YouTube Integration** - Video search and playback
- 🎨 **Modern UI** - Beautiful, responsive design
- ⚡ **Fast** - Optimized with Vite

## Backend Integration

The frontend communicates with the backend via Supabase Edge Functions:
- `shazam-detect` - Music recognition API

See `../backend/README.md` for backend setup.
