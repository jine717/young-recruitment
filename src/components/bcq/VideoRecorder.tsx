import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Square, RotateCcw, Check, Camera, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration?: number; // Default 180 seconds (3 min)
  disabled?: boolean;
}

export function VideoRecorder({ 
  onRecordingComplete, 
  maxDuration = 180,
  disabled = false 
}: VideoRecorderProps) {
  const [status, setStatus] = useState<'idle' | 'preview' | 'recording' | 'recorded'>('idle');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
      
      setStatus('preview');
    } catch (err) {
      console.error('Camera access denied:', err);
      setHasPermission(false);
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setStatus('recorded');
      setIsRecording(false);
      
      // Clear the auto-stop timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000); // Collect data every second
    setIsRecording(true);
    setStatus('recording');
    
    // Auto-stop after maxDuration
    timerRef.current = setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, maxDuration * 1000);
  }, [maxDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    setStatus('preview');
    
    // Restart camera preview
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
      videoRef.current.play();
    }
  }, []);

  const confirmRecording = useCallback(() => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob);
    }
  }, [recordedBlob, onRecordingComplete]);

  // Play recorded video when status changes to 'recorded'
  useEffect(() => {
    if (status === 'recorded' && recordedBlob && videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = URL.createObjectURL(recordedBlob);
      videoRef.current.muted = false;
      videoRef.current.controls = true;
    }
  }, [status, recordedBlob]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [stopStream]);

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg border border-border">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Camera Access Required</h3>
        <p className="text-muted-foreground text-center mb-4">
          Please enable camera and microphone access in your browser settings to record your response.
        </p>
        <Button onClick={startCamera} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg border border-border">
        <Camera className="w-16 h-16 text-primary mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Record</h3>
        <p className="text-muted-foreground text-center mb-2">
          Click the button below to start your camera
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Maximum recording time: <span className="font-medium text-foreground">3 minutes</span>
        </p>
        <Button 
          onClick={startCamera} 
          disabled={disabled}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Camera className="w-4 h-4 mr-2" />
          Start Camera
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Video Preview/Playback */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
        />
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-full">
            <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording...</span>
          </div>
        )}
        
        {/* Max time reminder during recording */}
        {isRecording && (
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-xs text-muted-foreground">Max 3 minutes</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {status === 'preview' && (
          <>
            <p className="text-sm text-muted-foreground mr-4">
              Maximum recording time: <span className="font-medium text-foreground">3 minutes</span>
            </p>
            <Button
              onClick={startRecording}
              disabled={disabled}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Video className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          </>
        )}
        
        {status === 'recording' && (
          <Button
            onClick={stopRecording}
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </Button>
        )}
        
        {status === 'recorded' && (
          <>
            <Button
              onClick={resetRecording}
              variant="outline"
              className="border-muted-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Re-record
            </Button>
            <Button
              onClick={confirmRecording}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check className="w-4 h-4 mr-2" />
              Submit Response
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
