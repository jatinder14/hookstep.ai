/**
 * Node recognize server for song-to-bolly-beat.
 * Uses node-shazam (fromFilePath) so browser WebM and other formats work.
 * Replaces the RapidAPI Shazam flow when this server is used.
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { Shazam } from 'node-shazam';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3456;
const shazam = new Shazam();

const uploadDir = path.join(os.tmpdir(), 'song-to-bolly-beat-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `recording-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed =
      /\.(webm|wav|mp3|ogg|m4a)$/i.test(file.originalname) ||
      (file.mimetype && /audio\//.test(file.mimetype));
    if (allowed) cb(null, true);
    else cb(new Error('Only audio files are allowed'));
  },
});

app.use(cors());
app.use(express.json());

app.post('/api/recognize', upload.single('audio'), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: 'No audio file uploaded. Use field name "audio".' });
    return;
  }

  const filePath = file.path;
  if (file.size < 1000) {
    try {
      fs.unlinkSync(filePath);
    } catch (_) {}
    res.status(400).json({
      success: false,
      error: 'Recording too short or empty. Allow the mic, play music, and try again.',
    });
    return;
  }

  try {
    // fromFilePath uses ffmpeg to convert WebM/WAV/etc to PCM, then recognizes
    const data = await shazam.fromFilePath(filePath, false, 'en-US');

    if (!data || !(data as { track?: unknown }).track) {
      res.status(200).json({ success: false, error: 'Could not identify the song.' });
      return;
    }

    const root = data as { track: Record<string, unknown>; matches?: unknown[] };
    // Match shape expected by song-to-bolly-beat frontend: { success, data: { matches, track } }
    res.json({
      success: true,
      data: {
        matches: [{ track: root.track }],
        track: root.track,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[recognize]', err);
    res.status(500).json({ success: false, error: message });
  } finally {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`\n🎵 Song-to-Bolly-Beat recognize server (node-shazam) at http://localhost:${PORT}`);
  console.log(`   Set VITE_RECOGNIZE_API_URL=http://localhost:${PORT} in frontend .env\n`);
});
