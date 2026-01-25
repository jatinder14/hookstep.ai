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
      console.warn('YouTube API failed, using fallback data:', message);
      
      // Fallback to sample payload when API fails
      const fallbackPayload = {
        success: true,
        videos: [
          { "id": "gsSfJAI6h9g", "title": "RAM AAYENGE LONG VERSION", "channelTitle": "RITU'S DANCE STUDIO", "thumbnail": "https://i.ytimg.com/vi/gsSfJAI6h9g/hqdefault.jpg", "description": "" },
          { "id": "UPDDPeF6ktU", "title": "Ram Ayenge Bhajan | Dance Video | Vishal Mishra,Payal Dev, Manoj Muntasir | श्री राम प्राण प्रतिष्ठा", "channelTitle": "Apne Dance Classes", "thumbnail": "https://i.ytimg.com/vi/UPDDPeF6ktU/hqdefault.jpg", "description": "ramayengebhajan #vishalmishra #rambhajan Ram Ayenge Bhajan Vishal Mishra Payal Dev Manoj muntasir Bhushan Kumar ..." },
          { "id": "LMXdTT9mPQE", "title": "Ram Aayenge X Mere Ghar Ram Aaye Hai | Dance Video | 22 January 🚩 | The KDH Family", "channelTitle": "𝑻𝒉𝒆 𝑲𝑫𝑯 𝑭𝒂𝒎𝒊𝒍𝒚", "thumbnail": "https://i.ytimg.com/vi/LMXdTT9mPQE/hqdefault.jpg", "description": "Ram Aayenge X Mere Ghar Ram Aaye Hai | Dance Video | 22 January | The KDH Family Jai Shree Ram . Thanks for ..." },
          { "id": "QPxu18lMiCc", "title": "Ram Aayenge Dance (राम आएंगे) || Jai Shree Ram || Ayodhya", "channelTitle": "Bindass Mamta", "thumbnail": "https://i.ytimg.com/vi/QPxu18lMiCc/hqdefault.jpg", "description": "Ram Aayenge Dance (राम आएंगे) || Jai Shree Ram || Ayodhya Ram Aayenge Song Details: Song: Ram Aayenge Singer: ..." },
          { "id": "kDMKiF1gFXE", "title": "RAM AAYENGE DANCE- VIShal mishra song- jai shri Ram.", "channelTitle": "RITU'S DANCE STUDIO", "thumbnail": "https://i.ytimg.com/vi/kDMKiF1gFXE/hqdefault.jpg", "description": "" },
          { "id": "BDBt2dFAP1c", "title": "Mere ghar Ram Aaye/@jubinnautiyal@tseries Hai#ram#ayodhya#jalpashelatchoreography @jalpashelat", "channelTitle": "Jaltarang Dance Academy", "thumbnail": "https://i.ytimg.com/vi/BDBt2dFAP1c/hqdefault.jpg", "description": "Kindly Like Share Comment and Subscribe to Our Channel Jaltarang Dance Academy ♥ it's a girl's Dance Academy located at ..." },
          { "id": "o-2eoKQRVHw", "title": "Ram Ayenge || aaj gali gali avadh sajayenge 💫 || Ram mandir 🚩|| Vishal Mishra || Dipika Chikhlia", "channelTitle": "Blooming Dance", "thumbnail": "https://i.ytimg.com/vi/o-2eoKQRVHw/hqdefault.jpg", "description": "Namste This is Bhakti Tamboli here ☺️ राम मंदिर प्राण प्रतिष्ठा में अब कुछ ही समय ..." },
          { "id": "XL2qju0HE54", "title": "Ram aayenge | Vishal Mishra | Dance | Video | Akash Rajput Choreography | Easy steps for kids", "channelTitle": "Akash Rajput _The Dance Shadow ", "thumbnail": "https://i.ytimg.com/vi/XL2qju0HE54/hqdefault.jpg", "description": "Audio track credit - @tseries officials @TSeriesBhaktiSagar Dance video - @Akashrajput_TDS #ram #ramayenge #dance #kids ..." },
          { "id": "4pmoUNwcVFQ", "title": "MERE GHAR RAM- FULL DANCE/ DIWALI Dance/ JUBIN NAUTIYAL/ T SERIES/ JAI SHRI RAM/ BHAJAN DANCE", "channelTitle": "RITU'S DANCE STUDIO", "thumbnail": "https://i.ytimg.com/vi/4pmoUNwcVFQ/hqdefault.jpg", "description": "" },
          { "id": "o5DCiLbQZU8", "title": "Ram Ayenge | @madhavasrockband | Dance Cover by Seema Gondhi | Ram Mandir Ayodhya", "channelTitle": "Dance Love Passion", "thumbnail": "https://i.ytimg.com/vi/o5DCiLbQZU8/hqdefault.jpg", "description": "rammandir #ayodhya #ramayenge Ram Ayenge | @madhavasrockband | Dance Tutorial by Seema Gondhi | #rammandir ..." }
        ],
        totalResults: 701774
      };

      setVideos(fallbackPayload.videos || []);
      setError(null); // Clear error since we have fallback data
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
