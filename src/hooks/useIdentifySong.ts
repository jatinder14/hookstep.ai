import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HookstepData {
  id?: string;
  song_title: string;
  movie_name?: string;
  release_year?: number;
  singers?: string[];
  music_director?: string;
  hookstep_description: string[];
  hookstep_time_start?: string;
  hookstep_time_end?: string;
  youtube_video_id?: string;
  youtube_timestamp_seconds?: number;
  stick_figure_svg?: string;
}

interface IdentifyResult {
  success: boolean;
  data?: HookstepData;
  cached?: boolean;
  message?: string;
  error?: string;
}

export function useIdentifySong() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<HookstepData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const identifySong = async (query: string, type: 'text' | 'audio') => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = type === 'text' 
        ? { songQuery: query }
        : { audioDescription: query };

      const { data, error: fnError } = await supabase.functions.invoke<IdentifyResult>(
        'identify-song',
        { body: payload }
      );

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data?.success) {
        throw new Error(data?.message || data?.error || 'Failed to identify song');
      }

      if (data.data) {
        setResult(data.data);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    identifySong,
    isLoading,
    result,
    error,
    reset,
  };
}
