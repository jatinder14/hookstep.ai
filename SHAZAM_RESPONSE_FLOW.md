# Shazam API Response Flow

## What Happens with Shazam Response

### 1. **Shazam API Returns:**
```json
{
  "matches": [{
    "track": {
      "key": "unique-song-id",
      "title": "Song Title",
      "subtitle": "Artist Name",
      "type": "MUSIC",
      "images": {
        "coverart": "https://...",
        "background": "https://..."
      },
      "hub": {
        "actions": [...]
      },
      "url": "https://shazam.com/..."
    }
  }]
}
```

### 2. **Current Processing:**

1. **Extract Track Info:**
   - Gets `title` and `subtitle` from the response
   - Stores the full track object in `currentTrack` state

2. **Create Search Query:**
   - Combines: `"${title} ${subtitle}"`
   - Example: "RAM AAYENGE LONG VERSION RITU'S DANCE STUDIO"

3. **Search YouTube:**
   - Uses the combined query to search YouTube
   - Adds "dance" keyword automatically: `"${query} dance"`
   - Fetches 10 short videos

4. **Display in UI:**
   - Shows song title and artist in the listening indicator
   - Displays album art if available
   - Shows "🎵 Song Title by Artist Name"

5. **Auto-play Videos:**
   - Clears old videos
   - Loads new videos for the identified song
   - Starts playing automatically

### 3. **What We're Using:**

✅ **Currently Used:**
- `track.title` - Song name
- `track.subtitle` - Artist name
- `track.key` - Unique identifier (for duplicate detection)
- `track.images.coverart` - Album art (displayed in UI)

❌ **Not Currently Used (Available):**
- `track.url` - Direct Shazam link
- `track.hub.actions` - Streaming links (Spotify, Apple Music, etc.)
- `track.images.background` - Background image
- `track.type` - Track type

### 4. **Flow Diagram:**

```
Audio Capture (5 sec)
    ↓
Shazam API Call
    ↓
Response: { track: { title, subtitle, images, ... } }
    ↓
Extract: title + subtitle
    ↓
Create Query: "Song Title Artist Name"
    ↓
Search YouTube: "Song Title Artist Name dance"
    ↓
Get 10 Videos
    ↓
Display in Reel Player
    ↓
Auto-play First Video
```

### 5. **Improvements Made:**

1. ✅ Better duplicate detection using `track.key`
2. ✅ Display album art in UI
3. ✅ Console logging for debugging
4. ✅ Better search query format
5. ✅ Only searches when song changes (not on every detection)

### 6. **Potential Future Enhancements:**

- Use `track.url` to link to Shazam page
- Use `track.hub.actions` to show streaming links
- Use `track.images.background` for video backgrounds
- Store Shazam data with videos for richer metadata
- Show song metadata in video overlay
