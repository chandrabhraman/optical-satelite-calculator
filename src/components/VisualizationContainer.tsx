
import React, { forwardRef, ForwardRefRenderFunction } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface VisualizationContainerProps {
  className?: string;
  children?: React.ReactNode;
  showInstructions?: boolean;
}

const VisualizationContainerComponent: ForwardRefRenderFunction<HTMLDivElement, VisualizationContainerProps> = (
  { className = "", children, showInstructions = true },
  ref
) => {
  return (
    <div ref={ref} className={`w-full h-full min-h-[450px] relative ${className}`}>
      {children}
      {showInstructions && (
        <div className="text-xs text-muted-foreground absolute bottom-4 left-4 bg-background/50 backdrop-blur-sm px-2 py-1 rounded-md z-10">
          <p>Click and drag to rotate. Scroll to zoom.</p>
        </div>
      )}
    </div>
  );
};

const VisualizationContainer = forwardRef(VisualizationContainerComponent);

export default VisualizationContainer;
