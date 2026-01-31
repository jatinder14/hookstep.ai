import { useState, useCallback, useRef, useEffect } from 'react';
import { useShazam, type ShazamTrack } from './useShazam';
import { useAudioCapture } from './useAudioCapture';

interface UseShazamRecognitionOptions {
  autoStart?: boolean;
  captureDuration?: number; // Duration to capture audio in ms (recognize needs ~3–5s)
  intervalMs?: number; // How often to check for new songs (default: 5000ms)
  onSongIdentified?: (track: ShazamTrack) => void;
  enabled?: boolean; // Flag to enable/disable recognition
}

interface UseShazamRecognitionReturn {
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
  currentTrack: ShazamTrack | null;
  startListening: () => void;
  stopListening: () => void;
  setEnabled: (enabled: boolean) => void;
}

/**
 * Listens to audio and identifies songs via the recognize API (Node-shazam) at intervals.
 *
 * 1. Captures microphone audio at specified intervals (default: 5 seconds)
 * 2. Sends samples to the recognize API (Supabase proxy or local Node server)
 * 3. Calls onSongIdentified when a new track is detected
 *
 * Interval is enforced to avoid continuous firing.
 */
export function useShazamRecognition({
  autoStart = false,
  captureDuration = 5000,
  intervalMs = 5000,
  onSongIdentified,
  enabled = true, // Default enabled
}: UseShazamRecognitionOptions = {}): UseShazamRecognitionReturn {
  const [currentTrack, setCurrentTrack] = useState<ShazamTrack | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackKeyRef = useRef<string | null>(null);
  const isCapturingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastApiCallTimeRef = useRef<number>(0); // Track last API call time to enforce 5-second interval

  const { identifySong, isLoading, error: shazamError } = useShazam();
  const {
    isListening,
    isProcessing: isCapturing,
    error: captureError,
    startListening: startCapture,
    stopListening: stopCapture,
    audioBlob,
  } = useAudioCapture({
    duration: captureDuration,
    autoStart: false,
  });

  // Update refs for interval check
  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Process audio when captured - only if enabled and enough time has passed
  useEffect(() => {
    if (audioBlob && !isProcessing && isEnabled) {
      // Check timing - ensure 5 seconds since last API call (allow first call when lastApiCallTimeRef is 0)
      const now = Date.now();
      const timeSinceLastCall = lastApiCallTimeRef.current === 0 
        ? intervalMs + 1 // Allow first call
        : now - lastApiCallTimeRef.current;
      
      if (timeSinceLastCall < intervalMs) return;

      lastApiCallTimeRef.current = now;
      setIsProcessing(true);

      identifySong(audioBlob)
        .then((response) => {
          if (response?.matches?.[0]?.track) {
            const track = response.matches[0].track;
            if (track.key !== lastTrackKeyRef.current) {
              lastTrackKeyRef.current = track.key;
              setCurrentTrack(track);
              onSongIdentified?.(track);
            }
          }
        })
        .catch((err) => {
          console.error('Error identifying song:', err);
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  }, [audioBlob, identifySong, isProcessing, isEnabled, onSongIdentified, intervalMs]);

  const startListening = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Initialize last call time to 0 to allow first call immediately
    lastApiCallTimeRef.current = 0;

    // Function to capture and identify - only if not already processing
    const captureAndIdentify = () => {
      if (!isEnabled || isCapturingRef.current || isProcessingRef.current) return;

      const now = Date.now();
      const timeSinceLastCall = now - lastApiCallTimeRef.current;

      if (lastApiCallTimeRef.current > 0 && timeSinceLastCall < intervalMs) {
        const waitTime = intervalMs - timeSinceLastCall;
        setTimeout(() => {
          if (!isCapturingRef.current && !isProcessingRef.current && isEnabled) {
            startCapture();
          }
        }, waitTime);
        return;
      }

      startCapture();
    };

    setTimeout(captureAndIdentify, 1000);
    intervalRef.current = setInterval(captureAndIdentify, intervalMs);
  }, [startCapture, intervalMs, isEnabled]);

  const stopListening = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopCapture();
  }, [stopCapture]);

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      // If disabling, stop current capture
      stopCapture();
    }
  }, [stopCapture]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && isEnabled) {
      startListening();
    }
    return () => {
      stopListening();
    };
  }, [autoStart, isEnabled, startListening, stopListening]);

  // Update when enabled changes
  useEffect(() => {
    if (!isEnabled && intervalRef.current) {
      stopListening();
    } else if (isEnabled && autoStart && !intervalRef.current) {
      startListening();
    }
  }, [isEnabled, autoStart, startListening, stopListening]);

  return {
    isListening,
    isProcessing: isProcessing || isCapturing,
    error: shazamError || captureError,
    currentTrack,
    startListening,
    stopListening,
    setEnabled,
  };
}
