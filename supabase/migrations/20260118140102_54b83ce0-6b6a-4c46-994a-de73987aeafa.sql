-- Create table to cache song identifications and hooksteps
CREATE TABLE public.song_hooksteps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_title TEXT NOT NULL,
  movie_name TEXT,
  release_year INTEGER,
  singers TEXT[],
  music_director TEXT,
  hookstep_description TEXT[] NOT NULL,
  hookstep_time_start TEXT,
  hookstep_time_end TEXT,
  youtube_video_id TEXT,
  youtube_timestamp_seconds INTEGER,
  stick_figure_svg TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read for cached data, no writes from client)
ALTER TABLE public.song_hooksteps ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached hooksteps
CREATE POLICY "Anyone can read hooksteps" 
ON public.song_hooksteps 
FOR SELECT 
USING (true);

-- Create index for faster song lookups
CREATE INDEX idx_song_title ON public.song_hooksteps USING gin(to_tsvector('english', song_title));
CREATE INDEX idx_movie_name ON public.song_hooksteps USING gin(to_tsvector('english', movie_name));