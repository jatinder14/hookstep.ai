import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ListeningIndicator } from '@/components/ListeningIndicator';
import { VideoFeed } from '@/components/VideoFeed';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useYouTubeSearch } from '@/hooks/useYouTubeSearch';
import { Mic, AlertCircle, Music } from 'lucide-react';

type AppState = 'idle' | 'listening' | 'searching' | 'results' | 'error';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const { 
    isListening, 
    transcript, 
    interimTranscript, 
    error: speechError, 
    isSupported,
    startListening, 
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({ language: 'en-US' });

  const { 
    videos, 
    isLoading: isSearching, 
    error: searchError, 
    searchVideos 
  } = useYouTubeSearch();

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

  // Watch for transcript and trigger search after 3 seconds of listening
  useEffect(() => {
    if (appState === 'listening') {
      const timer = setTimeout(() => {
        const finalText = transcript || interimTranscript;
        if (finalText.trim()) {
          stopListening();
          setSearchQuery(finalText.trim());
          setAppState('searching');
          searchVideos(finalText.trim());
        } else {
          // No text detected, let user try again
          stopListening();
          setAppState('idle');
        }
      }, 3500); // 3.5 seconds

      return () => clearTimeout(timer);
    }
  }, [appState, transcript, interimTranscript, stopListening, searchVideos]);

  // Handle search completion
  useEffect(() => {
    if (appState === 'searching' && !isSearching) {
      if (videos.length > 0) {
        setAppState('results');
      } else if (searchError) {
        setAppState('error');
      } else {
        setAppState('error');
      }
    }
  }, [appState, isSearching, videos, searchError]);

  const handleStartListening = useCallback(() => {
    resetTranscript();
    setSearchQuery('');
    setAppState('listening');
    startListening();
  }, [resetTranscript, startListening]);

  const handleListenAgain = useCallback(() => {
    setAppState('idle');
    setTimeout(() => {
      handleStartListening();
    }, 100);
  }, [handleStartListening]);

  const handleRequestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
    } catch {
      setPermissionGranted(false);
    }
  };

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

    switch (appState) {
      case 'idle':
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

      case 'listening':
        return (
          <ListeningIndicator 
            isListening={isListening} 
            detectedText={transcript || interimTranscript || undefined}
          />
        );

      case 'searching':
        return (
          <div className="flex flex-col items-center justify-center gap-6 px-4 text-center">
            <motion.div
              className="h-16 w-16 rounded-full border-4 border-primary border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Finding Dance Videos</h2>
              <p className="mt-2 text-muted-foreground">
                Searching for "{searchQuery}"
              </p>
            </div>
          </div>
        );

      case 'results':
        return (
          <VideoFeed 
            videos={videos} 
            onListenAgain={handleListenAgain}
            searchQuery={searchQuery}
          />
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {searchError || speechError || 'No videos found'}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {searchQuery ? `Couldn't find videos for "${searchQuery}"` : 'No lyrics detected. Try again with clearer audio.'}
              </p>
            </div>
            <Button onClick={handleListenAgain} size="lg">
              <Mic className="mr-2 h-5 w-5" />
              Try Again
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={appState}
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
