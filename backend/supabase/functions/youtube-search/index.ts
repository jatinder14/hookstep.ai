import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { query, maxResults = 10, videoDuration = 'short' } = body;
    
    if (!query || !query.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search query is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get YouTube API key from environment (set in Supabase dashboard)
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) {
      console.error('YOUTUBE_API_KEY not configured in Supabase secrets');
      return new Response(
        JSON.stringify({ success: false, error: 'YouTube API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Add "dance" and "shorts" keywords to search query for better results (YouTube Shorts only)
    const searchQuery = `${query.trim()} dance shorts`;
    
    // Build YouTube API request
    const params = new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      videoDuration: videoDuration,
      maxResults: maxResults.toString(),
      order: 'relevance',
      key: youtubeApiKey,
    });

    const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?${params}`;
    
    console.log('📹 YouTube: Searching for:', searchQuery);
    console.log('📹 YouTube: Max results:', maxResults);

    const response = await fetch(youtubeApiUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('📹 YouTube: API error:', errorData);
      throw new Error(errorData.error?.message || `YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📹 YouTube: Found', data.items?.length || 0, 'videos');

    // Helper function to parse YouTube duration (PT1M30S format) to seconds
    function parseDuration(duration: string): number {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const seconds = parseInt(match[3] || '0', 10);
      return hours * 3600 + minutes * 60 + seconds;
    }

    // Extract video IDs to check embeddability and verify they're Shorts
    const videoIds = (data.items || []).map((item: any) => item.id.videoId);
    
    // Check embeddability status and video details (to verify Shorts format) for all videos
    let embeddableVideos: string[] = [];
    if (videoIds.length > 0) {
      try {
        // Get both status and contentDetails to check embeddability and verify Shorts (vertical 9:16 format)
        const detailsParams = new URLSearchParams({
          part: 'status,contentDetails',
          id: videoIds.join(','),
          key: youtubeApiKey,
        });
        
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?${detailsParams}`;
        const detailsResponse = await fetch(detailsUrl);
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          // Filter to only embeddable Shorts that are public and available
          embeddableVideos = (detailsData.items || [])
            .filter((item: any) => {
              const status = item.status;
              const contentDetails = item.contentDetails;
              
              // Check if video is embeddable, public, and processed
              const isEmbeddable = status?.embeddable !== false && 
                                   status?.privacyStatus === 'public' &&
                                   status?.uploadStatus === 'processed';
              
              if (!isEmbeddable) return false;
              
              // Verify it's a Short (vertical format 9:16)
              // Shorts are typically under 60 seconds and have vertical aspect ratio
              const duration = contentDetails?.duration;
              const dimension = contentDetails?.dimension;
              
              // Check if it's vertical (dimension === 'vertical') or has Shorts-like duration
              // YouTube Shorts are typically vertical and under 60 seconds
              const isVertical = dimension === 'vertical';
              const isShortDuration = duration && parseDuration(duration) <= 60; // 60 seconds max for Shorts
              
              // Include if it's vertical OR if duration suggests it's a Short
              // (Some Shorts might not have dimension set, so we check duration too)
              return isVertical || isShortDuration;
            })
            .map((item: any) => item.id);
          console.log('📹 YouTube: Found', embeddableVideos.length, 'embeddable Shorts out of', videoIds.length);
        } else {
          console.warn('📹 YouTube: Failed to check video details, including all videos');
          embeddableVideos = videoIds; // Fallback: include all if check fails
        }
      } catch (detailsError) {
        console.warn('📹 YouTube: Error checking video details:', detailsError);
        embeddableVideos = videoIds; // Fallback: include all if check fails
      }
    }

    // Format videos for frontend, filtering out non-embeddable videos
    const videos = (data.items || [])
      .filter((item: any) => embeddableVideos.includes(item.id.videoId))
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        description: item.snippet.description,
      }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        videos,
        totalResults: data.pageInfo?.totalResults || videos.length,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to search YouTube';
    console.error('📹 YouTube: Error:', err);
    console.error('📹 YouTube: Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    
    // Always return CORS headers, even on error
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
