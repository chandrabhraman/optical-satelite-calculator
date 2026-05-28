import React, { forwardRef, ForwardRefRenderFunction, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import MusicToggle from '@/components/MusicToggle';
import { MousePointer2 } from 'lucide-react';

interface VisualizationContainerProps {
  className?: string;
  children?: React.ReactNode;
  showInstructions?: boolean;
}

const HINT_KEY = 'viz-drag-hint-seen';

const VisualizationContainerComponent: ForwardRefRenderFunction<HTMLDivElement, VisualizationContainerProps> = (
  { className = "", children, showInstructions = true },
  ref
) => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(HINT_KEY);
      if (!seen) {
        setShowHint(true);
        const t = window.setTimeout(() => {
          setShowHint(false);
          localStorage.setItem(HINT_KEY, '1');
        }, 4500);
        return () => window.clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const dismissHint = () => {
    setShowHint(false);
    try { localStorage.setItem(HINT_KEY, '1'); } catch { /* noop */ }
  };

  return (
    <div ref={ref} className={`w-full h-full min-h-[450px] relative ${className}`}>
      <MusicToggle />
      {children}

      {showHint && (
        <div
          onClick={dismissHint}
          className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-2 bg-background/70 backdrop-blur-md px-4 py-3 rounded-xl border border-primary/30 shadow-lg animate-fade-in">
            <div className="relative">
              <MousePointer2 className="h-6 w-6 text-primary animate-[drag-hint_1.6s_ease-in-out_infinite]" />
            </div>
            <p className="text-xs text-foreground/90">Drag to rotate • Scroll to zoom</p>
          </div>
          <style>{`
            @keyframes drag-hint {
              0%, 100% { transform: translateX(-14px); opacity: 0.6; }
              50%      { transform: translateX(14px);  opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {showInstructions && (
        <div className="text-xs text-muted-foreground absolute bottom-4 left-4 bg-background/50 backdrop-blur-sm px-2 py-1 rounded-md z-10 flex flex-col gap-1">
          <p>Click and drag to rotate. Scroll to zoom. Right click + drag to pan</p>
          <p className="italic">Note: the earth rotation speed is exaggerated.</p>
        </div>
      )}
    </div>
  );
};

const VisualizationContainer = forwardRef(VisualizationContainerComponent);

export default VisualizationContainer;
