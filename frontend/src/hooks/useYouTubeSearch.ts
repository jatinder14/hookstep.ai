import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// API keys are now stored securely on the backend (Supabase Edge Function)
// No API keys in frontend code!

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  description: string;
}

interface UseYouTubeSearchReturn {
  videos: YouTubeVideo[];
  isLoading: boolean;
  error: string | null;
  searchVideos: (query: string) => Promise<void>;
}

export function useYouTubeSearch(): UseYouTubeSearchReturn {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchVideos = useCallback(async (query: string) => {
    if (!query.trim()) {
      setError('Please provide a search query');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call backend Supabase Edge Function (API keys are secure on backend)
      const { data, error: fnError } = await supabase.functions.invoke('youtube-search', {
        body: {
          query: query.trim(),
          maxResults: 20,
          videoDuration: 'short', // Prefer shorts/short videos
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to call YouTube API');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'YouTube API returned an error');
      }

      setVideos(data.videos || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search videos';
      setError(message);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    videos,
    isLoading,
    error,
    searchVideos,
  };
}
