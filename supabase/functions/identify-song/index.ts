import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { songQuery, audioDescription } = await req.json();
    
    if (!songQuery && !audioDescription) {
      throw new Error('Either songQuery or audioDescription is required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    if (songQuery) {
      const { data: cached } = await supabase
        .from('song_hooksteps')
        .select('*')
        .ilike('song_title', `%${songQuery}%`)
        .limit(1)
        .maybeSingle();

      if (cached) {
        console.log('Found cached hookstep for:', cached.song_title);
        return new Response(JSON.stringify({ success: true, data: cached, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Use AI to identify song and generate hookstep
    const prompt = `You are an expert on Indian film songs and Bollywood/Tollywood/Kollywood choreography.

${songQuery ? `The user is looking for the song: "${songQuery}"` : `The user described hearing/humming: "${audioDescription}"`}

Identify the Indian film song and provide the hookstep (signature dance step) information.

IMPORTANT: Only respond with valid JSON, no markdown or extra text.

Respond with this exact JSON structure:
{
  "identified": true or false,
  "song_title": "Full song title in original language + English if different",
  "movie_name": "Movie name",
  "release_year": year as number,
  "singers": ["Singer 1", "Singer 2"],
  "music_director": "Music director name",
  "hookstep_description": [
    "Step 1: Description with counts (1-2-3-4)",
    "Step 2: Body position and movement",
    "Step 3: Hand/arm gestures",
    "Step 4: Footwork details",
    "Step 5: Any signature moves"
  ],
  "hookstep_time_start": "MM:SS",
  "hookstep_time_end": "MM:SS",
  "youtube_video_id": "official video ID from YouTube",
  "youtube_timestamp_seconds": timestamp in seconds where hookstep starts,
  "stick_figure_poses": [
    {"pose": 1, "description": "Starting position"},
    {"pose": 2, "description": "Key pose"},
    {"pose": 3, "description": "Peak movement"},
    {"pose": 4, "description": "End position"}
  ]
}

If you cannot identify the song, respond with: {"identified": false, "reason": "explanation"}`;

    console.log('Calling Lovable AI for song identification...');
    
    const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response:', content);

    // Parse the JSON response
    let songData;
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      songData = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse song information');
    }

    if (!songData.identified) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: songData.reason || 'Could not identify the song' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate SVG stick figure
    const stickFigureSvg = generateStickFigureSvg(songData.stick_figure_poses || []);

    // Cache the result
    const hookstepData = {
      song_title: songData.song_title,
      movie_name: songData.movie_name,
      release_year: songData.release_year,
      singers: songData.singers,
      music_director: songData.music_director,
      hookstep_description: songData.hookstep_description,
      hookstep_time_start: songData.hookstep_time_start,
      hookstep_time_end: songData.hookstep_time_end,
      youtube_video_id: songData.youtube_video_id,
      youtube_timestamp_seconds: songData.youtube_timestamp_seconds,
      stick_figure_svg: stickFigureSvg,
    };

    // Insert into cache
    const { data: inserted, error: insertError } = await supabase
      .from('song_hooksteps')
      .insert(hookstepData)
      .select()
      .single();

    if (insertError) {
      console.error('Cache insert error:', insertError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: inserted || hookstepData,
      cached: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in identify-song function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateStickFigureSvg(poses: Array<{pose: number, description: string}>): string {
  if (!poses || poses.length === 0) {
    poses = [
      { pose: 1, description: "Start" },
      { pose: 2, description: "Move" },
      { pose: 3, description: "Peak" },
      { pose: 4, description: "End" }
    ];
  }

  const figureWidth = 80;
  const totalWidth = poses.length * figureWidth;
  
  let figures = '';
  poses.forEach((pose, index) => {
    const x = index * figureWidth + 40;
    const variation = (index % 4);
    figures += generateSingleFigure(x, 60, variation, pose.description, index + 1);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} 140" class="w-full h-auto">
    <defs>
      <linearGradient id="poseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#eab308;stop-opacity:1" />
      </linearGradient>
    </defs>
    ${figures}
  </svg>`;
}

function generateSingleFigure(cx: number, cy: number, variation: number, label: string, step: number): string {
  // Head
  const head = `<circle cx="${cx}" cy="${cy - 35}" r="8" fill="url(#poseGradient)" />`;
  
  // Body
  const body = `<line x1="${cx}" y1="${cy - 27}" x2="${cx}" y2="${cy + 5}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />`;
  
  // Arms - vary based on pose
  let arms = '';
  switch (variation) {
    case 0: // Arms down
      arms = `<line x1="${cx}" y1="${cy - 20}" x2="${cx - 15}" y2="${cy}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />
              <line x1="${cx}" y1="${cy - 20}" x2="${cx + 15}" y2="${cy}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />`;
      break;
    case 1: // Arms out
      arms = `<line x1="${cx}" y1="${cy - 20}" x2="${cx - 20}" y2="${cy - 20}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />
              <line x1="${cx}" y1="${cy - 20}" x2="${cx + 20}" y2="${cy - 20}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />`;
      break;
    case 2: // One arm up
      arms = `<line x1="${cx}" y1="${cy - 20}" x2="${cx - 15}" y2="${cy - 35}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />
              <line x1="${cx}" y1="${cy - 20}" x2="${cx + 15}" y2="${cy}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />`;
      break;
    case 3: // Both arms up
      arms = `<line x1="${cx}" y1="${cy - 20}" x2="${cx - 12}" y2="${cy - 38}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />
              <line x1="${cx}" y1="${cy - 20}" x2="${cx + 12}" y2="${cy - 38}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />`;
      break;
  }
  
  // Legs - vary based on pose
  let legs = '';
  switch (variation) {
    case 0: // Standing
      legs = `<line x1="${cx}" y1="${cy + 5}" x2="${cx - 10}" y2="${cy + 30}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />
              <line x1="${cx}" y1="${cy + 5}" x2="${cx + 10}" y2="${cy + 30}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />`;
      break;
    case 1: // Wide stance
      legs = `<line x1="${cx}" y1="${cy + 5}" x2="${cx - 18}" y2="${cy + 30}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />
              <line x1="${cx}" y1="${cy + 5}" x2="${cx + 18}" y2="${cy + 30}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />`;
      break;
    case 2: // One leg lifted
      legs = `<line x1="${cx}" y1="${cy + 5}" x2="${cx - 10}" y2="${cy + 30}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />
              <line x1="${cx}" y1="${cy + 5}" x2="${cx + 15}" y2="${cy + 15}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />`;
      break;
    case 3: // Jumping
      legs = `<line x1="${cx}" y1="${cy + 5}" x2="${cx - 15}" y2="${cy + 25}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />
              <line x1="${cx}" y1="${cy + 5}" x2="${cx + 15}" y2="${cy + 25}" stroke="url(#poseGradient)" stroke-width="3" stroke-linecap="round" />`;
      break;
  }
  
  // Step number
  const stepLabel = `<text x="${cx}" y="${cy + 45}" text-anchor="middle" font-size="10" fill="#888">${step}</text>`;
  
  return head + body + arms + legs + stepLabel;
}
