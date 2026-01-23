import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Convert audio blob (WebM) to RAW PCM format (mono, 16-bit, 44100 Hz) as base64
 * Shazam API requires RAW PCM audio in specific format:
 * - Sample Rate: 44100 Hz
 * - Sample Size: 16 bits
 * - Channels: 1 (Mono)
 * - Format: 16-bit signed integer (little-endian)
 */
async function convertAudioToRawPCM(audioBlob: Blob): Promise<string | null> {
  try {
    // Create audio context with 44100 Hz sample rate (Shazam requirement)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 44100,
    });
    
    // Decode the audio blob
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    console.log('🎵 Audio conversion:', {
      originalSampleRate: audioBuffer.sampleRate,
      targetSampleRate: 44100,
      numberOfChannels: audioBuffer.numberOfChannels,
      length: audioBuffer.length,
      duration: audioBuffer.duration,
    });

    // Step 1: Convert to mono first (Shazam requires mono audio)
    let monoData: Float32Array;
    if (audioBuffer.numberOfChannels === 1) {
      // Already mono
      monoData = audioBuffer.getChannelData(0);
    } else {
      // Convert stereo/multi-channel to mono by averaging
      monoData = new Float32Array(audioBuffer.length);
      const channel0 = audioBuffer.getChannelData(0);
      if (audioBuffer.numberOfChannels >= 2) {
        const channel1 = audioBuffer.getChannelData(1);
        for (let i = 0; i < audioBuffer.length; i++) {
          monoData[i] = (channel0[i] + channel1[i]) / 2;
        }
      } else {
        monoData.set(channel0);
      }
    }

    // Step 2: Resample to 44100 Hz if needed (Shazam requirement)
    let resampledData: Float32Array;
    if (audioBuffer.sampleRate !== 44100) {
      console.log('🎵 Resampling from', audioBuffer.sampleRate, 'Hz to 44100 Hz');
      const ratio = 44100 / audioBuffer.sampleRate;
      const newLength = Math.round(monoData.length * ratio);
      resampledData = new Float32Array(newLength);
      
      // Linear interpolation resampling
      for (let i = 0; i < newLength; i++) {
        const srcIndex = i / ratio;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.min(srcIndexFloor + 1, monoData.length - 1);
        const fraction = srcIndex - srcIndexFloor;
        
        resampledData[i] = monoData[srcIndexFloor] * (1 - fraction) + monoData[srcIndexCeil] * fraction;
      }
    } else {
      resampledData = monoData;
    }

    // Step 3: Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
    // Shazam expects 16-bit signed integers in little-endian byte order
    const int16Data = new Int16Array(resampledData.length);
    for (let i = 0; i < resampledData.length; i++) {
      // Clamp to [-1, 1] and convert to 16-bit integer
      const sample = Math.max(-1, Math.min(1, resampledData[i]));
      // Convert to 16-bit signed integer: -32768 to 32767
      int16Data[i] = Math.round(sample * 32767);
    }

    // Convert Int16Array to byte array (little-endian)
    // Int16Array.buffer gives us the raw bytes in the correct endianness
    const byteArray = new Uint8Array(int16Data.buffer);

    // Convert byte array to base64 string
    // Method 1: Using btoa with binary string (more reliable)
    let binaryString = '';
    for (let i = 0; i < byteArray.length; i++) {
      binaryString += String.fromCharCode(byteArray[i]);
    }
    const base64 = btoa(binaryString);

    console.log('🎵 Converted to RAW PCM:', {
      originalSize: audioBlob.size,
      pcmSize: byteArray.length,
      base64Length: base64.length,
      sampleRate: 44100,
      samples: int16Data.length,
      duration: int16Data.length / 44100,
    });

    // Verify base64 is valid
    if (!base64 || base64.length === 0) {
      throw new Error('Base64 encoding failed');
    }

    return base64;
  } catch (error) {
    console.error('🎵 Error converting audio to RAW PCM:', error);
    return null;
  }
}

// API keys are now stored securely on the backend (Supabase Edge Function)
// No API keys in frontend code!

export interface ShazamTrack {
  key: string;
  title: string;
  subtitle: string;
  type: string;
  images?: {
    coverart?: string;
    background?: string;
  };
  hub?: {
    actions?: Array<{
      name: string;
      type: string;
      uri?: string;
    }>;
  };
  url?: string;
}

export interface ShazamMatch {
  track: ShazamTrack;
  location?: {
    accuracy?: number;
  };
}

export interface ShazamResponse {
  matches: ShazamMatch[];
  location?: {
    accuracy?: number;
  };
}

interface UseShazamReturn {
  identifySong: (audioBlob: Blob) => Promise<ShazamResponse | null>;
  isLoading: boolean;
  error: string | null;
  result: ShazamTrack | null;
}

/**
 * Hook for Shazam music recognition API
 * 
 * This hook calls the backend Supabase Edge Function (shazam-detect)
 * which securely handles Shazam API calls with API keys stored on the server.
 * 
 * Setup Instructions:
 * 1. Deploy the Supabase Edge Function (see BACKEND_SETUP.md)
 * 2. Add SHAZAM_API_KEY to Supabase secrets
 * 3. No API keys needed in frontend!
 */
export function useShazam(): UseShazamReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShazamTrack | null>(null);

  const identifySong = useCallback(async (audioBlob: Blob): Promise<ShazamResponse | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🎵 Shazam: Starting audio processing...', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
      });

      // Convert audio to RAW PCM format (mono, 16-bit, 44100 Hz) as base64
      const base64Audio = await convertAudioToRawPCM(audioBlob);
      
      if (!base64Audio) {
        throw new Error('Failed to convert audio to RAW PCM format');
      }

      console.log('🎵 Shazam: Converted to RAW PCM, base64 length:', base64Audio.length);

      // Call backend Supabase Edge Function (API keys are secure on backend)
      // The function handles all Shazam API calls securely
      // supabase.functions.invoke automatically adds authorization header
      const { data, error: fnError } = await supabase.functions.invoke('shazam-detect', {
        body: base64Audio, // Send base64 audio as plain text
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to call Shazam API');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Shazam API returned an error');
      }

      // Handle response from backend
      const responseData = data.data;
      let matches = responseData.matches;
      
      if (!matches && responseData.track) {
        matches = [{ track: responseData.track }];
      }

      if (matches && matches.length > 0) {
        const track = matches[0].track;
        console.log('🎵 Shazam: ✅ Success! Track identified:', {
          title: track.title,
          subtitle: track.subtitle,
          key: track.key,
        });
        setResult(track);
        return { matches, location: responseData.location };
      } else {
        throw new Error('No matches found - song not recognized');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to identify song with Shazam';
      setError(message);
      console.error('Shazam API error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    identifySong,
    isLoading,
    error,
    result,
  };
}

/**
 * Alternative: Direct Shazam API implementation
 * This uses the official Shazam API (requires different authentication)
 */
export async function identifySongDirect(audioBlob: Blob, apiKey: string): Promise<ShazamResponse | null> {
  try {
    // Convert audio to the format Shazam expects
    const formData = new FormData();
    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
    formData.append('file', audioFile);

    const response = await fetch('https://api.shazam.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Shazam API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Shazam direct API error:', error);
    return null;
  }
}
