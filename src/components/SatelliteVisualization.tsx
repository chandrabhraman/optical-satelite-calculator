
import { useEffect, useRef, useState } from 'react';
import { SensorInputs } from '@/utils/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import LocationInput, { LocationData } from './LocationInput';
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
  const [locationData, setLocationData] = useState<LocationData>({
    location: null,
    altitude: 500
  });
  const [customModel, setCustomModel] = useState<File | null>(null);
  
  // Use custom hook for Three.js visualization
  const { updateSatellitePosition, loadCustomModel } = useSatelliteVisualization({
    containerRef,
    inputs,
    locationData,
    setLocationData
  });

  // Update the location altitude when inputs change
  useEffect(() => {
    if (inputs && !locationData.location) {
      const newAltitude = inputs.altitudeMax / 1000; // Convert to km
      if (newAltitude !== locationData.altitude) {
        setLocationData(prev => ({
          ...prev,
          altitude: newAltitude
        }));
      }
    }
  }, [inputs]);
  
  // Handle location change
  const handleLocationChange = (data: LocationData) => {
    setLocationData(data);
    updateSatellitePosition(data);
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

  return (
    <Card className="glassmorphism w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-primary">
          Satellite Sensor Field Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4 relative">
        <div className="absolute top-0 right-0 z-10 w-64 space-y-4 p-4">
          <LocationInput 
            onLocationChange={handleLocationChange}
            initialData={locationData}
          />
          <ModelUploader onModelUpload={handleModelUpload} />
        </div>
        <VisualizationContainer ref={containerRef} />
      </CardContent>
    </Card>
  );
};

export default SatelliteVisualization;
