import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ListeningIndicator } from '@/components/ListeningIndicator';
import { VideoFeed } from '@/components/VideoFeed';
import { useContinuousListening } from '@/hooks/useContinuousListening';
import { useVideoQueue } from '@/hooks/useVideoQueue';
import { Mic, AlertCircle, Music } from 'lucide-react';

type AppState = 'idle' | 'listening' | 'error';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [latestQuery, setLatestQuery] = useState('');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const {
    videos,
    currentIndex,
    isLoading: isSearching,
    error: searchError,
    addVideosFromQuery,
    goToNext,
    goToPrevious,
    clearQueue,
  } = useVideoQueue();

  const handleNewTranscript = useCallback((text: string) => {
    if (text.trim()) {
      setLatestQuery(text.trim());
      addVideosFromQuery(text.trim());
    }
  }, [addVideosFromQuery]);

  const { 
    isListening, 
    currentTranscript, 
    error: speechError, 
    isSupported,
    startListening, 
    stopListening,
  } = useContinuousListening({ 
    language: 'en-US',
    onNewTranscript: handleNewTranscript,
    intervalMs: 3000,
  });

  // Check microphone permission
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissionGranted(true);
      } catch {
        setPermissionGranted(false);
      }
    };
    checkPermission();
  }, []);

  // Auto-start listening when permission is granted
  useEffect(() => {
    if (permissionGranted && appState === 'idle' && isSupported) {
      handleStartListening();
    }
  }, [permissionGranted, isSupported]);

  const handleStartListening = useCallback(() => {
    clearQueue();
    setLatestQuery('');
    setAppState('listening');
    startListening();
  }, [clearQueue, startListening]);

  const handleListenAgain = useCallback(() => {
    stopListening();
    setAppState('idle');
    setTimeout(() => {
      handleStartListening();
    }, 100);
  }, [stopListening, handleStartListening]);

  const handleRequestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
    } catch {
      setPermissionGranted(false);
    }
  };

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Show video feed when we have videos
  const hasVideos = videos.length > 0;

  // Render based on state
  const renderContent = () => {
    // Permission not granted
    if (permissionGranted === false) {
      return (
        <div className="flex flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Mic className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Microphone Access Required</h2>
            <p className="mt-2 text-muted-foreground">
              We need access to your microphone to listen to the music around you.
            </p>
          </div>
          <Button onClick={handleRequestPermission} size="lg">
            <Mic className="mr-2 h-5 w-5" />
            Grant Permission
          </Button>
        </div>
      );
    }

    // Browser doesn't support speech recognition
    if (!isSupported) {
      return (
        <div className="flex flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Browser Not Supported</h2>
            <p className="mt-2 text-muted-foreground">
              Please use Chrome, Edge, or Safari for speech recognition.
            </p>
          </div>
        </div>
      );
    }

    // Show video feed if we have videos (listening continues in background)
    if (hasVideos) {
      return (
        <VideoFeed 
          videos={videos}
          currentIndex={currentIndex}
          onNext={goToNext}
          onPrevious={goToPrevious}
          onListenAgain={handleListenAgain}
          searchQuery={latestQuery}
          isLoadingMore={isSearching}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      );
    }

    // Still listening, waiting for first results
    if (appState === 'listening') {
      return (
        <ListeningIndicator 
          isListening={isListening} 
          detectedText={currentTranscript || undefined}
        />
      );
    }

    // Idle state
    if (appState === 'idle') {
      return (
        <div className="flex flex-col items-center justify-center gap-8 px-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Music className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Club Dance Finder</h1>
            <p className="mt-2 text-muted-foreground">
              Tap to listen to the music and find dance videos
            </p>
          </div>
          <Button onClick={handleStartListening} size="lg" className="gap-2">
            <Mic className="h-5 w-5" />
            Start Listening
          </Button>
        </div>
      );
    }

    // Error state
    if (appState === 'error') {
      return (
        <div className="flex flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {searchError || speechError || 'Something went wrong'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              No lyrics detected. Try again with clearer audio.
            </p>
          </div>
          <Button onClick={handleListenAgain} size="lg">
            <Mic className="mr-2 h-5 w-5" />
            Try Again
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={hasVideos ? 'feed' : appState}
          className="flex flex-1 items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Index;
