import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioCaptureOptions {
  duration?: number; // in milliseconds
  autoStart?: boolean;
}

interface UseAudioCaptureReturn {
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  audioBlob: Blob | null;
}

export function useAudioCapture({ 
  duration = 3000, 
  autoStart = false 
}: UseAudioCaptureOptions = {}): UseAudioCaptureReturn {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setIsProcessing(true);
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      chunksRef.current = [];
      
      cleanup();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setIsProcessing(false);
        setIsListening(false);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.start();
      setIsListening(true);
      
      // Auto-stop after duration
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, duration);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
      setIsListening(false);
      setIsProcessing(false);
    }
  }, [duration, cleanup, stopListening]);

  useEffect(() => {
    if (autoStart) {
      startListening();
    }
    return cleanup;
  }, [autoStart, startListening, cleanup]);

  return {
    isListening,
    isProcessing,
    error,
    startListening,
    stopListening,
    audioBlob,
  };
}
