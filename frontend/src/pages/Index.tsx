import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ListeningIndicator } from '@/components/ListeningIndicator';
import NeonReels from '@/components/NeonReels';
import { useContinuousListening } from '@/hooks/useContinuousListening';
import { useShazamRecognition } from '@/hooks/useShazamRecognition';
import { useVideoQueue } from '@/hooks/useVideoQueue';
import { Mic, AlertCircle, Music } from 'lucide-react';

type AppState = 'idle' | 'listening' | 'error';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [latestQuery, setLatestQuery] = useState('');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted so users can hear the music

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
    if (text.trim() && text.trim() !== latestQuery) {
      // Clear old videos and search for new ones when new music is detected
      setLatestQuery(text.trim());
      // Unmute when new music is detected so users can hear it
      setIsMuted(false);
      addVideosFromQuery(text.trim(), true); // true = replace old videos
    }
  }, [addVideosFromQuery, latestQuery]);

  // Handle Shazam song identification - use full track data
  const handleShazamSongIdentified = useCallback((track: { 
    title: string; 
    subtitle: string;
    key?: string;
    images?: { coverart?: string; background?: string };
    url?: string;
  }) => {
    // Create a better search query using song title and artist
    // Format: "Song Title Artist" for better YouTube search results
    const searchQuery = `${track.title} ${track.subtitle}`.trim();
    
    // Only search if it's a different song (check by track key if available)
    const trackKey = track.key || searchQuery;
    if (searchQuery && trackKey !== latestQuery) {
      console.log('🎵 Shazam identified:', {
        title: track.title,
        artist: track.subtitle,
        key: track.key,
        coverArt: track.images?.coverart,
        url: track.url,
      });
      
      setLatestQuery(trackKey);
      setIsMuted(false);
      // Search YouTube with the identified song
      addVideosFromQuery(searchQuery, true);
    }
  }, [addVideosFromQuery, latestQuery]);

  // Shazam music recognition - fires API every 5 seconds (controlled by interval)
  const {
    isListening: isShazamListening,
    isProcessing: isShazamProcessing,
    error: shazamError,
    currentTrack,
    startListening: startShazam,
    stopListening: stopShazam,
    setEnabled: setShazamEnabled,
  } = useShazamRecognition({
    autoStart: false,
    captureDuration: 5000, // 5 seconds audio capture
    intervalMs: 5000, // Fire API every 5 seconds (not continuously)
    enabled: true, // Interval flag - set to false to disable
    onSongIdentified: handleShazamSongIdentified,
  });

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

  // Auto-search when new transcript is detected (different from previous)
  useEffect(() => {
    if (currentTranscript && currentTranscript.trim() && currentTranscript.trim() !== latestQuery) {
      // Debounce to avoid too many searches
      const timer = setTimeout(() => {
        setLatestQuery(currentTranscript.trim());
        // Unmute when new music is detected so users can hear the changing music
        setIsMuted(false);
        addVideosFromQuery(currentTranscript.trim(), true); // true = replace old videos with new ones
      }, 1000); // Wait 1 second after transcript changes

      return () => clearTimeout(timer);
    }
  }, [currentTranscript, latestQuery, addVideosFromQuery]);

  const handleStartListening = useCallback(() => {
    clearQueue();
    setLatestQuery('');
    setAppState('listening');
    // Start both Shazam and speech recognition
    startShazam();
    startListening();
  }, [clearQueue, startListening, startShazam]);

  const handleListenAgain = useCallback(() => {
    stopListening();
    stopShazam();
    setAppState('idle');
    setTimeout(() => {
      handleStartListening();
    }, 100);
  }, [stopListening, stopShazam, handleStartListening]);

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
  const showListeningIndicator = appState === 'listening' || (hasVideos && (isListening || isShazamListening));
  const isProcessing = isShazamProcessing || isSearching;

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

    // Show videos with listening indicator at top
    if (hasVideos) {
      return (
        <div className="flex h-full w-full flex-col">
          {/* Beautiful Listening Indicator at top */}
          {showListeningIndicator && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="shrink-0 bg-gradient-to-r from-background via-background/98 to-background backdrop-blur-xl shadow-lg relative z-30"
            >
              {/* Gradient separator at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm" />
              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-4">
                  {/* Animated Microphone Icon */}
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      animate={isListening ? {
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                      } : {}}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <motion.div
                      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg"
                      animate={isListening ? { scale: [1, 1.05, 1] } : {}}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Mic className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                    </motion.div>
                  </div>

                  {/* Status Text */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {isListening ? 'Listening to music...' : 'Processing audio...'}
                      </span>
                      {isListening && (
                        <div className="flex items-center gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="h-2 w-2 rounded-full bg-primary"
                              animate={{
                                y: [0, -6, 0],
                                opacity: [0.5, 1, 0.5],
                              }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut",
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                {currentTrack && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2"
                  >
                    {currentTrack.images?.coverart && (
                      <img 
                        src={currentTrack.images.coverart} 
                        alt={currentTrack.title}
                        className="h-6 w-6 rounded object-cover"
                      />
                    )}
                    <span className="text-xs font-medium text-primary/90 truncate max-w-md">
                      🎵 <span className="font-semibold">{currentTrack.title}</span> by {currentTrack.subtitle}
                    </span>
                  </motion.div>
                )}
                {currentTranscript && !currentTrack && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-medium text-primary/80 truncate max-w-md"
                  >
                    Detected: "{currentTranscript}"
                  </motion.span>
                )}
                {isProcessing && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground"
                  >
                    {isShazamProcessing ? 'Identifying song...' : 'Searching for dance videos...'}
                  </motion.span>
                )}
                  </div>
                </div>

                {/* Search Status Badge */}
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 ring-1 ring-primary/20"
                  >
                    <motion.div
                      className="h-2 w-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-xs font-medium text-primary">Searching</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Videos below - NeonReels handles full screen */}
          <NeonReels 
            videos={videos}
            currentIndex={currentIndex}
            onNext={goToNext}
            onPrevious={goToPrevious}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            autoPlay={true}
            navbarHeight={showListeningIndicator ? 80 : 0}
          />
        </div>
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
    <div className="flex h-screen w-full flex-col bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={hasVideos ? 'feed' : appState}
          className={`flex flex-1 ${hasVideos ? '' : 'items-center justify-center'}`}
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
