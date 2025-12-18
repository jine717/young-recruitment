import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Square, RotateCcw, Check, Camera, AlertCircle } from 'lucide-react';

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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Format seconds to M:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      setStatus('preview');
    } catch (err) {
      console.error('Camera access denied:', err);
      setHasPermission(false);
    }
  }, []);

  // Assign stream to video element when in preview/recording mode
  useEffect(() => {
    if ((status === 'preview' || status === 'recording') && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [status]);

  // Actual recording logic - called after countdown finishes
  const beginActualRecording = useCallback(() => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    setElapsedTime(0);
    
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
    mediaRecorder.start(1000);
    setIsRecording(true);
    setStatus('recording');
    
    // Auto-stop after maxDuration
    timerRef.current = setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, maxDuration * 1000);
  }, [maxDuration]);

  // Start countdown when user clicks record
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    setCountdown(3);
  }, []);

  // Countdown effect - decrements every second, starts recording when reaches 0
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      setCountdown(null);
      beginActualRecording();
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, beginActualRecording]);

  // Elapsed time interval during recording
  useEffect(() => {
    if (isRecording) {
      elapsedTimerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    }
    
    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
      videoRef.current.controls = false;
    }
    setStatus('preview');
  }, []);

  const confirmRecording = useCallback(() => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob);
    }
  }, [recordedBlob, onRecordingComplete]);

  // Setup recorded video - NO auto-play, user must click to play
  useEffect(() => {
    if (status === 'recorded' && recordedBlob && videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = URL.createObjectURL(recordedBlob);
      videoRef.current.muted = false;
      videoRef.current.controls = true;
      videoRef.current.pause(); // Ensure video is paused initially
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
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-muted/30 rounded-lg border border-border">
        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-destructive mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-2">Camera Access Required</h3>
        <p className="text-sm text-muted-foreground text-center mb-3">
          Please enable camera and microphone access in your browser settings.
        </p>
        <Button onClick={startCamera} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-muted/30 rounded-lg border border-border">
        <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1">Ready to Record</h3>
        <p className="text-sm text-muted-foreground text-center mb-3">
          Max recording time: <span className="font-medium text-foreground">3 minutes</span>
        </p>
        <Button 
          onClick={startCamera} 
          disabled={disabled}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Camera className="w-4 h-4 mr-2" />
          Start Camera
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Video Preview/Playback - Responsive height */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-[200px] sm:max-h-[240px] md:max-h-[280px]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          autoPlay={status !== 'recorded'}
          muted={status !== 'recorded'}
        />
        
        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <span className="text-7xl font-bold text-white animate-pulse">
              {countdown}
            </span>
          </div>
        )}
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-destructive/90 text-destructive-foreground px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-medium">Recording</span>
          </div>
        )}
        
        {/* Elapsed time display during recording */}
        {isRecording && (
          <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
            <span className="text-xs font-medium">
              <span className="text-foreground">{formatTime(elapsedTime)}</span>
              <span className="text-muted-foreground"> / {formatTime(maxDuration)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {status === 'preview' && (
          <>
            <span className="text-xs text-muted-foreground">
              Max: <span className="font-medium text-foreground">3 min</span>
            </span>
            <Button
              onClick={startRecording}
              disabled={disabled || countdown !== null}
              size="sm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Video className="w-4 h-4 mr-1.5" />
              {countdown !== null ? `Starting in ${countdown}...` : 'Start Recording'}
            </Button>
          </>
        )}
        
        {status === 'recording' && (
          <Button
            onClick={stopRecording}
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive/10"
          >
            <Square className="w-4 h-4 mr-1.5" />
            Stop Recording
          </Button>
        )}
        
        {status === 'recorded' && (
          <>
            <Button
              onClick={resetRecording}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Re-record
            </Button>
            <Button
              onClick={confirmRecording}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Submit
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
