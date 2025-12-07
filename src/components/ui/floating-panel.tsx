import * as React from "react";
import { cn } from "@/lib/utils";
import { X, Minus, Maximize2 } from "lucide-react";
import { Button } from "./button";

interface FloatingPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  storageKey?: string;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const DEFAULT_POSITION: Position = { x: -1, y: -1 };
const DEFAULT_SIZE: Size = { width: 400, height: 600 };
const MIN_WIDTH = 320;
const MAX_WIDTH = 600;
const MIN_HEIGHT = 400;
const MAX_HEIGHT = 800;

export const FloatingPanel = React.forwardRef<HTMLDivElement, FloatingPanelProps>(
  ({ isOpen, onOpenChange, children, className, title, subtitle, headerIcon, headerActions, storageKey = "floating-panel" }, ref) => {
    const [isMinimized, setIsMinimized] = React.useState(false);
    const [position, setPosition] = React.useState<Position>(DEFAULT_POSITION);
    const [size, setSize] = React.useState<Size>(DEFAULT_SIZE);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isResizing, setIsResizing] = React.useState<string | null>(null);
    const [dragOffset, setDragOffset] = React.useState<Position>({ x: 0, y: 0 });
    const panelRef = React.useRef<HTMLDivElement>(null);

    // Load position and size from localStorage
    React.useEffect(() => {
      try {
        const savedPos = localStorage.getItem(`${storageKey}-position`);
        if (savedPos) setPosition(JSON.parse(savedPos));
        const savedSize = localStorage.getItem(`${storageKey}-size`);
        if (savedSize) setSize(JSON.parse(savedSize));
      } catch {
        // Ignore parse errors
      }
    }, [storageKey]);

    // Save position to localStorage
    React.useEffect(() => {
      if (position.x !== -1 && position.y !== -1) {
        try {
          localStorage.setItem(`${storageKey}-position`, JSON.stringify(position));
        } catch {
          // Ignore storage errors
        }
      }
    }, [position, storageKey]);

    // Save size to localStorage
    React.useEffect(() => {
      try {
        localStorage.setItem(`${storageKey}-size`, JSON.stringify(size));
      } catch {
        // Ignore storage errors
      }
    }, [size, storageKey]);

    // Calculate actual position (default to bottom-right if not set)
    const getActualPosition = React.useCallback(() => {
      if (position.x === -1 || position.y === -1) {
        return {
          right: 24,
          bottom: isMinimized ? 24 : 100,
        };
      }
      return {
        left: position.x,
        top: position.y,
      };
    }, [position, isMinimized]);

    // Handle drag start
    const handleMouseDown = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      
      setIsDragging(true);
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    // Handle resize start
    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(direction);
    };

    // Handle drag and resize move
    React.useEffect(() => {
      if (!isDragging && !isResizing) return;

      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          const newX = e.clientX - dragOffset.x;
          const newY = e.clientY - dragOffset.y;
          
          const maxX = window.innerWidth - size.width - 10;
          const maxY = window.innerHeight - 60;
          
          setPosition({
            x: Math.max(10, Math.min(newX, maxX)),
            y: Math.max(10, Math.min(newY, maxY)),
          });
        } else if (isResizing) {
          const rect = panelRef.current?.getBoundingClientRect();
          if (!rect) return;

          if (isResizing.includes('e')) {
            const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX - rect.left));
            setSize(prev => ({ ...prev, width: newWidth }));
          }
          if (isResizing.includes('w')) {
            const deltaX = rect.left - e.clientX;
            const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, rect.width + deltaX));
            if (newWidth !== rect.width && position.x !== -1) {
              setPosition(prev => ({ ...prev, x: prev.x - (newWidth - rect.width) }));
            }
            setSize(prev => ({ ...prev, width: newWidth }));
          }
          if (isResizing.includes('s')) {
            const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, e.clientY - rect.top));
            setSize(prev => ({ ...prev, height: newHeight }));
          }
          if (isResizing.includes('n')) {
            const deltaY = rect.top - e.clientY;
            const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, rect.height + deltaY));
            if (newHeight !== rect.height && position.y !== -1) {
              setPosition(prev => ({ ...prev, y: prev.y - (newHeight - rect.height) }));
            }
            setSize(prev => ({ ...prev, height: newHeight }));
          }
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(null);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, isResizing, dragOffset, position, size.width]);

    // Reset position when window resizes
    React.useEffect(() => {
      const handleResize = () => {
        if (position.x !== -1 && position.y !== -1) {
          const maxX = window.innerWidth - size.width - 10;
          const maxY = window.innerHeight - 60;
          
          if (position.x > maxX || position.y > maxY) {
            setPosition({
              x: Math.min(position.x, maxX),
              y: Math.min(position.y, maxY),
            });
          }
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [position, size.width]);

    if (!isOpen) return null;

    const actualPos = getActualPosition();

    return (
      <div
        ref={(node) => {
          (panelRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          "fixed z-50 bg-background border rounded-lg shadow-2xl flex flex-col",
          "transition-shadow duration-200 ease-out",
          (isDragging || isResizing) && "select-none",
          isDragging && "cursor-grabbing",
          className
        )}
        style={{
          width: size.width,
          height: isMinimized ? 'auto' : size.height,
          maxHeight: isMinimized ? 'auto' : '90vh',
          ...actualPos,
        }}
      >
        {/* Resize handles */}
        {!isMinimized && (
          <>
            <div
              className="absolute -right-1 top-4 bottom-4 w-2 cursor-ew-resize hover:bg-primary/20 rounded"
              onMouseDown={(e) => handleResizeStart(e, 'e')}
            />
            <div
              className="absolute -left-1 top-4 bottom-4 w-2 cursor-ew-resize hover:bg-primary/20 rounded"
              onMouseDown={(e) => handleResizeStart(e, 'w')}
            />
            <div
              className="absolute -bottom-1 left-4 right-4 h-2 cursor-ns-resize hover:bg-primary/20 rounded"
              onMouseDown={(e) => handleResizeStart(e, 's')}
            />
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 cursor-nwse-resize hover:bg-primary/20 rounded"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            />
            <div
              className="absolute -bottom-1 -left-1 w-4 h-4 cursor-nesw-resize hover:bg-primary/20 rounded"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
          </>
        )}

        {/* Draggable Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 border-b cursor-grab",
            "bg-background rounded-t-lg select-none",
            isDragging && "cursor-grabbing"
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 pointer-events-none">
            {headerIcon}
            <div>
              <h3 className="text-lg font-semibold leading-none">{title}</h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 pointer-events-auto">
            {headerActions}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content - hidden when minimized */}
        {!isMinimized && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {children}
          </div>
        )}
      </div>
    );
  }
);

FloatingPanel.displayName = "FloatingPanel";
