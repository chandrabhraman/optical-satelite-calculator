import { useEffect, useRef, useState } from 'react';
import { SensorInputs } from '@/utils/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Camera } from "lucide-react";
import LocationInput, { OrbitData } from './LocationInput';
import VisualizationContainer from './VisualizationContainer';
import { useSatelliteVisualization } from '@/hooks/useSatelliteVisualization';
import ModelUploader from './ModelUploader';

interface SatelliteVisualizationProps {
  inputs: SensorInputs | null;
  calculationCount?: number;
}

const SatelliteVisualization = ({ inputs, calculationCount = 0 }: SatelliteVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [orbitData, setOrbitData] = useState<OrbitData>({
    altitude: 500,
    inclination: 98,
    raan: 0,
    trueAnomaly: 0
  });
  const [customModel, setCustomModel] = useState<File | null>(null);
  
  // Use custom hook for Three.js visualization
  const { 
    updateSatelliteOrbit, 
    loadCustomModel, 
    startOrbitAnimation,
    getCurrentEarthRotation,
    captureSnapshot
  } = useSatelliteVisualization({
    containerRef,
    inputs,
    orbitData,
    onPositionUpdate: () => {
      // We're keeping the callback but not using the position data anymore
    }
  });

  // Handle snapshot capture
  const handleSnapshot = () => {
    const dataUrl = captureSnapshot();
    if (dataUrl) {
      // Create download link
      const link = document.createElement('a');
      link.download = `satellite-visualization-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Snapshot captured",
        description: "Your 3D visualization has been saved as an image.",
        duration: 3000,
      });
    } else {
      toast({
        title: "Snapshot failed",
        description: "Unable to capture the visualization. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Update the altitude when inputs change - using the mean value
  useEffect(() => {
    if (inputs) {
      // Calculate mean altitude in km
      const meanAltitude = (inputs.altitudeMin + inputs.altitudeMax) / 2000; // Convert to km
      if (meanAltitude !== orbitData.altitude) {
        setOrbitData(prev => ({
          ...prev,
          altitude: meanAltitude
        }));
      }
    }
  }, [inputs]);
  
  // Handle orbit data change
  const handleOrbitChange = (data: OrbitData) => {
    setOrbitData(data);
    updateSatelliteOrbit(data);
  };

  // Handle run simulation button click
  const handleRunSimulation = () => {
    toast({
      title: "Simulation started",
      description: `Running orbit simulation at ${orbitData.altitude} km with ${orbitData.inclination}° inclination, RAAN: ${orbitData.raan}°, True Anomaly: ${orbitData.trueAnomaly}°`,
      duration: 3000,
    });
    
    startOrbitAnimation(orbitData);
  };
  
  // Handle model upload
  const handleModelUpload = (file: File) => {
    setCustomModel(file);
    if (file) {
      // Show message based on file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'blend') {
        toast({
          title: "Blend file detected",
          description: "Converting .blend files to WebGL format. This may take a moment and might not preserve all features.",
          duration: 5000,
        });
      } else if (fileExtension === 'glb' || fileExtension === 'gltf') {
        toast({
          title: "3D Model selected",
          description: `Loading ${file.name} for visualization...`,
          duration: 3000,
        });
      }
      
      loadCustomModel(file);
    }
  };

  const hasCalculated = calculationCount > 0;

  return (
    <Card className="glassmorphism w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-primary flex justify-between items-center">
          <span>Satellite Sensor Field Visualization</span>
          <div className="flex items-center gap-2">
            {hasCalculated && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSnapshot}
                className="text-xs"
              >
                <Camera className="h-4 w-4 mr-1" />
                Snapshot
              </Button>
            )}
            {!hasCalculated && <span className="text-sm font-normal text-muted-foreground">Click Calculate to activate</span>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4 relative">
        <div className="absolute top-0 right-0 z-10 w-64 space-y-4 p-4">
          <LocationInput 
            onOrbitChange={handleOrbitChange}
            initialData={orbitData}
            altitudeRange={inputs ? {min: inputs.altitudeMin / 1000, max: inputs.altitudeMax / 1000} : undefined}
            onRunSimulation={handleRunSimulation}
          />
          <ModelUploader onModelUpload={handleModelUpload} />
        </div>
        <div className={`relative w-full h-full ${!hasCalculated ? 'opacity-30 pointer-events-none' : ''}`}>
          <VisualizationContainer ref={containerRef} />
          {!hasCalculated && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/60 backdrop-blur-md p-6 rounded-lg text-center">
                <p className="text-lg font-medium text-primary mb-2">Visualization Inactive</p>
                <p className="text-sm text-muted-foreground">Click "Calculate" to see the satellite visualization</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SatelliteVisualization;
