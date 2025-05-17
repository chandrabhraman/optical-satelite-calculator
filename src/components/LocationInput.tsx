
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PlayIcon } from "lucide-react";
import ModelHelpTooltip from '@/components/ModelHelpTooltip';

export interface OrbitData {
  altitude: number;
  inclination: number;
  raan: number;
  trueAnomaly: number;
}

interface LocationInputProps {
  onOrbitChange?: (data: OrbitData) => void;
  onRunSimulation?: () => void;
  initialData?: OrbitData;
  altitudeRange?: {min: number, max: number};
}

const LocationInput = ({ onOrbitChange, onRunSimulation, initialData, altitudeRange }: LocationInputProps) => {
  const [orbitData, setOrbitData] = useState<OrbitData>({
    altitude: initialData?.altitude || 500,
    inclination: initialData?.inclination || 98,
    raan: initialData?.raan || 0,
    trueAnomaly: initialData?.trueAnomaly || 0
  });

  useEffect(() => {
    if (initialData) {
      setOrbitData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (altitudeRange) {
      // Update altitude if it's outside the range
      const midAltitude = Math.floor((altitudeRange.min + altitudeRange.max) / 2);
      if (orbitData.altitude < altitudeRange.min || orbitData.altitude > altitudeRange.max) {
        setOrbitData(prev => ({
          ...prev,
          altitude: midAltitude
        }));
      }
    }
  }, [altitudeRange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    const updatedData = {
      ...orbitData,
      [name]: parseFloat(value)
    };
    
    setOrbitData(updatedData);
    
    if (onOrbitChange) {
      onOrbitChange(updatedData);
    }
  };

  const handleRun = () => {
    if (onRunSimulation) {
      onRunSimulation();
    }
  };

  return (
    <Card className="bg-background/80 backdrop-blur-sm border-border text-xs w-full">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-primary text-sm">Orbital Parameters</h3>
          <ModelHelpTooltip />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="altitude" className="text-xs text-muted-foreground">
            Altitude (km)
          </Label>
          <Input
            id="altitude"
            name="altitude"
            type="number"
            value={orbitData.altitude}
            onChange={handleChange}
            className="h-7 text-xs"
            min={altitudeRange?.min || 200}
            max={altitudeRange?.max || 1000}
          />
          {altitudeRange && (
            <div className="text-[10px] text-muted-foreground">
              Range: {altitudeRange.min}-{altitudeRange.max} km
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="inclination" className="text-xs text-muted-foreground">
            Inclination (deg)
          </Label>
          <Input
            id="inclination"
            name="inclination"
            type="number"
            value={orbitData.inclination}
            onChange={handleChange}
            className="h-7 text-xs"
            min={0}
            max={180}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="raan" className="text-xs text-muted-foreground">
              RAAN (deg)
            </Label>
            <Input
              id="raan"
              name="raan"
              type="number"
              value={orbitData.raan}
              onChange={handleChange}
              className="h-7 text-xs"
              min={0}
              max={360}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="trueAnomaly" className="text-xs text-muted-foreground">
              True Anomaly (deg)
            </Label>
            <Input
              id="trueAnomaly"
              name="trueAnomaly"
              type="number"
              value={orbitData.trueAnomaly}
              onChange={handleChange}
              className="h-7 text-xs"
              min={0}
              max={360}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 pt-0">
        <Button 
          size="sm" 
          className="w-full h-7 text-xs flex items-center gap-1" 
          onClick={handleRun}
          variant="secondary"
        >
          <PlayIcon className="h-3 w-3" /> Run Simulation
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LocationInput;
