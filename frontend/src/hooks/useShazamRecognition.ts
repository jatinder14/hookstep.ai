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

  // Process audio when captured - only if enabled
  useEffect(() => {
    if (audioBlob && !isProcessing && isEnabled) {
      setIsProcessing(true);
      identifySong(audioBlob)
        .then((response) => {
          if (response?.matches?.[0]?.track) {
            const track = response.matches[0].track;
            // Only update if it's a different song
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
    } else if (audioBlob && !isEnabled) {
      // If disabled, just clear the blob without processing
      console.log('Shazam recognition disabled, skipping API call');
    }
  }, [audioBlob, identifySong, isProcessing, isEnabled, onSongIdentified]);

  const startListening = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Function to capture and identify - only if not already processing
    const captureAndIdentify = () => {
      // Check if we should skip (already capturing/processing or disabled)
      if (!isEnabled || isCapturingRef.current || isProcessingRef.current) {
        return;
      }

      // Start capture
      startCapture();
    };

    // Initial capture after a short delay
    setTimeout(captureAndIdentify, 1000);

    // Set up interval for periodic recognition (every 5 seconds by default)
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
