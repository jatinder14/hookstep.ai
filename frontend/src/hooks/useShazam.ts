import { useState, useCallback } from 'react';

/** Node recognize server URL (e.g. http://localhost:3456 or Cloud Run URL). */
const RECOGNIZE_API_URL = import.meta.env.VITE_RECOGNIZE_API_URL as string | undefined;

export interface ShazamTrack {
  key: string;
  title: string;
  subtitle: string;
  type?: string;
  images?: {
    coverart?: string;
    background?: string;
  };
  hub?: {
    actions?: Array<{
      name: string;
      type: string;
      uri?: string;
    }>;
  };
  url?: string;
}

export interface ShazamMatch {
  track: ShazamTrack;
  location?: { accuracy?: number };
}

export interface ShazamResponse {
  matches: ShazamMatch[];
  location?: { accuracy?: number };
}

interface UseShazamReturn {
  identifySong: (audioBlob: Blob) => Promise<ShazamResponse | null>;
  isLoading: boolean;
  error: string | null;
  result: ShazamTrack | null;
}

/**
 * Hook for song recognition. Calls the Node recognize server directly.
 * Set VITE_RECOGNIZE_API_URL to the server URL (e.g. http://localhost:3456 or https://xxx.onrender.com).
 * Sends the raw mic blob as multipart "audio".
 */
export function useShazam(): UseShazamReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShazamTrack | null>(null);

  const identifySong = useCallback(async (audioBlob: Blob): Promise<ShazamResponse | null> => {
    if (!RECOGNIZE_API_URL?.trim()) {
      setError('VITE_RECOGNIZE_API_URL is not set (e.g. your Cloud Run or local server URL).');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append('audio', audioBlob, 'recording.webm');
      const base = RECOGNIZE_API_URL.replace(/\/$/, '');
      const res = await fetch(`${base}/api/recognize`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => ({ success: false, error: 'Invalid response' }));

      if (!res.ok) {
        throw new Error(data?.error || `Server error ${res.status}`);
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Could not identify the song.');
      }

      const responseData = data.data ?? {};
      let matches = responseData.matches;
      if (!matches && responseData.track) {
        matches = [{ track: responseData.track }];
      }
      if (matches && matches.length > 0) {
        const track = matches[0].track as ShazamTrack;
        setResult(track);
        return { matches, location: responseData.location };
      }
      throw new Error('No matches found - song not recognized');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to identify song';
      setError(message);
      console.error('Recognize error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    identifySong,
    isLoading,
    error,
    result,
  };
}
