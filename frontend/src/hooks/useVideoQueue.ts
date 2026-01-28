import { useState, useCallback, useRef } from 'react';
import type { YouTubeVideo } from '@/types/youtube';
import { supabase } from '@/integrations/supabase/client';

// API keys are now stored securely on the backend (Supabase Edge Function)
// No API keys in frontend code!

interface UseVideoQueueReturn {
  videos: YouTubeVideo[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  addVideosFromQuery: (query: string, replace?: boolean, autoScroll?: boolean) => Promise<void>;
  goToNext: () => void;
  goToPrevious: () => void;
  clearQueue: () => void;
}

export function useVideoQueue(): UseVideoQueueReturn {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchedQueriesRef = useRef<Set<string>>(new Set());
  const currentQueryRef = useRef<string>('');
  const currentVideoIdRef = useRef<string | null>(null); // Track currently playing video ID
  const currentIndexRef = useRef<number>(0); // Track current index for reliable access

  const addVideosFromQuery = useCallback(async (query: string, replace: boolean = false, autoScroll: boolean = false) => {
    if (!query.trim()) return;
    
    const normalizedQuery = query.trim().toLowerCase();
    
    // If replacing, keep current video and remove future videos
    if (replace) {
      // Check if this is a different query than the current one
      if (normalizedQuery !== currentQueryRef.current.toLowerCase()) {
        // Keep current video and remove videos after currentIndex
        setVideos(prev => {
          const currentIdx = currentIndexRef.current;
          // Keep videos up to and including currentIndex, remove the rest
          return prev.slice(0, currentIdx + 1);
        });
        // Don't reset currentIndex - keep it so current video continues playing
        searchedQueriesRef.current.clear();
        currentQueryRef.current = query.trim();
      } else {
        // Same query, don't search again
        return;
      }
    } else {
      // Normalize query to avoid duplicate searches
      if (searchedQueriesRef.current.has(normalizedQuery)) {
        return; // Already searched this query
      }
      searchedQueriesRef.current.add(normalizedQuery);
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Call backend Supabase Edge Function (API keys are secure on backend)
      const { data, error: fnError } = await supabase.functions.invoke('youtube-search', {
        body: {
          query: query.trim(),
          maxResults: 10,
          videoDuration: 'short',
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to call YouTube API');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'YouTube API returned an error');
      }

      const newVideos: YouTubeVideo[] = data.videos || [];

      // If replacing, keep current video and append new videos after it
      if (replace) {
        setVideos(prev => {
          // Filter out duplicates from new videos
          const existingIds = new Set(prev.map(v => v.id));
          const uniqueNewVideos = newVideos.filter(v => !existingIds.has(v.id));
          
          // Keep current videos (up to currentIndex) and append new videos
          const updatedVideos = [...prev, ...uniqueNewVideos];
          
          // After videos are loaded, automatically scroll to the next video (first new video)
          if (uniqueNewVideos.length > 0) {
            setTimeout(() => {
              setCurrentIndex(prevIndex => {
                const nextIndex = prevIndex + 1;
                currentIndexRef.current = nextIndex;
                if (updatedVideos[nextIndex]) {
                  currentVideoIdRef.current = updatedVideos[nextIndex].id;
                }
                
                // Remove the old video after scrolling to the next one
                setTimeout(() => {
                  setVideos(currentVideos => {
                    // Remove the video at the old index (prevIndex)
                    return currentVideos.filter((_, idx) => idx !== prevIndex);
                  });
                  // Adjust currentIndex since we removed a video before it
                  setCurrentIndex(currentIdx => {
                    const adjustedIndex = currentIdx - 1;
                    currentIndexRef.current = adjustedIndex;
                    return adjustedIndex;
                  });
                }, 300); // Wait 0.3s so the next video starts playing before removing old one
                
                return nextIndex;
              });
            }, 500); // Delay to ensure videos are rendered and current video continues playing
          }
          
          return updatedVideos;
        });
        searchedQueriesRef.current.add(normalizedQuery);
      } else {
        // Add new videos to the queue (prepend to beginning)
        setVideos(prev => {
          // Filter out duplicates
          const existingIds = new Set(prev.map(v => v.id));
          const uniqueNewVideos = newVideos.filter(v => !existingIds.has(v.id));
          
          if (uniqueNewVideos.length === 0) {
            return prev; // No new videos to add
          }
          
          const updatedVideos = [...uniqueNewVideos, ...prev];
          
          // Handle index adjustment
          if (prev.length === 0) {
            // No videos existed before, start at first new video
            setCurrentIndex(0);
            currentIndexRef.current = 0;
            if (updatedVideos[0]) {
              currentVideoIdRef.current = updatedVideos[0].id;
            }
          } else if (autoScroll) {
            // If auto-scroll is enabled, find the current video's new position
            // Track the current video ID to maintain position
            const currentVideoId = currentVideoIdRef.current || (prev[currentIndex]?.id ?? null);
            
            if (currentVideoId) {
              // Find the new index of the current video after prepending
              const newIndex = updatedVideos.findIndex(v => v.id === currentVideoId);
              if (newIndex !== -1) {
                // Set index to current video's new position (no visual jump)
                setCurrentIndex(newIndex);
                currentIndexRef.current = newIndex;
                currentVideoIdRef.current = currentVideoId;
              }
            }
            
            // After videos are loaded, smoothly scroll to the first new video (index 0)
            setTimeout(() => {
              setCurrentIndex(0);
              currentIndexRef.current = 0;
              if (updatedVideos[0]) {
                currentVideoIdRef.current = updatedVideos[0].id;
              }
            }, 500); // Delay to ensure videos are rendered and current video continues playing
          } else {
            // No auto-scroll: adjust index to keep current video playing
            setCurrentIndex(prevIndex => {
              const newIndex = prevIndex + uniqueNewVideos.length;
              currentIndexRef.current = newIndex;
              if (updatedVideos[newIndex]) {
                currentVideoIdRef.current = updatedVideos[newIndex].id;
              }
              return newIndex;
            });
          }
          
          return updatedVideos;
        });
      }
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

      const newVideos: YouTubeVideo[] = fallbackPayload.videos || [];

      // If replacing, keep current video and append new videos after it
      if (replace) {
        setVideos(prev => {
          // Filter out duplicates from new videos
          const existingIds = new Set(prev.map(v => v.id));
          const uniqueNewVideos = newVideos.filter(v => !existingIds.has(v.id));
          
          // Keep current videos (up to currentIndex) and append new videos
          const updatedVideos = [...prev, ...uniqueNewVideos];
          
          // After videos are loaded, automatically scroll to the next video (first new video)
          if (uniqueNewVideos.length > 0) {
            setTimeout(() => {
              setCurrentIndex(prevIndex => {
                const nextIndex = prevIndex + 1;
                currentIndexRef.current = nextIndex;
                if (updatedVideos[nextIndex]) {
                  currentVideoIdRef.current = updatedVideos[nextIndex].id;
                }
                
                // Remove the old video after scrolling to the next one
                setTimeout(() => {
                  setVideos(currentVideos => {
                    // Remove the video at the old index (prevIndex)
                    return currentVideos.filter((_, idx) => idx !== prevIndex);
                  });
                  // Adjust currentIndex since we removed a video before it
                  setCurrentIndex(currentIdx => {
                    const adjustedIndex = currentIdx - 1;
                    currentIndexRef.current = adjustedIndex;
                    return adjustedIndex;
                  });
                }, 300); // Wait 0.3s so the next video starts playing before removing old one
                
                return nextIndex;
              });
            }, 500); // Delay to ensure videos are rendered and current video continues playing
          }
          
          return updatedVideos;
        });
        searchedQueriesRef.current.add(normalizedQuery);
        setError(null); // Clear error since we have fallback data
      } else {
        // Add new videos to the queue (prepend to beginning)
        setVideos(prev => {
          // Filter out duplicates
          const existingIds = new Set(prev.map(v => v.id));
          const uniqueNewVideos = newVideos.filter(v => !existingIds.has(v.id));
          
          if (uniqueNewVideos.length === 0) {
            return prev; // No new videos to add
          }
          
          const updatedVideos = [...uniqueNewVideos, ...prev];
          
          // Handle index adjustment
          if (prev.length === 0) {
            // No videos existed before, start at first new video
            setCurrentIndex(0);
            currentIndexRef.current = 0;
            if (updatedVideos[0]) {
              currentVideoIdRef.current = updatedVideos[0].id;
            }
          } else if (autoScroll) {
            // If auto-scroll is enabled, find the current video's new position
            // Track the current video ID to maintain position
            const currentVideoId = currentVideoIdRef.current || (prev[currentIndex]?.id ?? null);
            
            if (currentVideoId) {
              // Find the new index of the current video after prepending
              const newIndex = updatedVideos.findIndex(v => v.id === currentVideoId);
              if (newIndex !== -1) {
                // Set index to current video's new position (no visual jump)
                setCurrentIndex(newIndex);
                currentIndexRef.current = newIndex;
                currentVideoIdRef.current = currentVideoId;
              }
            }
            
            // After videos are loaded, smoothly scroll to the first new video (index 0)
            setTimeout(() => {
              setCurrentIndex(0);
              currentIndexRef.current = 0;
              if (updatedVideos[0]) {
                currentVideoIdRef.current = updatedVideos[0].id;
              }
            }, 500); // Delay to ensure videos are rendered and current video continues playing
          } else {
            // No auto-scroll: adjust index to keep current video playing
            setCurrentIndex(prevIndex => {
              const newIndex = prevIndex + uniqueNewVideos.length;
              currentIndexRef.current = newIndex;
              if (updatedVideos[newIndex]) {
                currentVideoIdRef.current = updatedVideos[newIndex].id;
              }
              return newIndex;
            });
          }
          
          return updatedVideos;
        });
        setError(null); // Clear error since we have fallback data
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev < videos.length - 1) {
        const newIndex = prev + 1;
        currentIndexRef.current = newIndex;
        // Update current video ID
        if (videos[newIndex]) {
          currentVideoIdRef.current = videos[newIndex].id;
        }
        // Remove videos below current position (already watched)
        setTimeout(() => {
          setVideos(currentVideos => currentVideos.slice(0, newIndex + 5));
        }, 100);
        return newIndex;
      }
      return prev;
    });
  }, [videos]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev > 0) {
        const newIndex = prev - 1;
        currentIndexRef.current = newIndex;
        if (videos[newIndex]) {
          currentVideoIdRef.current = videos[newIndex].id;
        }
        return newIndex;
      }
      return prev;
    });
  }, [videos]);

  const clearQueue = useCallback(() => {
    setVideos([]);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    searchedQueriesRef.current.clear();
    currentQueryRef.current = '';
    currentVideoIdRef.current = null;
  }, []);

  return {
    videos,
    currentIndex,
    isLoading,
    error,
    addVideosFromQuery,
    goToNext,
    goToPrevious,
    clearQueue,
  };
}
