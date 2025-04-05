
import { useEffect, useRef, useState } from 'react';
import { SensorInputs } from '@/utils/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LocationInput, { LocationData } from './LocationInput';
import VisualizationContainer from './VisualizationContainer';
import { useSatelliteVisualization } from '@/hooks/useSatelliteVisualization';

interface SatelliteVisualizationProps {
  inputs: SensorInputs | null;
}

const SatelliteVisualization = ({ inputs }: SatelliteVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [locationData, setLocationData] = useState<LocationData>({
    location: null,
    altitude: 500
  });
  
  // Use custom hook for Three.js visualization
  const { updateSatellitePosition } = useSatelliteVisualization({
    containerRef,
    inputs,
    locationData,
    setLocationData
  });

  // Handle location change
  const handleLocationChange = (data: LocationData) => {
    setLocationData(data);
    updateSatellitePosition(data);
  };

  return (
    <Card className="glassmorphism w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-primary">Satellite Sensor Field Visualization</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4 relative">
        <div className="absolute top-0 right-0 z-10 w-64 p-4">
          <LocationInput 
            onLocationChange={handleLocationChange}
            initialData={locationData}
          />
        </div>
        <VisualizationContainer ref={containerRef} />
      </CardContent>
    </Card>
  );
};

export default SatelliteVisualization;
