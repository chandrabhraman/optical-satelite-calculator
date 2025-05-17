
import { useEffect, useRef, useState } from 'react';
import { SensorInputs } from '@/utils/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import LocationInput, { OrbitData } from './LocationInput';
import VisualizationContainer from './VisualizationContainer';
import { useSatelliteVisualization } from '@/hooks/useSatelliteVisualization';
import ModelUploader from './ModelUploader';
import { toRadians } from '@/utils/orbitalUtils';

interface SatelliteVisualizationProps {
  inputs: SensorInputs | null;
  calculationCount?: number;
}

const SatelliteVisualization = ({ inputs, calculationCount = 0 }: SatelliteVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [orbitData, setOrbitData] = useState<OrbitData>({
    altitude: 500, // Will be updated when inputs change
    inclination: 98,
    raan: 0,
    trueAnomaly: 0
  });
  const [customModel, setCustomModel] = useState<File | null>(null);
  const [satellitePosition, setSatellitePosition] = useState<{
    lat: number | null,
    lng: number | null
  }>({ lat: null, lng: null });
  
  // Use custom hook for Three.js visualization
  const { 
    updateSatelliteOrbit, 
    loadCustomModel, 
    startOrbitAnimation,
    getCurrentEarthRotation,
    focusOnSatellite
  } = useSatelliteVisualization({
    containerRef,
    inputs,
    orbitData,
    onPositionUpdate: (position) => {
      setSatellitePosition({ lat: position.lat, lng: position.lng });
    }
  });

  // Update the altitude when inputs change
  useEffect(() => {
    if (inputs) {
      // Calculate mean altitude in km
      const meanAltitude = (inputs.altitudeMin + inputs.altitudeMax) / (2 * 1000);
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
    
    // Focus camera on satellite after simulation starts
    setTimeout(() => {
      focusOnSatellite();
    }, 100);
    
    // Orbital parameters will be updated by the onPositionUpdate callback
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

  // Focus on satellite when calculation happens
  useEffect(() => {
    if (hasCalculated && focusOnSatellite) {
      // Short delay to ensure the scene is ready
      setTimeout(() => {
        focusOnSatellite();
      }, 200);
    }
  }, [calculationCount, focusOnSatellite]);

  return (
    <Card className="glassmorphism w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-primary flex justify-between items-center">
          <span>Satellite Sensor Field Visualization</span>
          {!hasCalculated && <span className="text-sm font-normal text-muted-foreground">Click Calculate to activate</span>}
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
          
          {/* Satellite position display */}
          {satellitePosition.lat !== null && satellitePosition.lng !== null && (
            <div className="bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-border text-xs">
              <h4 className="font-medium text-primary mb-1">Current Satellite Position</h4>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-muted-foreground">Latitude:</div>
                <div>{satellitePosition.lat.toFixed(2)}°</div>
                
                <div className="text-muted-foreground">Longitude:</div>
                <div>{satellitePosition.lng.toFixed(2)}°</div>
              </div>
            </div>
          )}
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
