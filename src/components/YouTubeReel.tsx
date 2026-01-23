import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  Heart, 
  Share2, 
  MoreVertical,
  Play,
  ArrowUp,
  ArrowDown,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { YouTubeVideo } from '@/hooks/useYouTubeSearch';

interface YouTubeReelProps {
  videos: YouTubeVideo[];
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  autoPlay?: boolean;
  className?: string;
}

export function YouTubeReel({
  videos,
  currentIndex,
  onNext,
  onPrevious,
  isMuted = false,
  onToggleMute,
  autoPlay = true,
  className = '',
}: YouTubeReelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);

  const currentVideo = videos[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        onNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        onPrevious();
      } else if (e.key === 'm' && onToggleMute) {
        onToggleMute();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrevious, onToggleMute]);

  // Handle touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    const diff = touchStartY.current - touchEndY;
    const timeDiff = touchEndTime - touchStartTime.current;
    
    // Only trigger swipe if it's quick and significant
    if (timeDiff < 300 && Math.abs(diff) > 50) {
      if (diff > 0) {
        onNext();
      } else {
        onPrevious();
      }
    }
  };

  // Handle wheel scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) > 50) {
        if (e.deltaY > 0) {
          onNext();
        } else {
          onPrevious();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [onNext, onPrevious]);

  // Reset loading state when video changes
  useEffect(() => {
    setIsLoading(true);
    setIsPlaying(autoPlay); // Ensure video plays when it changes
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [currentVideo?.id, autoPlay]);

  if (!currentVideo) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-black ${className}`}>
        <div className="text-center">
          <p className="text-xl text-white/70 mb-4">No videos available</p>
          <p className="text-sm text-white/50">Search for a song to get started</p>
        </div>
      </div>
    );
  }

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${currentVideo.id}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${currentVideo.id}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`;

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden bg-black ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentVideo.id}
          className="absolute inset-0"
          initial={{ y: '100%', opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '-100%', opacity: 0, scale: 1.05 }}
          transition={{ 
            type: 'spring', 
            damping: 25, 
            stiffness: 300,
            mass: 0.8
          }}
        >
          {/* YouTube Embed */}
          <div className="relative h-full w-full">
            <iframe
              ref={iframeRef}
              src={youtubeEmbedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
            />
            
            {/* Beautiful Loading overlay */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/60 to-black/80 backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <motion.div
                      className="h-16 w-16 rounded-full border-4 border-white/10"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-medium text-white/90"
                  >
                    Loading video...
                  </motion.p>
                </div>
              </motion.div>
            )}

            {/* Beautiful Play/Pause overlay */}
            {!isPlaying && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
                onClick={() => setIsPlaying(true)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative h-24 w-24 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl shadow-2xl ring-4 ring-white/20 flex items-center justify-center"
                >
                  <Play className="h-12 w-12 text-white ml-1" fill="white" strokeWidth={2} />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-white/20"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Overlay UI */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between z-10">
        {/* Top bar - beautiful gradient */}
        <div className="pointer-events-auto flex items-center justify-between p-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-4 py-2 backdrop-blur-xl ring-1 ring-white/10">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-white">
                Video {currentIndex + 1} of {videos.length}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Bottom section with video info and controls - Beautiful Design */}
        <div className="pointer-events-auto bg-gradient-to-t from-black via-black/95 to-black/80 p-6 pb-8 backdrop-blur-sm">
          <div className="flex items-end justify-between gap-6">
            {/* Video info - Enhanced */}
            <div className="flex-1 min-w-0 space-y-2">
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="line-clamp-2 text-xl font-bold text-white drop-shadow-lg"
              >
                {currentVideo.title}
              </motion.h3>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="h-1 w-1 rounded-full bg-primary" />
                <p className="text-sm font-medium text-white/90">
                  {currentVideo.channelTitle}
                </p>
              </motion.div>
              {currentVideo.description && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs text-white/70 line-clamp-2 leading-relaxed"
                >
                  {currentVideo.description}
                </motion.p>
              )}
            </div>

            {/* Right side controls - Beautiful glassmorphism */}
            <div className="flex flex-col gap-3 items-center">
              {/* Mute button */}
              {onToggleMute && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-14 w-14 rounded-full bg-gradient-to-br from-white/20 to-white/10 text-white backdrop-blur-xl shadow-xl ring-2 ring-white/20 hover:bg-white/30 hover:ring-white/40 border-0 transition-all"
                    onClick={onToggleMute}
                  >
                    {isMuted ? (
                      <VolumeX className="h-6 w-6" strokeWidth={2} />
                    ) : (
                      <Volume2 className="h-6 w-6" strokeWidth={2} />
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Like button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-14 w-14 rounded-full bg-gradient-to-br from-white/20 to-white/10 text-white backdrop-blur-xl shadow-xl ring-2 ring-white/20 hover:bg-white/30 hover:ring-white/40 border-0 transition-all"
                  onClick={() => {}}
                >
                  <Heart className="h-6 w-6" strokeWidth={2} />
                </Button>
              </motion.div>

              {/* Share button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-14 w-14 rounded-full bg-gradient-to-br from-white/20 to-white/10 text-white backdrop-blur-xl shadow-xl ring-2 ring-white/20 hover:bg-white/30 hover:ring-white/40 border-0 transition-all"
                  onClick={() => {}}
                >
                  <Share2 className="h-6 w-6" strokeWidth={2} />
                </Button>
              </motion.div>

              {/* More options */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-14 w-14 rounded-full bg-gradient-to-br from-white/20 to-white/10 text-white backdrop-blur-xl shadow-xl ring-2 ring-white/20 hover:bg-white/30 hover:ring-white/40 border-0 transition-all"
                  onClick={() => {}}
                >
                  <MoreVertical className="h-6 w-6" strokeWidth={2} />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Large Navigation Buttons - Left Side */}
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-20">
        {/* Previous Button */}
        {currentIndex > 0 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className="pointer-events-auto group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl shadow-2xl ring-2 ring-white/20 transition-all hover:ring-white/40"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowUp className="h-7 w-7 text-white drop-shadow-lg" strokeWidth={2.5} />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-full bg-white/10"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </motion.button>
        )}

        {/* Video Counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-full bg-gradient-to-br from-black/60 to-black/40 px-4 py-2 backdrop-blur-xl shadow-lg ring-1 ring-white/10"
        >
          <span className="text-xs font-semibold text-white">
            {currentIndex + 1} / {videos.length}
          </span>
        </motion.div>

        {/* Next Button */}
        {currentIndex < videos.length - 1 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="pointer-events-auto group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl shadow-2xl ring-2 ring-white/20 transition-all hover:ring-white/40"
          >
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="h-7 w-7 text-white drop-shadow-lg" strokeWidth={2.5} />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-full bg-white/10"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </motion.button>
        )}
      </div>

      {/* Beautiful Progress indicator */}
      {videos.length > 1 && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/30 backdrop-blur-sm z-30">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-lg shadow-primary/50"
            initial={{ width: '0%' }}
            animate={{ 
              width: `${((currentIndex + 1) / videos.length) * 100}%` 
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      )}
    </div>
  );
}
