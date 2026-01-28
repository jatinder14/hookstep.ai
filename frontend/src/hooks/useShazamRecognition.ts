import { useState, useCallback, useRef, useEffect } from 'react';
import { useShazam, type ShazamTrack } from './useShazam';
import { useAudioCapture } from './useAudioCapture';

interface UseShazamRecognitionOptions {
  autoStart?: boolean;
  captureDuration?: number; // Duration to capture audio in ms (Shazam needs ~3-5 seconds)
  intervalMs?: number; // How often to check for new songs (default: 5000ms = 5 seconds)
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
 * Hook that listens to audio and identifies songs using Shazam API at intervals
 * 
 * This hook:
 * 1. Captures audio from microphone at specified intervals (default: every 5 seconds)
 * 2. Sends audio samples to Shazam API
 * 3. Identifies songs
 * 4. Calls onSongIdentified callback when a new song is detected
 * 
 * Uses an interval flag to control when API calls are made - prevents continuous firing
 */
export function useShazamRecognition({
  autoStart = false,
  captureDuration = 5000, // 5 seconds - Shazam needs at least 3-5 seconds
  intervalMs = 5000, // Default: Check every 5 seconds
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
      
      if (timeSinceLastCall < intervalMs) {
        console.log(`⏳ Skipping API call - only ${timeSinceLastCall}ms since last call (need ${intervalMs}ms)`);
        return;
      }

      // Update last call time before making API call
      lastApiCallTimeRef.current = now;
      setIsProcessing(true);
      
      console.log('🎵 Calling Shazam API (5 second interval enforced)');
      identifySong(audioBlob)
        .then((response) => {
          if (response?.matches?.[0]?.track) {
            const track = response.matches[0].track;
            // Only update if it's a different song
            if (track.key !== lastTrackKeyRef.current) {
              lastTrackKeyRef.current = track.key;
              setCurrentTrack(track);
              onSongIdentified?.(track);
              console.log('✅ New song identified:', track.title);
            } else {
              console.log('🔄 Same song detected, skipping update');
            }
          } else {
            console.log('⚠️ No song match found in Shazam response');
          }
        })
        .catch((err) => {
          console.error('❌ Error identifying song:', err);
        })
        .finally(() => {
          setIsProcessing(false);
          console.log('✅ Shazam API call completed');
        });
    } else if (audioBlob && !isEnabled) {
      // If disabled, just clear the blob without processing
      console.log('⏸️ Shazam recognition disabled, skipping API call');
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
      // Check if we should skip (already capturing/processing or disabled)
      if (!isEnabled || isCapturingRef.current || isProcessingRef.current) {
        console.log('⏭️ Skipping Shazam call - already processing or disabled');
        return;
      }

      // Check timing before starting capture - but don't block if it's the first call
      const now = Date.now();
      const timeSinceLastCall = now - lastApiCallTimeRef.current;
      
      // Allow first call (if lastApiCallTimeRef is 0 or very old) or if enough time has passed
      if (lastApiCallTimeRef.current > 0 && timeSinceLastCall < intervalMs) {
        const waitTime = intervalMs - timeSinceLastCall;
        console.log(`⏳ Waiting ${waitTime}ms before next capture (${timeSinceLastCall}ms since last API call)`);
        setTimeout(() => {
          // Double-check we're still good to proceed
          if (!isCapturingRef.current && !isProcessingRef.current && isEnabled) {
            console.log('🎵 Starting audio capture (after wait)');
            startCapture();
          }
        }, waitTime);
        return;
      }

      // Start capture - timing will be checked again in useEffect before API call
      console.log('🎵 Starting audio capture');
      startCapture();
    };

    // Initial capture after a short delay
    setTimeout(captureAndIdentify, 1000);

    // Set up interval for periodic recognition (exactly every 5 seconds)
    intervalRef.current = setInterval(captureAndIdentify, intervalMs);
    console.log(`⏰ Shazam recognition started - will call API every ${intervalMs}ms (${intervalMs / 1000}s)`);
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
