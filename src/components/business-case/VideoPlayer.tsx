interface VideoPlayerProps {
  src: string;
  title?: string;
}

export function VideoPlayer({ src, title }: VideoPlayerProps) {
  return (
    <div className="space-y-2">
      {title && (
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      )}
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        <video
          src={src}
          controls
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
