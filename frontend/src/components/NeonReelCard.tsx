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
  const [isMobile, setIsMobile] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
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

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                            (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track user interaction for mobile autoplay unlock
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
      // Remove listeners after first interaction
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };
    
    if (!userInteracted) {
      document.addEventListener('touchstart', handleUserInteraction, { once: true });
      document.addEventListener('click', handleUserInteraction, { once: true });
    }
    
    return () => {
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };
  }, [userInteracted]);

  // Build YouTube embed URL - only update when video.id changes
  useEffect(() => {
    if (currentVideoIdRef.current !== video.id) {
      currentVideoIdRef.current = video.id;
      // On mobile, start muted to allow autoplay (mobile browsers block autoplay with sound)
      // The user can unmute after interaction
      const shouldMuteForMobile = isMobile && !userInteracted;
      const effectiveMute = shouldMuteForMobile ? 1 : (isMuted ? 1 : 0);
      
      // Store the URL with autoplay enabled - we'll control play/pause via postMessage
      videoUrlRef.current = `https://www.youtube.com/embed/${video.id}?autoplay=${autoPlay ? 1 : 0}&mute=${effectiveMute}&loop=1&playlist=${video.id}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&start=0`;
    }
  }, [video.id, autoPlay, isMobile, userInteracted]); // Note: isMuted and isActive not in deps

  // Auto-play video when it becomes active - ALWAYS ensure it plays
  useEffect(() => {
    if (!isActive || !autoPlay) {
      // Pause video when it becomes inactive
      if (!isActive && iframeRef.current) {
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
      return;
    }

    // When video becomes active, ensure it plays
    if (!iframeRef.current) {
      // Iframe not ready yet, wait a bit and retry
      const checkInterval = setInterval(() => {
        if (iframeRef.current && isActive) {
          clearInterval(checkInterval);
          // Trigger play attempt
          const attemptPlay = () => {
            try {
              // On mobile, ensure video is muted initially for autoplay to work
              if (isMobile && !userInteracted) {
                iframeRef.current?.contentWindow?.postMessage(
                  JSON.stringify({
                    event: 'command',
                    func: 'mute',
                    args: [],
                  }),
                  'https://www.youtube.com'
                );
              }
              
              // Play the video
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
              console.warn('Failed to play video:', error);
            }
          };
          setTimeout(attemptPlay, 300);
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }

    // Iframe is ready, play immediately
    let retryCount = 0;
    const maxRetries = isMobile ? 15 : 10; // More retries to ensure it plays
    
    const attemptPlay = () => {
      if (!isActive || !iframeRef.current) return;
      
      try {
        // On mobile, ensure video is muted initially for autoplay to work
        if (isMobile && !userInteracted) {
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'mute',
              args: [],
            }),
            'https://www.youtube.com'
          );
        }
        
        // Play the video when it becomes active
        iframeRef.current.contentWindow?.postMessage(
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
        // Retry if failed and haven't exceeded max retries
        if (retryCount < maxRetries && isActive) {
          retryCount++;
          const delay = isMobile ? 400 * retryCount : 250 * retryCount;
          setTimeout(attemptPlay, delay);
        }
      }
    };
    
    // Start playing immediately, then retry if needed
    attemptPlay();
    
    // Also set up a delayed attempt to ensure it plays
    const initialDelay = isMobile ? 800 : 400;
    const timeoutId = setTimeout(attemptPlay, initialDelay);
    
    // Keep trying periodically to ensure video is playing
    const keepAliveInterval = setInterval(() => {
      if (isActive && !isPlaying && iframeRef.current) {
        attemptPlay();
      }
    }, 2000); // Check every 2 seconds
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(keepAliveInterval);
    };
  }, [isActive, autoPlay, video.id, isMobile, userInteracted, isPlaying]);

  // Listen for YouTube iframe API events and ensure continuous playback
  useEffect(() => {
    if (!isActive || !autoPlay) return;

    const handleMessage = (event: MessageEvent) => {
      // Only process messages from YouTube
      if (event.origin !== 'https://www.youtube.com') return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Handle YouTube iframe API events
        if (data.event === 'onStateChange') {
          // YouTube player state: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
          if (data.info === 1) {
            // Video is playing
            setIsPlaying(true);
          } else if (data.info === 2 || data.info === -1) {
            // Video is paused or unstarted - ALWAYS restart if it should be playing
            if (isActive && autoPlay) {
              const delay = isMobile ? 200 : 100;
              setTimeout(() => {
                if (!isActive || !iframeRef.current) return;
                try {
                  // On mobile, ensure muted if no user interaction yet
                  if (isMobile && !userInteracted) {
                    iframeRef.current.contentWindow?.postMessage(
                      JSON.stringify({
                        event: 'command',
                        func: 'mute',
                        args: [],
                      }),
                      'https://www.youtube.com'
                    );
                  }
                  
                  iframeRef.current.contentWindow?.postMessage(
                    JSON.stringify({
                      event: 'command',
                      func: 'playVideo',
                      args: [],
                    }),
                    'https://www.youtube.com'
                  );
                  setIsPlaying(true);
                } catch (error) {
                  console.warn('Failed to resume video playback:', error);
                }
              }, delay);
            } else {
              setIsPlaying(false);
            }
          } else if (data.info === 0) {
            // Video ended - restart immediately for looping
            if (isActive && autoPlay) {
              const delay = isMobile ? 200 : 100;
              setTimeout(() => {
                if (!isActive || !iframeRef.current) return;
                try {
                  // On mobile, ensure muted if no user interaction yet
                  if (isMobile && !userInteracted) {
                    iframeRef.current.contentWindow?.postMessage(
                      JSON.stringify({
                        event: 'command',
                        func: 'mute',
                        args: [],
                      }),
                      'https://www.youtube.com'
                    );
                  }
                  
                  iframeRef.current.contentWindow?.postMessage(
                    JSON.stringify({
                      event: 'command',
                      func: 'playVideo',
                      args: [],
                    }),
                    'https://www.youtube.com'
                  );
                  setIsPlaying(true);
                } catch (error) {
                  console.warn('Failed to restart video after end:', error);
                }
              }, delay);
            }
          } else if (data.info === 3) {
            // Buffering - video is loading, keep isPlaying as true
            setIsPlaying(true);
          }
        } else if (data.event === 'onReady') {
          // Iframe API is ready - ALWAYS ensure video plays
          if (isActive && autoPlay) {
            const delay = isMobile ? 600 : 300;
            setTimeout(() => {
              if (!isActive || !iframeRef.current) return;
              try {
                // On mobile, ensure muted for autoplay
                if (isMobile && !userInteracted) {
                  iframeRef.current.contentWindow?.postMessage(
                    JSON.stringify({
                      event: 'command',
                      func: 'mute',
                      args: [],
                    }),
                    'https://www.youtube.com'
                  );
                }
                
                iframeRef.current.contentWindow?.postMessage(
                  JSON.stringify({
                    event: 'command',
                    func: 'playVideo',
                    args: [],
                  }),
                  'https://www.youtube.com'
                );
                setIsPlaying(true);
              } catch (error) {
                console.warn('Failed to play video on ready:', error);
              }
            }, delay);
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isActive, autoPlay, isMobile, userInteracted]);

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
          // On mobile, if user hasn't interacted yet, keep muted for autoplay
          // After interaction, respect the isMuted prop
          const shouldMute = isMobile && !userInteracted ? true : isMuted;
          
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({
              event: 'command',
              func: shouldMute ? 'mute' : 'unMute',
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
  }, [isMuted, isActive, isMobile, userInteracted]);


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
            playsInline
            style={{
              border: 'none',
              pointerEvents: 'none', // Disable iframe pointer events so overlay can capture clicks
            }}
            onLoad={() => {
              // When iframe loads, ALWAYS ensure video plays if it should be active
              if (isActive && autoPlay && iframeRef.current) {
                // Try multiple times to ensure it plays
                const playAttempts = [300, 600, 1000, 1500]; // Multiple attempts with increasing delays
                
                playAttempts.forEach((delay, index) => {
                  setTimeout(() => {
                    if (!isActive || !iframeRef.current) return;
                    try {
                      // On mobile, ensure muted for autoplay
                      if (isMobile && !userInteracted) {
                        iframeRef.current.contentWindow?.postMessage(
                          JSON.stringify({
                            event: 'command',
                            func: 'mute',
                            args: [],
                          }),
                          'https://www.youtube.com'
                        );
                      }
                      
                      iframeRef.current.contentWindow?.postMessage(
                        JSON.stringify({
                          event: 'command',
                          func: 'playVideo',
                          args: [],
                        }),
                        'https://www.youtube.com'
                      );
                      setIsPlaying(true);
                    } catch (error) {
                      if (index === playAttempts.length - 1) {
                        console.warn('Failed to play video on iframe load after all attempts:', error);
                      }
                    }
                  }, delay);
                });
              }
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
