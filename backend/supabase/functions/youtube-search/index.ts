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

    // Add "dance" keyword to search query for better results
    const searchQuery = `${query.trim()} dance`;
    
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

    // Format videos for frontend
    const videos = (data.items || []).map((item: any) => ({
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
