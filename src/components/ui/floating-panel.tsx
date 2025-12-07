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

const DEFAULT_POSITION: Position = { x: -1, y: -1 }; // -1 means use default (bottom-right)
const PANEL_WIDTH = 400;
const PANEL_MIN_HEIGHT = 500;

export const FloatingPanel = React.forwardRef<HTMLDivElement, FloatingPanelProps>(
  ({ isOpen, onOpenChange, children, className, title, subtitle, headerIcon, headerActions, storageKey = "floating-panel" }, ref) => {
    const [isMinimized, setIsMinimized] = React.useState(false);
    const [position, setPosition] = React.useState<Position>(DEFAULT_POSITION);
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragOffset, setDragOffset] = React.useState<Position>({ x: 0, y: 0 });
    const panelRef = React.useRef<HTMLDivElement>(null);

    // Load position from localStorage
    React.useEffect(() => {
      try {
        const saved = localStorage.getItem(`${storageKey}-position`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setPosition(parsed);
        }
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

    // Handle drag move
    React.useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (e: MouseEvent) => {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep panel within viewport
        const maxX = window.innerWidth - PANEL_WIDTH - 10;
        const maxY = window.innerHeight - 60;
        
        setPosition({
          x: Math.max(10, Math.min(newX, maxX)),
          y: Math.max(10, Math.min(newY, maxY)),
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, dragOffset]);

    // Reset position when window resizes
    React.useEffect(() => {
      const handleResize = () => {
        if (position.x !== -1 && position.y !== -1) {
          const maxX = window.innerWidth - PANEL_WIDTH - 10;
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
    }, [position]);

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
          "transition-all duration-200 ease-out",
          isDragging && "cursor-grabbing select-none",
          isMinimized ? "h-auto" : "h-[600px] max-h-[80vh]",
          className
        )}
        style={{
          width: PANEL_WIDTH,
          ...actualPos,
        }}
      >
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
