import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseContinuousListeningOptions {
  language?: string;
  onNewTranscript?: (text: string) => void;
  intervalMs?: number;
}

interface UseContinuousListeningReturn {
  isListening: boolean;
  currentTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export function useContinuousListening({
  language = 'en-US',
  onNewTranscript,
  intervalMs = 3000,
}: UseContinuousListeningOptions = {}): UseContinuousListeningReturn {
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedTextRef = useRef<string>('');
  const lastEmittedTextRef = useRef<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldRestartRef = useRef(false);
  
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const emitTranscript = useCallback(() => {
    const text = accumulatedTextRef.current.trim();
    if (text && text !== lastEmittedTextRef.current && onNewTranscript) {
      onNewTranscript(text);
      lastEmittedTextRef.current = text;
      accumulatedTextRef.current = '';
      setCurrentTranscript('');
    }
  }, [onNewTranscript]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsListening(false);
  }, []);

  const createRecognition = useCallback(() => {
    if (!isSupported) return null;
    
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      if (finalTranscript) {
        accumulatedTextRef.current += ' ' + finalTranscript;
      }
      
      setCurrentTranscript(accumulatedTextRef.current + ' ' + interimTranscript);
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      // Auto-restart if we should still be listening
      if (shouldRestartRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Recognition might already be started
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };
    
    return recognition;
  }, [isSupported, language]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    setError(null);
    accumulatedTextRef.current = '';
    lastEmittedTextRef.current = '';
    setCurrentTranscript('');
    shouldRestartRef.current = true;

    const recognition = createRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      recognition.start();
      
      // Set up interval to emit transcripts every X seconds
      intervalRef.current = setInterval(() => {
        emitTranscript();
      }, intervalMs);
    }
  }, [isSupported, createRecognition, emitTranscript, intervalMs]);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isListening,
    currentTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
  };
}
