import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Square, Upload, RotateCcw, Loader2, Sparkles, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
];

interface VideoRecorderProps {
  onVideoReady: (blob: Blob) => void;
  onTranscriptReady?: (transcript: string) => void;
  disabled?: boolean;
  enableTranscription?: boolean;
}

export function VideoRecorder({ 
  onVideoReady, 
  onTranscriptReady,
  disabled,
  enableTranscription = true 
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);

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

    // Reset chunks
    chunksRef.current = [];
    audioChunksRef.current = [];

    // VIDEO RECORDER
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

    // AUDIO RECORDER - Separate recorder for audio only
    const audioStream = new MediaStream(stream.getAudioTracks());
    const audioRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm;codecs=opus' });

    audioRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    audioRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('Audio blob created - Size:', audioBlob.size, 'bytes');
      setRecordedAudioBlob(audioBlob);
    };

    audioRecorderRef.current = audioRecorder;

    // Start both recorders
    mediaRecorder.start();
    audioRecorder.start();
    setIsRecording(true);
  }, [stream, startCamera]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (audioRecorderRef.current && isRecording) {
      audioRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopCamera();
  }, [isRecording, stopCamera]);

  const resetRecording = useCallback(async () => {
    setHasRecording(false);
    setRecordedBlob(null);
    setRecordedAudioBlob(null);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
    await startCamera();
  }, [startCamera]);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string | null> => {
    setIsTranscribing(true);
    try {
      console.log('Starting transcription - Audio size:', audioBlob.size, 'bytes');
      
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
          contentType: 'audio/webm',
          language: selectedLanguage
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
  }, [selectedLanguage]);

  const confirmRecording = useCallback(async () => {
    if (recordedBlob) {
      onVideoReady(recordedBlob);
      
      // Transcribe if enabled and callback provided
      if (enableTranscription && onTranscriptReady && recordedAudioBlob) {
        const transcript = await transcribeAudio(recordedAudioBlob);
        if (transcript) {
          onTranscriptReady(transcript);
        }
      }
    }
  }, [recordedBlob, recordedAudioBlob, onVideoReady, enableTranscription, onTranscriptReady, transcribeAudio, selectedLanguage]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setRecordedBlob(file);
      setRecordedAudioBlob(null); // No separate audio for uploaded files
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI will automatically transcribe your video response
          </p>
        </div>
      )}
    </div>
  );
}
