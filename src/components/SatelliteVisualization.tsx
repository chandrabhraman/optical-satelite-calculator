
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
    altitude: 500,
    inclination: 98,
    raan: 0,
    trueAnomaly: 0
  });
  const [customModel, setCustomModel] = useState<File | null>(null);
  const [validationData, setValidationData] = useState<{
    visual: {x: number, y: number, z: number} | null,
    calculated: {x: number, y: number, z: number} | null,
    difference: number | null
  }>({ visual: null, calculated: null, difference: null });
  
  // Use custom hook for Three.js visualization
  const { 
    updateSatelliteOrbit, 
    loadCustomModel, 
    startOrbitAnimation,
    runPositionValidation 
  } = useSatelliteVisualization({
    containerRef,
    inputs,
    orbitData,
    onValidationUpdate: setValidationData
  });

  // Update the altitude when inputs change
  useEffect(() => {
    if (inputs) {
      const newAltitude = inputs.altitudeMax / 1000; // Convert to km
      if (newAltitude !== orbitData.altitude) {
        setOrbitData(prev => ({
          ...prev,
          altitude: newAltitude
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
    
    // Run validation after animation starts
    setTimeout(() => {
      runPositionValidation();
    }, 100);
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
          {!hasCalculated && <span className="text-sm font-normal text-muted-foreground">Click Calculate to activate</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4 relative">
        <div className="absolute top-0 right-0 z-10 w-64 space-y-4 p-4">
          <LocationInput 
            onOrbitChange={handleOrbitChange}
            initialData={orbitData}
            altitudeRange={inputs ? {min: inputs.altitudeMin, max: inputs.altitudeMax} : undefined}
            onRunSimulation={handleRunSimulation}
          />
          <ModelUploader onModelUpload={handleModelUpload} />
          
          {/* Position validation panel */}
          {validationData.visual && validationData.calculated && (
            <div className="bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-border text-xs">
              <h4 className="font-medium text-primary mb-1">Position Cross-Validation</h4>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-muted-foreground">Visual:</div>
                <div>X: {validationData.visual.x.toFixed(1)}, Y: {validationData.visual.y.toFixed(1)}, Z: {validationData.visual.z.toFixed(1)}</div>
                
                <div className="text-muted-foreground">Calculated:</div>
                <div>X: {validationData.calculated.x.toFixed(1)}, Y: {validationData.calculated.y.toFixed(1)}, Z: {validationData.calculated.z.toFixed(1)}</div>
                
                <div className="text-muted-foreground">Difference:</div>
                <div className={validationData.difference && validationData.difference > 10 ? "text-destructive" : "text-primary"}>
                  {validationData.difference !== null ? `${validationData.difference.toFixed(2)} km` : 'N/A'}
                </div>
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
