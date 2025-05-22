
import React, { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Play, Pause, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent } from "@/components/ui/tabs";

interface RevisitVisualizationProps {
  tab: string;
  isAnalysisRunning: boolean;
  analysisProgress: number;
}

const RevisitVisualization: React.FC<RevisitVisualizationProps> = ({
  tab,
  isAnalysisRunning,
  analysisProgress
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0);
  const [hasResults, setHasResults] = useState(false);
  
  useEffect(() => {
    // Reset playing state when analysis starts
    if (isAnalysisRunning) {
      setIsPlaying(false);
    }
    
    // Set hasResults when analysis completes
    if (analysisProgress === 100) {
      setHasResults(true);
    }
  }, [isAnalysisRunning, analysisProgress]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const resetAnimation = () => {
    setSimulationTime(0);
    setIsPlaying(false);
  };
  
  // Placeholder for when there are no results yet
  const NoResultsPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium mb-2">No Analysis Results</h3>
      <p className="text-muted-foreground max-w-md">
        Run an analysis using the form on the left to see visualization results here.
      </p>
    </div>
  );
  
  // Display during analysis
  const LoadingDisplay = () => (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h3 className="text-xl font-medium mb-6">Running Orbital Analysis</h3>
      <Progress value={analysisProgress} className="w-full h-2 mb-2" />
      <p className="text-sm text-muted-foreground">
        {analysisProgress}% complete
      </p>
      <div className="mt-8 max-w-md text-center">
        <p className="text-muted-foreground">
          Propagating satellite orbits and calculating revisit statistics...
        </p>
      </div>
    </div>
  );
  
  // Map & Animation tab content
  const MapAnimationTab = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative bg-muted/30 rounded-md overflow-hidden">
        <div ref={mapContainerRef} className="absolute inset-0"></div>
        {/* Map will be initialized here */}
      </div>
      
      {hasResults && (
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Button 
              size="icon" 
              variant="outline" 
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              onClick={resetAnimation}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Slider 
              value={[simulationTime]} 
              min={0} 
              max={100} 
              step={1} 
              onValueChange={([value]) => setSimulationTime(value)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-16 text-right">
              {new Date(Date.now()).toISOString().split('T')[0]}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Toggle aria-label="Show ground tracks">
              Ground Tracks
            </Toggle>
            <Toggle aria-label="Show swaths">
              Sensor Swaths
            </Toggle>
            <Toggle aria-label="Show heatmap" defaultPressed>
              Revisit Heatmap
            </Toggle>
          </div>
        </div>
      )}
    </div>
  );
  
  // Global Heatmap tab content
  const GlobalHeatmapTab = () => (
    <div className="h-full flex flex-col">
      {hasResults ? (
        <>
          <div className="flex-1 bg-muted/30 rounded-md overflow-hidden">
            {/* Global heatmap visualization would go here */}
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Global revisit heatmap will be displayed here</p>
            </div>
          </div>
          <div className="p-4">
            <Alert>
              <AlertTitle>Revisit Statistics</AlertTitle>
              <AlertDescription className="grid grid-cols-2 gap-2 mt-2">
                <div>Average Revisit Time: <span className="font-medium">12.4 hours</span></div>
                <div>Maximum Gap: <span className="font-medium">36.2 hours</span></div>
                <div>Minimum Revisit: <span className="font-medium">4.1 hours</span></div>
                <div>Global Coverage: <span className="font-medium">98.7%</span></div>
              </AlertDescription>
            </Alert>
          </div>
        </>
      ) : (
        <NoResultsPlaceholder />
      )}
    </div>
  );
  
  // AOI Analysis tab content
  const AOIAnalysisTab = () => (
    <div className="h-full flex flex-col">
      {hasResults ? (
        <>
          <div className="flex-1 bg-muted/30 rounded-md overflow-hidden">
            {/* AOI map would go here */}
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">
                Use drawing tools to define your Area of Interest
              </p>
            </div>
          </div>
          <div className="p-4">
            <Alert>
              <AlertTitle>No Area of Interest Defined</AlertTitle>
              <AlertDescription>
                Draw a polygon on the map to analyze revisit statistics for a specific area.
              </AlertDescription>
            </Alert>
          </div>
        </>
      ) : (
        <NoResultsPlaceholder />
      )}
    </div>
  );
  
  if (isAnalysisRunning) {
    return <LoadingDisplay />;
  }
  
  // Using a TabsContent without a parent Tabs is causing our error
  // Instead of directly rendering TabsContent, let's conditionally render the appropriate content
  switch (tab) {
    case "map":
      return <MapAnimationTab />;
    case "heatmap":
      return <GlobalHeatmapTab />;
    case "aoi":
      return <AOIAnalysisTab />;
    default:
      return <MapAnimationTab />;
  }
};

export default RevisitVisualization;
