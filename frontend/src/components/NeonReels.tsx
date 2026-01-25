import { useState, useRef, useEffect, useCallback } from "react";
import NeonReelCard from "./NeonReelCard";
import type { YouTubeVideo } from "@/types/youtube";

interface NeonReelsProps {
  videos: YouTubeVideo[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  autoPlay?: boolean;
  navbarHeight?: number;
}

const NeonReels = ({ 
  videos, 
  currentIndex: externalCurrentIndex,
  onIndexChange,
  onNext,
  onPrevious,
  isMuted = false,
  onToggleMute,
  autoPlay = true,
  navbarHeight = 80,
}: NeonReelsProps) => {
  const [internalCurrentIndex, setInternalCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  // Use external index if provided, otherwise use internal state
  const currentIndex = externalCurrentIndex !== undefined ? externalCurrentIndex : internalCurrentIndex;

  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (direction === 'down') {
      if (onNext) {
        onNext();
      } else if (onIndexChange) {
        const newIndex = Math.min(currentIndex + 1, videos.length - 1);
        if (newIndex !== currentIndex) {
          onIndexChange(newIndex);
        }
      } else {
        const newIndex = Math.min(currentIndex + 1, videos.length - 1);
        setInternalCurrentIndex(newIndex);
      }
    } else {
      if (onPrevious) {
        onPrevious();
      } else if (onIndexChange) {
        const newIndex = Math.max(currentIndex - 1, 0);
        if (newIndex !== currentIndex) {
          onIndexChange(newIndex);
        }
      } else {
        const newIndex = Math.max(currentIndex - 1, 0);
        setInternalCurrentIndex(newIndex);
      }
    }
  }, [currentIndex, onNext, onPrevious, onIndexChange, videos.length]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 50) {
      handleScroll('down');
    } else if (e.deltaY < -50) {
      handleScroll('up');
    }
  }, [handleScroll]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    touchEndY.current = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY.current;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleScroll('down');
      } else {
        handleScroll('up');
      }
    }
  }, [handleScroll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Window-level listeners to catch events even when hovering over iframe
    const handleWindowWheel = (e: WheelEvent) => {
      // Only handle if we're within the container bounds
      const rect = container.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (e.deltaY > 50) {
          handleScroll('down');
        } else if (e.deltaY < -50) {
          handleScroll('up');
        }
      }
    };

    // Listen for custom wheel events from overlay
    const handleCustomWheel = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const rect = container.getBoundingClientRect();
        if (
          customEvent.detail.clientX >= rect.left &&
          customEvent.detail.clientX <= rect.right &&
          customEvent.detail.clientY >= rect.top &&
          customEvent.detail.clientY <= rect.bottom
        ) {
          e.preventDefault();
          e.stopPropagation();
          if (customEvent.detail.deltaY > 50) {
            handleScroll('down');
          } else if (customEvent.detail.deltaY < -50) {
            handleScroll('up');
          }
        }
      }
    };

    // Listen for custom touch events from overlay
    const handleCustomTouchStart = (e: Event) => {
      const customEvent = e as CustomEvent;
      const rect = container.getBoundingClientRect();
      if (customEvent.detail) {
        touchStartY.current = customEvent.detail.clientY;
      }
    };

    const handleCustomTouchEnd = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        touchEndY.current = customEvent.detail.clientY;
        const diff = touchStartY.current - touchEndY.current;
        
        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            handleScroll('down');
          } else {
            handleScroll('up');
          }
        }
      }
    };

    const handleWindowTouchStart = (e: TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        touchStartY.current = touch.clientY;
      }
    };

    const handleWindowTouchEnd = (e: TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const touch = e.changedTouches[0];
      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        touchEndY.current = touch.clientY;
        const diff = touchStartY.current - touchEndY.current;
        
        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            handleScroll('down');
          } else {
            handleScroll('up');
          }
        }
      }
    };

    // Add listeners to container (for areas outside iframe)
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Add window-level listeners (to catch events over iframe)
    window.addEventListener('wheel', handleWindowWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', handleWindowTouchStart, { passive: true, capture: true });
    window.addEventListener('touchend', handleWindowTouchEnd, { passive: true, capture: true });
    
    // Listen for custom events from overlay
    window.addEventListener('reel-wheel', handleCustomWheel as EventListener);
    window.addEventListener('reel-touchstart', handleCustomTouchStart as EventListener);
    window.addEventListener('reel-touchend', handleCustomTouchEnd as EventListener);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWindowWheel, { capture: true });
      window.removeEventListener('touchstart', handleWindowTouchStart, { capture: true });
      window.removeEventListener('touchend', handleWindowTouchEnd, { capture: true });
      window.removeEventListener('reel-wheel', handleCustomWheel as EventListener);
      window.removeEventListener('reel-touchstart', handleCustomTouchStart as EventListener);
      window.removeEventListener('reel-touchend', handleCustomTouchEnd as EventListener);
    };
  }, [currentIndex, videos.length, handleScroll, handleWheel, handleTouchStart, handleTouchEnd]);

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No videos available</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-background overflow-hidden z-10"
      style={{
        top: `${navbarHeight}px`,
      }}
    >
      {/* Gradient separator at top - visual diff between navbar and reel */}
      <div className="absolute -top-px left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent z-30" />
      <div className="absolute -top-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-sm z-30" />
      <div className="absolute -top-[3px] left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary/10 to-transparent blur-md z-30" />
      
      {/* Progress indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {videos.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: i === currentIndex ? '24px' : '8px',
              background: i === currentIndex 
                ? 'linear-gradient(90deg, hsl(180, 100%, 60%), hsl(300, 100%, 60%))'
                : 'rgba(255,255,255,0.3)',
              boxShadow: i === currentIndex 
                ? '0 0 10px hsl(180, 100%, 60%), 0 0 20px hsl(300, 100%, 60%)'
                : 'none',
            }}
          />
        ))}
      </div>

      {/* Reels container with smooth scroll */}
      <div 
        className="h-full w-full transition-transform duration-700 ease-out"
        style={{
          transform: `translateY(-${currentIndex * 100}%)`,
        }}
      >
        {videos.map((video, index) => (
          <div 
            key={video.id}
            className="h-full w-full"
          >
            <NeonReelCard 
              video={video}
              isActive={index === currentIndex}
              isMuted={isMuted}
              onToggleMute={onToggleMute}
              autoPlay={autoPlay}
            />
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      {currentIndex < videos.length - 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div 
            className="w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-foreground/50 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

export default NeonReels;
