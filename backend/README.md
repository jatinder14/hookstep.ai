# Backend - Song to Bolly Beat

Supabase Edge Functions for secure API handling.

## Structure

```
backend/
└── supabase/
    ├── functions/          # Edge Functions
    │   ├── shazam-detect/  # Shazam API integration
    │   ├── youtube-search/ # YouTube API integration
    │   └── identify-song/  # Song identification
    ├── migrations/         # Database migrations
    └── config.toml         # Supabase configuration
```

## Edge Functions

### shazam-detect

Secure wrapper for Shazam API calls. Keeps API keys on the server.

**Endpoint:** `/functions/v1/shazam-detect`

**Method:** POST

**Body:** Base64-encoded RAW PCM audio (text/plain)

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [...],
    "track": {...}
  }
}
```

### youtube-search

Secure wrapper for YouTube Data API v3. Keeps API keys on the server.

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
- RapidAPI account with Shazam API subscription
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

4. **Add API Key Secrets:**
   ```bash
   supabase secrets set SHAZAM_API_KEY=your_rapidapi_key
   supabase secrets set YOUTUBE_API_KEY=your_youtube_api_key
   ```
   
   Or via Dashboard: Settings → Edge Functions → Secrets

5. **Deploy Functions:**

   **Option 1: Deploy All (Recommended)**
   ```bash
   cd backend
   npm run deploy
   ```

   **Option 2: Deploy Individually**
   ```bash
   cd backend/supabase
   supabase functions deploy shazam-detect
   supabase functions deploy youtube-search
   supabase functions deploy identify-song
   ```

   See `DEPLOYMENT.md` for detailed deployment guide.

## Development

### Local Development

```bash
# Start local Supabase (optional)
supabase start

# Deploy all functions
npm run deploy

# OR deploy individually
supabase functions deploy shazam-detect
supabase functions deploy youtube-search
supabase functions deploy identify-song
```

### View Logs

```bash
supabase functions logs shazam-detect
supabase functions logs youtube-search
```

## Environment Variables

Set in Supabase Secrets (not in code):
- `SHAZAM_API_KEY` - Your RapidAPI key for Shazam API
- `YOUTUBE_API_KEY` - Your YouTube Data API v3 key

## Security

✅ API keys stored securely in Supabase Secrets  
✅ Never exposed to frontend  
✅ CORS handled automatically  
✅ Request validation on backend  

## Documentation

- See `../BACKEND_SETUP.md` for detailed setup
- See `../HOW_TO_GET_CREDENTIALS.md` for API key setup
- See `../TROUBLESHOOTING.md` for common issues
