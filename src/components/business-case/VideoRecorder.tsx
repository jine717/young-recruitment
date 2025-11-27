import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Square, Upload, RotateCcw } from 'lucide-react';

interface VideoRecorderProps {
  onVideoReady: (blob: Blob) => void;
  disabled?: boolean;
}

export function VideoRecorder({ onVideoReady, disabled }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
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

  const confirmRecording = useCallback(() => {
    if (recordedBlob) {
      onVideoReady(recordedBlob);
    }
  }, [recordedBlob, onVideoReady]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
            <Button onClick={resetRecording} variant="outline" disabled={disabled}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Re-record
            </Button>
            <Button onClick={confirmRecording} disabled={disabled}>
              Use This Video
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
