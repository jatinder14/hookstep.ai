import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { YouTubeVideo } from '@/hooks/useYouTubeSearch';

interface VideoFeedProps {
  videos: YouTubeVideo[];
  onListenAgain: () => void;
  searchQuery?: string;
}

export function VideoFeed({ videos, onListenAgain, searchQuery }: VideoFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const currentVideo = videos[currentIndex];

  const goToNext = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, videos.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        goToPrevious();
      } else if (e.key === 'm') {
        setIsMuted(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  // Handle touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  // Handle wheel scroll
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 50) {
      goToNext();
    } else if (e.deltaY < -50) {
      goToPrevious();
    }
  }, [goToNext, goToPrevious]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  if (!currentVideo) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-xl text-muted-foreground">No videos found</p>
        <Button onClick={onListenAgain} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentVideo.id}
          className="absolute inset-0"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* YouTube Embed */}
          <iframe
            src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${currentVideo.id}&controls=0&modestbranding=1&rel=0&playsinline=1`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay UI */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
        {/* Top bar */}
        <div className="pointer-events-auto flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4">
          {searchQuery && (
            <div className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
              <p className="text-sm text-white">🎵 "{searchQuery}"</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-white hover:bg-white/20"
            onClick={onListenAgain}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>

        {/* Bottom info */}
        <div className="pointer-events-auto bg-gradient-to-t from-black/80 to-transparent p-4 pb-8">
          <div className="flex items-end justify-between">
            <div className="flex-1 pr-4">
              <h3 className="line-clamp-2 text-lg font-semibold text-white">
                {currentVideo.title}
              </h3>
              <p className="mt-1 text-sm text-white/70">
                @{currentVideo.channelTitle}
              </p>
            </div>
            
            {/* Side controls */}
            <div className="flex flex-col gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation hints */}
      <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 opacity-50">
        {currentIndex > 0 && (
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ChevronUp className="h-8 w-8 text-white" />
          </motion.div>
        )}
        <span className="rounded-full bg-white/20 px-2 py-1 text-xs text-white backdrop-blur-sm">
          {currentIndex + 1}/{videos.length}
        </span>
        {currentIndex < videos.length - 1 && (
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ChevronDown className="h-8 w-8 text-white" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
