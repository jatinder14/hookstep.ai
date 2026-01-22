import { useState, useCallback } from 'react';

// const YOUTUBE_API_KEY = 'AIzaSyBIh4FDTNJ-uKOff6CIlxvubqGrJT_Bhb8';
const YOUTUBE_API_KEY = 'AIzaSyD07yW9SPGcQXmVf6jb61_pJKk3nrjEcnY';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

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
      // Search for dance videos related to the query
      const searchQuery = `${query} dance`;
      
      const params = new URLSearchParams({
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        videoDuration: 'short', // Prefer shorts/short videos
        maxResults: '20',
        order: 'relevance',
        key: YOUTUBE_API_KEY,
      });

      const response = await fetch(`${YOUTUBE_API_URL}?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to search YouTube');
      }

      const data = await response.json();
      
      const formattedVideos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        description: item.snippet.description,
      }));

      setVideos(formattedVideos);
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
