
import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface VisualizationContainerProps {
  className?: string;
  children?: React.ReactNode;
}

const VisualizationContainer: React.FC<VisualizationContainerProps> = ({
  className = "",
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={containerRef} className={`w-full h-full min-h-[400px] ${className}`}>
      {children}
      <div className="text-xs text-muted-foreground absolute bottom-2 left-2">
        <p>Click and drag to rotate. Scroll to zoom.</p>
      </div>
    </div>
  );
};

export default VisualizationContainer;
