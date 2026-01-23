import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Upload, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface AudioInputProps {
  onSearch: (query: string, type: 'text' | 'audio') => void;
  isLoading: boolean;
}

export function AudioInput({ onSearch, isLoading }: AudioInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [textQuery, setTextQuery] = useState('');
  const [audioDescription, setAudioDescription] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = () => {
        // We're using this for timing/feedback, actual recognition uses text
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 20) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      toast({
        title: "Recording started",
        description: "Hum or play the song near your microphone (max 20 seconds)",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access or use text search instead",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording stopped",
        description: "Please describe what you were humming/playing in the text box below",
      });
    }
  }, [isRecording, toast]);

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (textQuery.trim()) {
      onSearch(textQuery.trim(), 'text');
    }
  };

  const handleAudioDescriptionSearch = () => {
    if (audioDescription.trim()) {
      onSearch(audioDescription.trim(), 'audio');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Audio uploaded",
      description: "Please describe the song in the text box below for identification",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-primary/20">
      <CardContent className="p-6">
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="record" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Record
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <form onSubmit={handleTextSearch} className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter song name, movie, or lyrics..."
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  className="pr-12 h-12 text-lg bg-background/50"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10"
                  disabled={isLoading || !textQuery.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Try: "Chaiyya Chaiyya", "Lungi Dance", "Naatu Naatu"
              </p>
            </form>
          </TabsContent>

          <TabsContent value="record" className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                className={`w-24 h-24 rounded-full transition-all ${
                  isRecording ? 'animate-pulse' : ''
                }`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
              >
                {isRecording ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </Button>
              
              {isRecording && (
                <div className="text-center">
                  <p className="text-2xl font-mono text-primary">
                    {recordingTime}s / 20s
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Hum or play the song...
                  </p>
                </div>
              )}

              {!isRecording && recordingTime > 0 && (
                <div className="w-full space-y-3">
                  <Input
                    placeholder="Describe what you hummed (e.g., 'upbeat song from RRR movie')"
                    value={audioDescription}
                    onChange={(e) => setAudioDescription(e.target.value)}
                    className="h-12"
                  />
                  <Button
                    onClick={handleAudioDescriptionSearch}
                    disabled={isLoading || !audioDescription.trim()}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : null}
                    Identify Song
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <label className="w-full cursor-pointer">
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/60 transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-primary/60" />
                  <p className="text-lg font-medium">Drop audio file here</p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (MP3, WAV, M4A)
                  </p>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="w-full space-y-3">
                <Input
                  placeholder="Describe the uploaded audio..."
                  value={audioDescription}
                  onChange={(e) => setAudioDescription(e.target.value)}
                  className="h-12"
                />
                <Button
                  onClick={handleAudioDescriptionSearch}
                  disabled={isLoading || !audioDescription.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : null}
                  Identify Song
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
