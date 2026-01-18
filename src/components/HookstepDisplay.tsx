import { Music, Clock, Users, Disc, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

interface HookstepDisplayProps {
  data: HookstepData;
}

export function HookstepDisplay({ data }: HookstepDisplayProps) {
  const youtubeEmbedUrl = data.youtube_video_id
    ? `https://www.youtube.com/embed/${data.youtube_video_id}${
        data.youtube_timestamp_seconds ? `?start=${data.youtube_timestamp_seconds}` : ''
      }&autoplay=0`
    : null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      {/* Song Info Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-card to-secondary/10 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {data.song_title}
              </CardTitle>
              {data.movie_name && (
                <p className="text-lg text-muted-foreground mt-1">
                  from <span className="font-semibold text-foreground">{data.movie_name}</span>
                  {data.release_year && ` (${data.release_year})`}
                </p>
              )}
            </div>
            {data.hookstep_time_start && data.hookstep_time_end && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Clock className="w-4 h-4 mr-1" />
                Hookstep: {data.hookstep_time_start} - {data.hookstep_time_end}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            {data.singers && data.singers.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Singers:</span>
                <span>{data.singers.join(', ')}</span>
              </div>
            )}
            {data.music_director && (
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Music:</span>
                <span>{data.music_director}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* YouTube Embed */}
      {youtubeEmbedUrl && (
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-5 h-5 text-red-500" />
              Official Video (Hookstep Timestamp)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-video">
              <iframe
                src={youtubeEmbedUrl}
                title={`${data.song_title} - Official Video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hookstep Breakdown */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Hookstep Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {data.hookstep_description.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                  {index + 1}
                </span>
                <p className="text-base leading-relaxed pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Stick Figure Visualization */}
      {data.stick_figure_svg && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl">Pose Sequence</CardTitle>
            <p className="text-sm text-muted-foreground">
              Visual guide showing key positions of the hookstep
            </p>
          </CardHeader>
          <CardContent>
            <div 
              className="w-full bg-gradient-to-r from-background via-card to-background rounded-lg p-4"
              dangerouslySetInnerHTML={{ __html: data.stick_figure_svg }}
            />
            <Separator className="my-4" />
            <div className="flex justify-center gap-8 text-xs text-muted-foreground">
              <span>1 = Start</span>
              <span>→</span>
              <span>2 = Transition</span>
              <span>→</span>
              <span>3 = Peak</span>
              <span>→</span>
              <span>4 = End</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Copyright Notice */}
      <p className="text-center text-xs text-muted-foreground px-4">
        Video content is embedded from official YouTube channels. 
        Choreography descriptions are for educational/personal practice only.
      </p>
    </div>
  );
}
