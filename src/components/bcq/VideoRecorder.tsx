import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Square, RotateCcw, Check, Camera, AlertCircle, Mic, VideoOff, RefreshCw, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration?: number; // Default 180 seconds (3 min)
  disabled?: boolean;
}

type PermissionErrorType = 'denied' | 'not_found' | 'in_use' | 'constraints' | 'unknown' | null;

// Get browser-specific instructions for enabling camera access
const getBrowserInstructions = (): { browser: string; steps: string[] } => {
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes('chrome') && !ua.includes('edg')) {
    return {
      browser: 'Chrome',
      steps: [
        'Click the camera icon in the address bar (left of the URL)',
        'Select "Always allow" for camera and microphone',
        'Click "Done" and refresh the page'
      ]
    };
  } else if (ua.includes('firefox')) {
    return {
      browser: 'Firefox',
      steps: [
        'Click the camera icon next to the URL',
        'Select "Allow" for both camera and microphone',
        'Refresh the page if needed'
      ]
    };
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    return {
      browser: 'Safari',
      steps: [
        'Go to Safari → Settings for This Website',
        'Set Camera and Microphone to "Allow"',
        'Refresh the page'
      ]
    };
  } else if (ua.includes('edg')) {
    return {
      browser: 'Edge',
      steps: [
        'Click the lock icon in the address bar',
        'Click "Permissions for this site"',
        'Set Camera and Microphone to "Allow"'
      ]
    };
  }
  
  return {
    browser: 'your browser',
    steps: [
      'Open your browser settings',
      'Find "Site Settings" or "Permissions"',
      'Allow camera and microphone access for this site'
    ]
  };
};

// Get error details based on error type
const getErrorDetails = (errorType: PermissionErrorType): {
  icon: typeof AlertCircle;
  title: string;
  description: string;
  showBrowserInstructions: boolean;
} => {
  switch (errorType) {
    case 'denied':
      return {
        icon: AlertCircle,
        title: 'Permission Denied',
        description: 'Camera and microphone access was blocked. Please allow access to continue.',
        showBrowserInstructions: true
      };
    case 'not_found':
      return {
        icon: VideoOff,
        title: 'Camera Not Found',
        description: 'No camera was detected on your device. Please connect a camera and try again.',
        showBrowserInstructions: false
      };
    case 'in_use':
      return {
        icon: Camera,
        title: 'Camera In Use',
        description: 'Your camera is being used by another application. Please close other apps using the camera and try again.',
        showBrowserInstructions: false
      };
    case 'constraints':
      return {
        icon: Settings,
        title: 'Camera Not Compatible',
        description: 'Your camera doesn\'t support the required settings. Please try a different camera if available.',
        showBrowserInstructions: false
      };
    default:
      return {
        icon: AlertCircle,
        title: 'Camera Error',
        description: 'An unexpected error occurred while accessing your camera. Please try again.',
        showBrowserInstructions: true
      };
  }
};

// Get the best supported MIME type for video recording with audio
const getSupportedMimeType = (): string => {
  const types = [
    'video/webm;codecs=vp8,opus',  // Most compatible
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
    'video/mp4'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log('Using MIME type:', type);
      return type;
    }
  }
  
  console.warn('No specific MIME type supported, using browser default');
  return '';
};

export function VideoRecorder({ 
  onRecordingComplete, 
  maxDuration = 300, // Default 5 minutes
  disabled = false 
}: VideoRecorderProps) {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<'idle' | 'preview' | 'recording' | 'recorded'>('idle');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<PermissionErrorType>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mimeTypeRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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
    setIsRequestingPermission(true);
    setPermissionError(null);
    
    try {
      // Optimized settings - use vertical aspect ratio on mobile for selfie-style recording
      const videoConstraints = isMobile
        ? {
            facingMode: 'user',
            width: { ideal: 480, max: 480 },     // Portrait width
            height: { ideal: 640, max: 640 },    // Portrait height (4:5 ratio)
            frameRate: { ideal: 20, max: 24 }
          }
        : {
            facingMode: 'user',
            width: { ideal: 640, max: 640 },     // Landscape width
            height: { ideal: 360, max: 360 },    // Landscape height (16:9 ratio)
            frameRate: { ideal: 20, max: 24 }
          };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 22050
        }
      });
      
      // Verify audio track exists and is active
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.error('No audio track found in stream');
        setAudioError(true);
      } else {
        console.log('Audio track found:', audioTracks[0].label, 'enabled:', audioTracks[0].enabled);
        setAudioError(false);
        
        // Setup audio level monitoring
        try {
          const audioContext = new AudioContext();
          const analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.5;
          source.connect(analyser);
          
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          
          // Start monitoring audio levels
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              // Calculate average level
              const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
              // Normalize to 0-100
              const normalizedLevel = Math.min(100, (average / 128) * 100);
              setAudioLevel(normalizedLevel);
              animationFrameRef.current = requestAnimationFrame(updateLevel);
            }
          };
          updateLevel();
        } catch (audioErr) {
          console.warn('Could not setup audio monitoring:', audioErr);
        }
      }
      
      streamRef.current = stream;
      setHasPermission(true);
      setStatus('preview');
      
      // Get supported MIME type
      mimeTypeRef.current = getSupportedMimeType();
    } catch (err: any) {
      console.error('Camera access error:', err);
      
      // Identify specific error type
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('not_found');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setPermissionError('in_use');
      } else if (err.name === 'OverconstrainedError') {
        setPermissionError('constraints');
      } else {
        setPermissionError('unknown');
      }
      
      setHasPermission(false);
    } finally {
      setIsRequestingPermission(false);
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
    
    // Ultra-optimized bitrate settings for minimal file sizes
    // Target: ~10-12 MB for 5 minutes
    const options: MediaRecorderOptions = {
      videoBitsPerSecond: 300000,    // 300 kbps for video (sufficient for 360p talking head)
      audioBitsPerSecond: 48000      // 48 kbps for audio (clear voice quality)
    };
    if (mimeTypeRef.current) {
      options.mimeType = mimeTypeRef.current;
    }
    
    const mediaRecorder = new MediaRecorder(streamRef.current, options);
    console.log('MediaRecorder created with mimeType:', mediaRecorder.mimeType);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      // Use the actual mimeType from the recorder
      const actualMimeType = mediaRecorder.mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: actualMimeType });
      console.log('Recording complete. Blob type:', blob.type, 'size:', blob.size);
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
      // Cleanup audio monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopStream]);

  // Permission error UI with specific messages
  if (hasPermission === false && permissionError) {
    const errorDetails = getErrorDetails(permissionError);
    const browserInfo = getBrowserInstructions();
    const IconComponent = errorDetails.icon;
    
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-muted/30 rounded-lg border border-border">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <IconComponent className="w-6 h-6 text-destructive" />
        </div>
        
        <h3 className="text-base font-semibold text-foreground mb-2 text-center">
          {errorDetails.title}
        </h3>
        
        <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
          {errorDetails.description}
        </p>
        
        {errorDetails.showBrowserInstructions && (
          <div className="w-full max-w-sm bg-background rounded-lg border border-border p-4 mb-4">
            <p className="text-xs font-medium text-foreground mb-2">
              How to enable in {browserInfo.browser}:
            </p>
            <ol className="text-xs text-muted-foreground space-y-1.5">
              {browserInfo.steps.map((step, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-primary font-medium">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        
        <Button 
          onClick={startCamera} 
          variant="outline" 
          size="sm"
          disabled={isRequestingPermission}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRequestingPermission ? 'animate-spin' : ''}`} />
          {isRequestingPermission ? 'Requesting...' : 'Try Again'}
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
          Max recording time: <span className="font-medium text-foreground">5 minutes</span>
        </p>
        <Button 
          onClick={startCamera} 
          disabled={disabled || isRequestingPermission}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isRequestingPermission ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Requesting Access...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Video Preview/Playback - Full width on mobile with fixed height */}
      <div className={`relative rounded-lg overflow-hidden bg-black w-full ${
        isMobile 
          ? 'h-[400px]'  // Fixed height, full width on mobile
          : 'aspect-video max-h-[220px] md:max-h-[280px]'  // Standard 16:9 for desktop
      }`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          webkit-playsinline="true"
          autoPlay={status !== 'recorded'}
          muted={status !== 'recorded'}
        />
        
        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <span className="text-5xl sm:text-7xl font-bold text-white animate-pulse">
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
        
        {/* Audio Level VU Meter - shown during preview and recording */}
        {(status === 'preview' || status === 'recording') && !audioError && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
            <Mic className="w-3 h-3 text-foreground" />
            <div className="flex gap-0.5 items-end h-3">
              {[0, 1, 2, 3, 4].map((i) => {
                const threshold = i * 20;
                const isActive = audioLevel > threshold;
                const barColor = i < 3 ? 'bg-primary' : i < 4 ? 'bg-yellow-500' : 'bg-destructive';
                return (
                  <div
                    key={i}
                    className={`w-1 rounded-sm transition-all duration-75 ${
                      isActive ? barColor : 'bg-muted-foreground/30'
                    }`}
                    style={{ height: `${6 + i * 2}px` }}
                  />
                );
              })}
            </div>
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        {status === 'preview' && (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {audioError && (
              <div className="flex items-center gap-1.5 text-destructive text-xs">
                <Mic className="w-3.5 h-3.5" />
                <span>No microphone detected</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              Max: <span className="font-medium text-foreground">5 min</span>
            </span>
            <Button
              onClick={startRecording}
              disabled={disabled || countdown !== null || audioError}
              size="sm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              <Video className="w-4 h-4 mr-1.5" />
              {countdown !== null ? `Starting in ${countdown}...` : 'Start Recording'}
            </Button>
          </div>
        )}
        
        {status === 'recording' && (
          <Button
            onClick={stopRecording}
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive/10 w-full sm:w-auto"
          >
            <Square className="w-4 h-4 mr-1.5" />
            Stop Recording
          </Button>
        )}
        
        {status === 'recorded' && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={resetRecording}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Re-record
            </Button>
            <Button
              onClick={confirmRecording}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Submit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
