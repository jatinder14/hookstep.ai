import { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";
import NeonLikeButton from "./NeonLikeButton";
import NeonVolumeButton from "./NeonVolumeButton";
import type { YouTubeVideo } from "@/types/youtube";

interface NeonReelCardProps {
  video: YouTubeVideo;
  isActive: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  autoPlay?: boolean;
}

const NeonReelCard = ({ video, isActive, isMuted = false, onToggleMute, autoPlay = true }: NeonReelCardProps) => {
  const [hue, setHue] = useState(180);
  const [audioLevel, setAudioLevel] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(true);
  const animationRef = useRef<number>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoUrlRef = useRef<string>('');
  const currentVideoIdRef = useRef<string>('');
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Simulate audio-reactive color changes
  useEffect(() => {
    if (!isActive) return;

    let time = 0;
    const colorCycle = [180, 270, 300, 330, 210, 25]; // cyan, purple, magenta, pink, blue, orange
    let currentIndex = 0;

    const animate = () => {
      time += 0.02;
      
      // Smooth color transition simulating music tempo
      const progress = (Math.sin(time * 0.5) + 1) / 2;
      const nextIndex = (currentIndex + 1) % colorCycle.length;
      const interpolatedHue = colorCycle[currentIndex] + 
        (colorCycle[nextIndex] - colorCycle[currentIndex]) * progress;
      
      setHue(interpolatedHue);

      // Simulate audio level for visual effects
      const level = 0.4 + Math.sin(time * 2) * 0.3 + Math.sin(time * 5) * 0.1;
      setAudioLevel(Math.max(0.3, Math.min(1, level)));

      // Change color palette periodically
      if (progress > 0.99) {
        currentIndex = nextIndex;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  // Build YouTube embed URL - only update when video.id changes
  useEffect(() => {
    if (currentVideoIdRef.current !== video.id) {
      currentVideoIdRef.current = video.id;
      // Store the URL with autoplay enabled - we'll control play/pause via postMessage
      videoUrlRef.current = `https://www.youtube.com/embed/${video.id}?autoplay=${autoPlay ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${video.id}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&start=0`;
    }
  }, [video.id, autoPlay]); // Note: isMuted and isActive not in deps

  // Auto-play video when it becomes active after scrolling
  useEffect(() => {
    if (isActive && iframeRef.current && autoPlay) {
      // Delay to ensure iframe is ready
      const timeoutId = setTimeout(() => {
        try {
          // Play the video when it becomes active
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'playVideo',
              args: [],
            }),
            'https://www.youtube.com'
          );
          setIsPlaying(true);
        } catch (error) {
          console.warn('Failed to play video via postMessage:', error);
        }
      }, 200);
      
      return () => clearTimeout(timeoutId);
    } else if (!isActive && iframeRef.current) {
      // Pause video when it becomes inactive
      const timeoutId = setTimeout(() => {
        try {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'pauseVideo',
              args: [],
            }),
            'https://www.youtube.com'
          );
          setIsPlaying(false);
        } catch (error) {
          console.warn('Failed to pause video via postMessage:', error);
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isActive, autoPlay]);

  // Handle click to toggle play/pause
  const handleVideoClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't toggle if clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    const clickedButton = target.closest('button') || target.closest('[role="button"]');
    if (clickedButton) {
      return; // Let button handle its own click
    }

    e.preventDefault();
    e.stopPropagation();

    if (iframeRef.current && isActive) {
      try {
        const newPlayingState = !isPlaying;
        setIsPlaying(newPlayingState);
        
        // Use YouTube iframe API to toggle play/pause
        const message = JSON.stringify({
          event: 'command',
          func: newPlayingState ? 'playVideo' : 'pauseVideo',
          args: [],
        });
        
        iframeRef.current.contentWindow?.postMessage(message, 'https://www.youtube.com');
        
        console.log('Toggled video:', newPlayingState ? 'play' : 'pause', message);
      } catch (error) {
        console.warn('Failed to toggle play/pause via postMessage:', error);
      }
    }
  };

  // Control mute via postMessage to avoid restarting video
  useEffect(() => {
    if (isActive && iframeRef.current) {
      // Small delay to ensure iframe is ready
      const timeoutId = setTimeout(() => {
        try {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({
              event: 'command',
              func: isMuted ? 'mute' : 'unMute',
              args: [],
            }),
            'https://www.youtube.com'
          );
        } catch (error) {
          console.warn('Failed to control mute via postMessage:', error);
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isMuted, isActive]);

  const glowColor = `hsl(${hue}, 100%, 60%)`;
  const glowColorSoft = `hsl(${hue}, 80%, 50%)`;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background aurora effect */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, ${glowColor}15 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, ${glowColorSoft}10 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, hsl(${hue + 60}, 80%, 50%)08 0%, transparent 70%)
          `,
          opacity: audioLevel,
        }}
      />

      {/* Animated border glow */}
      <div 
        className="absolute inset-4 rounded-3xl transition-all duration-500 pointer-events-none"
        style={{
          boxShadow: `
            inset 0 0 60px ${glowColor}10,
            0 0 ${20 + audioLevel * 30}px ${glowColor}${Math.round(audioLevel * 40).toString(16).padStart(2, '0')},
            0 0 ${40 + audioLevel * 60}px ${glowColor}${Math.round(audioLevel * 20).toString(16).padStart(2, '0')}
          `,
          border: `1px solid ${glowColor}30`,
        }}
      />

      {/* Video container with neon frame */}
      <div 
        className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-2xl overflow-hidden group"
        style={{
          boxShadow: `
            0 0 ${10 + audioLevel * 20}px ${glowColor}60,
            0 0 ${30 + audioLevel * 40}px ${glowColor}30,
            inset 0 0 30px rgba(0,0,0,0.5)
          `,
        }}
      >
        {/* YouTube video iframe */}
        {isActive && (
          <iframe
            key={video.id} // Key ensures iframe only recreates when video changes
            ref={iframeRef}
            src={videoUrlRef.current || `https://www.youtube.com/embed/${video.id}?autoplay=${autoPlay ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${video.id}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&start=0`}
            className="absolute inset-0 w-full h-full z-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              border: 'none',
              pointerEvents: 'none', // Disable iframe pointer events so overlay can capture clicks
            }}
          />
        )}

        {/* Transparent overlay to capture scroll events and clicks over video */}
        {isActive && (
          <div
            className="absolute inset-0 z-20 cursor-pointer"
            style={{
              pointerEvents: 'auto',
            }}
            onClick={handleVideoClick}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Dispatch to parent via custom event
              const event = new CustomEvent('reel-wheel', {
                detail: {
                  deltaY: e.deltaY,
                  clientX: e.clientX,
                  clientY: e.clientY,
                },
                bubbles: true,
                cancelable: true,
              });
              window.dispatchEvent(event);
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              // Store touch start for tap detection
              touchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now(),
              };
              
              const event = new CustomEvent('reel-touchstart', {
                detail: { clientY: touch.clientY },
                bubbles: true,
              });
              window.dispatchEvent(event);
            }}
            onTouchEnd={(e) => {
              const touch = e.changedTouches[0];
              const event = new CustomEvent('reel-touchend', {
                detail: { clientY: touch.clientY },
                bubbles: true,
              });
              window.dispatchEvent(event);
              
              // Handle tap to toggle play/pause on mobile
              if (touchStartRef.current) {
                const timeDiff = Date.now() - touchStartRef.current.time;
                const moveDiff = Math.abs(touch.clientX - touchStartRef.current.x) + 
                               Math.abs(touch.clientY - touchStartRef.current.y);
                
                // If it's a quick tap (not a swipe), toggle play/pause
                if (timeDiff < 300 && moveDiff < 10) {
                  const target = e.target as HTMLElement;
                  if (!target.closest('button') && !target.closest('[role="button"]')) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleVideoClick(e as any);
                  }
                }
                touchStartRef.current = null;
              }
            }}
          />
        )}

        {/* Fallback thumbnail when not active */}
        {!isActive && (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover scale-150"
            style={{
              filter: `brightness(0.8) saturate(1.2)`,
            }}
          />
        )}

        {/* Overlay gradient */}
        <div 
          className="absolute inset-0 transition-all duration-700 pointer-events-none"
          style={{
            background: `
              linear-gradient(to top, 
                hsl(${hue}, 50%, 5%) 0%, 
                transparent 30%, 
                transparent 70%, 
                hsl(${hue}, 50%, 5%)40 100%
              )
            `,
          }}
        />

        {/* Breathing light effect on edges */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `
              inset 0 0 ${50 + audioLevel * 50}px ${glowColor}15,
              inset 0 ${-20 - audioLevel * 30}px ${60 + audioLevel * 40}px ${glowColor}10
            `,
          }}
        />

        {/* Play/Pause icon overlay - shows when paused */}
        {isActive && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-25">
            <div
              className="relative p-6 rounded-full transition-all duration-300"
              style={{
                background: `radial-gradient(circle, ${glowColor}20 0%, ${glowColor}10 50%, transparent 100%)`,
                boxShadow: `
                  0 0 40px ${glowColor}60,
                  0 0 80px ${glowColor}30,
                  inset 0 0 30px ${glowColor}20
                `,
              }}
            >
              <Play
                size={64}
                className="relative z-10"
                fill={glowColor}
                stroke={glowColor}
                strokeWidth={2}
                style={{
                  filter: `drop-shadow(0 0 20px ${glowColor}) drop-shadow(0 0 40px ${glowColor})`,
                  marginLeft: '4px', // Center the play icon visually
                }}
              />
              {/* Pulsing ring effect */}
              <div
                className="absolute inset-0 rounded-full animate-pulse-glow"
                style={{
                  border: `3px solid ${glowColor}`,
                  opacity: 0.6,
                }}
              />
            </div>
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2 pointer-events-none">
          <h3 
            className="text-lg font-semibold leading-tight line-clamp-2 transition-all duration-500"
            style={{
              color: 'white',
              textShadow: `0 0 20px ${glowColor}, 0 2px 10px rgba(0,0,0,0.8)`,
            }}
          >
            {video.title}
          </h3>
          <p 
            className="text-sm opacity-80 transition-all duration-500"
            style={{
              color: glowColor,
              textShadow: `0 0 10px ${glowColor}80`,
            }}
          >
            {video.channelTitle}
          </p>
        </div>

        {/* Action buttons - floating on right side */}
        <div className="absolute right-4 bottom-1/3 flex flex-col gap-4 pointer-events-auto z-30">
          {/* Volume button */}
          <div className="animate-float" style={{ animationDelay: '0.1s' }}>
            <NeonVolumeButton 
              hue={hue} 
              isMuted={isMuted}
              onToggle={onToggleMute}
            />
          </div>
          {/* Like button */}
          <div className="animate-float" style={{ animationDelay: '0s' }}>
            <NeonLikeButton hue={hue} />
          </div>
        </div>

        {/* Ambient particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full opacity-60"
              style={{
                background: glowColor,
                boxShadow: `0 0 ${4 + audioLevel * 6}px ${glowColor}`,
                left: `${10 + (i * 12)}%`,
                top: `${20 + Math.sin(i * 1.5) * 30}%`,
                animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Corner accent lights */}
      <div 
        className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 0% 0%, ${glowColor}20 0%, transparent 70%)`,
        }}
      />
      <div 
        className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 100%, ${glowColor}20 0%, transparent 70%)`,
        }}
      />
    </div>
  );
};

export default NeonReelCard;
