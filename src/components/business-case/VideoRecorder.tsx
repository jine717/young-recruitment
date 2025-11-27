import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Square, Upload, RotateCcw, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VideoRecorderProps {
  onVideoReady: (blob: Blob) => void;
  onTranscriptReady?: (transcript: string) => void;
  disabled?: boolean;
  enableTranscription?: boolean;
}

// Convert AudioBuffer to WAV format
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = 1; // Mono
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  // Get audio data from first channel (mono)
  const audioData = buffer.getChannelData(0);
  
  // Calculate sizes
  const dataLength = audioData.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;
  
  // Create WAV file
  const wavBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(wavBuffer);
  
  // Write WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, bufferLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // byte rate
  view.setUint16(32, numChannels * (bitDepth / 8), true); // block align
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Write audio data
  let offset = 44;
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }
  
  return new Blob([wavBuffer], { type: 'audio/wav' });
};

// Extract audio from video blob
const extractAudioFromVideo = async (videoBlob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoBlob);
    video.src = url;
    
    video.onloadedmetadata = async () => {
      try {
        const audioContext = new AudioContext();
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log('Audio extracted - Duration:', audioBuffer.duration, 'seconds, Sample rate:', audioBuffer.sampleRate);
        
        const wavBlob = audioBufferToWav(audioBuffer);
        console.log('WAV blob created - Size:', wavBlob.size, 'bytes');
        
        URL.revokeObjectURL(url);
        audioContext.close();
        resolve(wavBlob);
      } catch (error) {
        URL.revokeObjectURL(url);
        console.error('Error extracting audio:', error);
        reject(error);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };
  });
};

export function VideoRecorder({ 
  onVideoReady, 
  onTranscriptReady,
  disabled,
  enableTranscription = true 
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startRecording = useCallback(async () => {
    if (!stream) {
      await startCamera();
      return;
    }

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setHasRecording(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = URL.createObjectURL(blob);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  }, [stream, startCamera]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopCamera();
    }
  }, [isRecording, stopCamera]);

  const resetRecording = useCallback(async () => {
    setHasRecording(false);
    setRecordedBlob(null);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
    await startCamera();
  }, [startCamera]);

  const transcribeVideo = useCallback(async (blob: Blob): Promise<string | null> => {
    setIsTranscribing(true);
    try {
      console.log('Starting transcription - Video size:', blob.size, 'bytes');
      
      // Extract audio from video
      const audioBlob = await extractAudioFromVideo(blob);
      console.log('Audio extracted - Size:', audioBlob.size, 'bytes');
      
      // Convert audio blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64Audio = btoa(binary);
      console.log('Audio converted to base64 - Length:', base64Audio.length);

      const { data, error } = await supabase.functions.invoke('transcribe-video', {
        body: { 
          audio: base64Audio,
          contentType: 'audio/wav',
          language: 'en'
        },
      });

      if (error) {
        console.error('Transcription error:', error);
        return null;
      }

      console.log('Transcription result:', data?.text);
      return data?.text || null;
    } catch (err) {
      console.error('Failed to transcribe:', err);
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const confirmRecording = useCallback(async () => {
    if (recordedBlob) {
      onVideoReady(recordedBlob);
      
      // Transcribe if enabled and callback provided
      if (enableTranscription && onTranscriptReady) {
        const transcript = await transcribeVideo(recordedBlob);
        if (transcript) {
          onTranscriptReady(transcript);
        }
      }
    }
  }, [recordedBlob, onVideoReady, enableTranscription, onTranscriptReady, transcribeVideo]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setRecordedBlob(file);
      setHasRecording(true);
      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(file);
      }
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay={!hasRecording}
          muted={!hasRecording}
          controls={hasRecording}
          playsInline
          className="w-full h-full object-cover"
        />
        
        {!stream && !hasRecording && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <Video className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click "Start Camera" to begin</p>
            </div>
          </div>
        )}
        
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm">
            <span className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
            Recording
          </div>
        )}

        {isTranscribing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Transcribing your response...
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!stream && !hasRecording && (
          <>
            <Button onClick={startCamera} disabled={disabled}>
              <Video className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
            <label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={disabled}
              />
              <Button variant="outline" asChild disabled={disabled}>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </span>
              </Button>
            </label>
          </>
        )}

        {stream && !isRecording && !hasRecording && (
          <Button onClick={startRecording} disabled={disabled}>
            <Video className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button onClick={stopRecording} variant="destructive">
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </Button>
        )}

        {hasRecording && (
          <>
            <Button onClick={resetRecording} variant="outline" disabled={disabled || isTranscribing}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Re-record
            </Button>
            <Button onClick={confirmRecording} disabled={disabled || isTranscribing}>
              {isTranscribing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Transcribing...
                </>
              ) : (
                'Use This Video'
              )}
            </Button>
          </>
        )}
      </div>

      {enableTranscription && onTranscriptReady && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI will automatically transcribe your video response
        </p>
      )}
    </div>
  );
}
