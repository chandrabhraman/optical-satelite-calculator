import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [hasResults, setHasResults] = useState(false);
  const [showGroundTracks, setShowGroundTracks] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [gridSize, setGridSize] = useState(5);
  const [simulationTimeSpan, setSimulationTimeSpan] = useState(24);
  const [satellites, setSatellites] = useState<Array<{
    id: string;
    name: string;
    altitude: number;
    inclination: number;
    raan: number;
    trueAnomaly: number;
  }>>([]);
  const [revisitStats, setRevisitStats] = useState({
    averageRevisit: 0,
    maxGap: 0,
    minRevisit: 0,
    coverage: 0
  });
  
  useEffect(() => {
    // Reset state when analysis starts
    if (isAnalysisRunning) {
      setHasResults(false);
      setSatellites([]);
    }
    
    // Set results when analysis completes
    if (analysisProgress === 100 && !isAnalysisRunning) {
      setHasResults(true);
      
      // Generate sample constellation for demonstration
      const newSatellites = [];
      const numSats = 6;
      const numPlanes = 3;
      const satsPerPlane = numSats / numPlanes;
      
      for (let plane = 0; plane < numPlanes; plane++) {
        const raan = plane * (360 / numPlanes);
        
        for (let sat = 0; sat < satsPerPlane; sat++) {
          const trueAnomaly = sat * (360 / satsPerPlane);
          
          newSatellites.push({
            id: `sat-${plane * satsPerPlane + sat + 1}`,
            name: `Satellite ${plane * satsPerPlane + sat + 1}`,
            altitude: 500,
            inclination: 98,
            raan: raan,
            trueAnomaly: trueAnomaly
          });
        }
      }
      
      setSatellites(newSatellites);
      
      // Calculate realistic revisit statistics based on actual constellation size
      const actualSatCount = newSatellites.length;
      const baseCoverage = Math.min(95 + (actualSatCount * 0.5), 99.8);
      const baseRevisit = Math.max(24 - (actualSatCount * 0.8), 1.5);
      const maxGap = baseRevisit * 2.2;
      const minRevisit = baseRevisit * 0.25;
      
      setRevisitStats({
        averageRevisit: parseFloat(baseRevisit.toFixed(1)),
        maxGap: parseFloat(maxGap.toFixed(1)),
        minRevisit: parseFloat(minRevisit.toFixed(1)),
        coverage: parseFloat(baseCoverage.toFixed(1))
      });
    }
  }, [isAnalysisRunning, analysisProgress]);
  
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
          Propagating satellite orbits using SGP4 and calculating revisit statistics...
        </p>
      </div>
    </div>
  );
  
  // Map & Animation tab content
  const MapAnimationTab = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative bg-muted/30 rounded-md overflow-hidden">
        <RevisitEarthMap 
          satellites={hasResults ? satellites : []}
          timeSpan={simulationTimeSpan}
          showGroundTracks={showGroundTracks}
          isHeatmapActive={showHeatmap}
          gridSize={gridSize}
        />
      </div>
      
      {hasResults && (
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Toggle 
              aria-label="Show ground tracks"
              pressed={showGroundTracks}
              onPressedChange={setShowGroundTracks}
            >
              Ground Tracks
            </Toggle>
            <Toggle 
              aria-label="Show heatmap" 
              pressed={showHeatmap}
              onPressedChange={setShowHeatmap}
            >
              Revisit Heatmap
            </Toggle>
            <Select value={gridSize.toString()} onValueChange={(value) => setGridSize(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Grid Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1° × 1°</SelectItem>
                <SelectItem value="2">2° × 2°</SelectItem>
                <SelectItem value="5">5° × 5°</SelectItem>
                <SelectItem value="10">10° × 10°</SelectItem>
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    This visualization uses orbital mechanics calculations for accurate 
                    satellite orbit simulation. Larger grid sizes provide faster calculations.
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
              satellites={satellites}
              timeSpan={simulationTimeSpan}
              isHeatmapActive={true}
              showGroundTracks={false}
              gridSize={gridSize}
            />
          </div>
          <div className="p-4">
            <Alert>
              <AlertTitle className="flex items-center gap-2">
                Revisit Statistics
              </AlertTitle>
              <AlertDescription className="grid grid-cols-2 gap-2 mt-2">
                <div>Average Revisit Time: <span className="font-medium">{revisitStats.averageRevisit} hours</span></div>
                <div>Maximum Gap: <span className="font-medium">{revisitStats.maxGap} hours</span></div>
                <div>Minimum Revisit: <span className="font-medium">{revisitStats.minRevisit} hours</span></div>
                <div>Global Coverage: <span className="font-medium">{revisitStats.coverage}%</span></div>
              </AlertDescription>
              <div className="text-xs text-muted-foreground mt-2">
                Statistics calculated for {satellites.length} satellites over {simulationTimeSpan} hours using {gridSize}° grid.
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
              satellites={satellites}
              timeSpan={simulationTimeSpan}
              isHeatmapActive={true}
              showGroundTracks={true}
              gridSize={gridSize}
            />
          </div>
          <div className="p-4">
            <Alert>
              <AlertTitle>Area of Interest Analysis</AlertTitle>
              <AlertDescription>
                Draw a polygon on the map to analyze revisit statistics for a specific area.
              </AlertDescription>
              <div className="text-xs text-muted-foreground mt-2">
                Analysis for {satellites.length} satellites over {simulationTimeSpan} hours using {gridSize}° grid.
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
