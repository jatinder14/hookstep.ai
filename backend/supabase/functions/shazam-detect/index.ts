import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Supabase Edge Functions require authentication by default
    // The Supabase client automatically adds 'Authorization: Bearer <anon_key>' header
    // We can also accept 'apikey' header as alternative
    const authHeader = req.headers.get('authorization');
    const apikeyHeader = req.headers.get('apikey');
    
    // For security, we should validate the request comes from a valid Supabase client
    // But for now, we'll allow requests (you can add stricter validation later)
    if (!authHeader && !apikeyHeader) {
      console.log('⚠️ Request without authorization - this might fail if function requires auth');
      // Note: Supabase will reject this if the function is configured to require auth
      // The client should automatically add the header, so this shouldn't happen
    }

    // Get base64 audio from request body
    const base64Audio = await req.text();
    
    if (!base64Audio || base64Audio.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, error: 'Base64 audio data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Shazam API key from environment (set in Supabase dashboard)
    const shazamApiKey = Deno.env.get('SHAZAM_API_KEY');
    if (!shazamApiKey) {
      console.error('SHAZAM_API_KEY not configured in Supabase secrets');
      return new Response(
        JSON.stringify({ success: false, error: 'Shazam API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const SHAZAM_API_URL = 'https://shazam.p.rapidapi.com';
    const SHAZAM_API_HOST = 'shazam.p.rapidapi.com';

    // Try different endpoints
    const endpoints = [
      `${SHAZAM_API_URL}/songs/v2/detect`,
      `${SHAZAM_API_URL}/songs/v3/detect`,
      `${SHAZAM_API_URL}/songs/detect`,
    ];

    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        console.log('🎵 Shazam: Calling endpoint:', endpoint);
        console.log('🎵 Shazam: Payload size:', base64Audio.length);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'X-RapidAPI-Key': shazamApiKey,
            'X-RapidAPI-Host': SHAZAM_API_HOST,
            'Content-Type': 'text/plain',
          },
          body: base64Audio,
        });

        console.log('🎵 Shazam: Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🎵 Shazam: Error from', endpoint, ':', errorText);
          lastError = new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
          continue; // Try next endpoint
        }

        const responseText = await response.text();
        console.log('🎵 Shazam: Response length:', responseText.length);

        if (!responseText || responseText.trim() === '') {
          console.warn('🎵 Shazam: Empty response from', endpoint);
          lastError = new Error('Empty response from Shazam API');
          continue; // Try next endpoint
        }

        const data = JSON.parse(responseText);
        console.log('🎵 Shazam: Success! Found matches:', data.matches?.length || 0);

        // Handle different response formats
        let matches = data.matches;
        if (!matches && data.track) {
          matches = [{ track: data.track }];
        } else if (!matches && data.result) {
          matches = data.result.matches || data.result;
        }

        if (matches && matches.length > 0) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: {
                matches,
                location: data.location,
                track: matches[0].track,
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          lastError = new Error('No matches found');
          continue; // Try next endpoint
        }
      } catch (parseError) {
        console.error('🎵 Shazam: Error parsing response from', endpoint, ':', parseError);
        lastError = parseError instanceof Error ? parseError : new Error('Failed to parse response');
        continue; // Try next endpoint
      }
    }

    // If we get here, all endpoints failed
    throw lastError || new Error('All Shazam API endpoints failed');

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to identify song with Shazam';
    console.error('🎵 Shazam: Error:', err);
    
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
