
import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Play, Pause, RotateCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import RevisitEarthMap from "./RevisitEarthMap";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0);
  const [hasResults, setHasResults] = useState(false);
  const [showGroundTracks, setShowGroundTracks] = useState(true);
  const [showSwaths, setShowSwaths] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  
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
        <p className="text-xs text-muted-foreground mt-2">
          Note: Currently using simplified orbital mechanics (not SGP4 propagator)
        </p>
      </div>
    </div>
  );
  
  // Map & Animation tab content
  const MapAnimationTab = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative bg-muted/30 rounded-md overflow-hidden">
        <RevisitEarthMap 
          isAnalysisRunning={isAnalysisRunning}
          showGroundTracks={showGroundTracks}
          isHeatmapActive={showHeatmap}
        />
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
            <Toggle 
              aria-label="Show ground tracks"
              pressed={showGroundTracks}
              onPressedChange={setShowGroundTracks}
            >
              Ground Tracks
            </Toggle>
            <Toggle 
              aria-label="Show swaths"
              pressed={showSwaths}
              onPressedChange={setShowSwaths}
            >
              Sensor Swaths
            </Toggle>
            <Toggle 
              aria-label="Show heatmap" 
              pressed={showHeatmap}
              onPressedChange={setShowHeatmap}
              defaultPressed
            >
              Revisit Heatmap
            </Toggle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    This is a prototype visualization using mock data. The orbits shown are for demonstration purposes only.
                    A full SGP4 propagator will be implemented in a future update.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
            <RevisitEarthMap 
              isAnalysisRunning={isAnalysisRunning}
              isHeatmapActive={true}
              showGroundTracks={false}
            />
          </div>
          <div className="p-4">
            <Alert>
              <AlertTitle className="flex items-center gap-2">
                Revisit Statistics 
                <span className="text-xs text-muted-foreground">(Simulated Data)</span>
              </AlertTitle>
              <AlertDescription className="grid grid-cols-2 gap-2 mt-2">
                <div>Average Revisit Time: <span className="font-medium">12.4 hours</span></div>
                <div>Maximum Gap: <span className="font-medium">36.2 hours</span></div>
                <div>Minimum Revisit: <span className="font-medium">4.1 hours</span></div>
                <div>Global Coverage: <span className="font-medium">98.7%</span></div>
              </AlertDescription>
              <div className="text-xs text-muted-foreground mt-2">
                Note: These statistics are based on mock data and not actual orbit propagation.
                The simulation does not currently use an SGP4 propagator.
              </div>
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
            <RevisitEarthMap 
              isAnalysisRunning={isAnalysisRunning}
              isHeatmapActive={true}
              showGroundTracks={true}
            />
          </div>
          <div className="p-4">
            <Alert>
              <AlertTitle>No Area of Interest Defined</AlertTitle>
              <AlertDescription>
                Draw a polygon on the map to analyze revisit statistics for a specific area.
              </AlertDescription>
              <div className="text-xs text-muted-foreground mt-2">
                Currently showing a prototype visualization with simulated tracks.
              </div>
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
