import { useState } from "react";
import { Heart } from "lucide-react";

interface NeonLikeButtonProps {
  hue: number;
  onLike?: () => void;
}

const NeonLikeButton = ({ hue, onLike }: NeonLikeButtonProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [rings, setRings] = useState<number[]>([]);

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    
    if (newLiked) {
      setShowBurst(true);
      setRings(prev => [...prev, Date.now()]);
      setTimeout(() => setShowBurst(false), 400);
      setTimeout(() => {
        setRings(prev => prev.slice(1));
      }, 600);
    }
    
    onLike?.();
  };

  const glowColor = `hsl(${hue}, 100%, 60%)`;
  const glowColorLight = `hsl(${hue}, 100%, 70%)`;

  return (
    <button
      onClick={handleLike}
      className="relative p-4 rounded-full transition-all duration-300 group"
      style={{
        background: isLiked 
          ? `linear-gradient(135deg, ${glowColor}20, ${glowColor}10)` 
          : 'transparent',
      }}
    >
      {/* Pulsing rings on like */}
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
          transform: isLiked ? 'scale(1.5)' : 'scale(1)',
        }}
      />

      {/* Heart icon */}
      <Heart
        size={32}
        className={`relative z-10 transition-all duration-300 ${
          showBurst ? 'animate-like-burst' : ''
        }`}
        fill={isLiked ? glowColor : 'none'}
        stroke={isLiked ? glowColor : glowColorLight}
        strokeWidth={2}
        style={{
          filter: isLiked 
            ? `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 0 20px ${glowColor}) drop-shadow(0 0 30px ${glowColor})`
            : `drop-shadow(0 0 5px ${glowColor}50)`,
        }}
      />

      {/* Floating particles when liked */}
      {isLiked && (
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
    </button>
  );
};

export default NeonLikeButton;
