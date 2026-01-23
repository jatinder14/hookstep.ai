import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

interface ListeningIndicatorProps {
  isListening: boolean;
  detectedText?: string;
}

export function ListeningIndicator({ isListening, detectedText }: ListeningIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center">
      {/* Animated microphone */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={isListening ? {
            scale: [1, 1.5, 1],
            opacity: [0.5, 0.2, 0.5],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/30"
          animate={isListening ? {
            scale: [1, 1.3, 1],
            opacity: [0.6, 0.3, 0.6],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />
        <motion.div 
          className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-primary"
          animate={isListening ? { scale: [1, 1.05, 1] } : {}}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Mic className="h-10 w-10 text-primary-foreground" />
        </motion.div>
      </div>

      {/* Status text */}
      <div className="space-y-2">
        <motion.h2 
          className="text-2xl font-bold text-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {isListening ? 'Listening to music...' : 'Processing...'}
        </motion.h2>
        
        {isListening && (
          <motion.div 
            className="flex items-center justify-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-2 w-2 rounded-full bg-primary"
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Detected text preview */}
      {detectedText && (
        <motion.div
          className="max-w-md rounded-lg bg-muted px-6 py-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-sm text-muted-foreground">Detected:</p>
          <p className="mt-1 text-lg font-medium text-foreground">"{detectedText}"</p>
        </motion.div>
      )}
    </div>
  );
}
