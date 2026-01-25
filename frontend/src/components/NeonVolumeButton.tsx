import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface NeonVolumeButtonProps {
  hue: number;
  isMuted: boolean;
  onToggle?: () => void;
}

const NeonVolumeButton = ({ hue, isMuted, onToggle }: NeonVolumeButtonProps) => {
  const [showBurst, setShowBurst] = useState(false);
  const [rings, setRings] = useState<number[]>([]);

  const handleToggle = () => {
    setShowBurst(true);
    setRings(prev => [...prev, Date.now()]);
    setTimeout(() => setShowBurst(false), 400);
    setTimeout(() => {
      setRings(prev => prev.slice(1));
    }, 600);
    
    onToggle?.();
  };

  const glowColor = `hsl(${hue}, 100%, 60%)`;
  const glowColorLight = `hsl(${hue}, 100%, 70%)`;

  return (
    <button
      onClick={handleToggle}
      className="relative p-4 rounded-full transition-all duration-300 group"
      style={{
        background: !isMuted 
          ? `linear-gradient(135deg, ${glowColor}20, ${glowColor}10)` 
          : 'transparent',
      }}
    >
      {/* Pulsing rings on toggle */}
      {rings.map((id) => (
        <span
          key={id}
          className="absolute inset-0 rounded-full animate-ring-pulse"
          style={{
            border: `2px solid ${glowColor}`,
          }}
        />
      ))}

      {/* Outer glow ring */}
      <span
        className="absolute inset-0 rounded-full opacity-50 blur-md transition-all duration-500"
        style={{
          background: `radial-gradient(circle, ${glowColor}40 0%, transparent 70%)`,
          transform: !isMuted ? 'scale(1.5)' : 'scale(1)',
        }}
      />

      {/* Volume icon */}
      {isMuted ? (
        <VolumeX
          size={32}
          className={`relative z-10 transition-all duration-300 ${
            showBurst ? 'animate-like-burst' : ''
          }`}
          fill="none"
          stroke={glowColorLight}
          strokeWidth={2}
          style={{
            filter: `drop-shadow(0 0 5px ${glowColor}50)`,
          }}
        />
      ) : (
        <Volume2
          size={32}
          className={`relative z-10 transition-all duration-300 ${
            showBurst ? 'animate-like-burst' : ''
          }`}
          fill="none"
          stroke={glowColor}
          strokeWidth={2}
          style={{
            filter: `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 0 20px ${glowColor}) drop-shadow(0 0 30px ${glowColor})`,
          }}
        />
      )}

      {/* Floating particles when unmuted */}
      {!isMuted && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="absolute w-1 h-1 rounded-full animate-float"
              style={{
                background: glowColor,
                boxShadow: `0 0 6px ${glowColor}`,
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}


      {/* Muted indicator - X overlay effect */}
      {isMuted && (
        <div 
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{
            opacity: 0.6,
          }}
        >
          <div 
            className="absolute w-12 h-0.5 rounded-full"
            style={{
              background: glowColorLight,
              transform: 'rotate(45deg)',
              boxShadow: `0 0 8px ${glowColorLight}`,
            }}
          />
          <div 
            className="absolute w-12 h-0.5 rounded-full"
            style={{
              background: glowColorLight,
              transform: 'rotate(-45deg)',
              boxShadow: `0 0 8px ${glowColorLight}`,
            }}
          />
        </div>
      )}
    </button>
  );
};

export default NeonVolumeButton;
