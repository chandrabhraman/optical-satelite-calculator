
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import LocationSearch, { Location } from './LocationSearch';

export interface LocationData {
  location: Location | null;
  altitude: number;
  inclination: number;
}

interface LocationInputProps {
  onLocationChange: (data: LocationData) => void;
  initialData?: LocationData;
  altitudeRange?: { min: number; max: number };
  onRunSimulation?: () => void;
}

const LocationInput: React.FC<LocationInputProps> = ({ 
  onLocationChange, 
  initialData, 
  altitudeRange,
  onRunSimulation
}) => {
  const [location, setLocation] = useState<Location | null>(initialData?.location || null);
  const [altitude, setAltitude] = useState<number>(initialData?.altitude || 500);
  const [inclination, setInclination] = useState<number>(initialData?.inclination || 98);
  const [altitudeError, setAltitudeError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    validateAltitude(altitude);
  }, [altitudeRange]);

  const validateAltitude = (value: number) => {
    if (altitudeRange) {
      const min = altitudeRange.min / 1000; // Convert to km
      const max = altitudeRange.max / 1000; // Convert to km
      
      if (value < min) {
        setAltitudeError(`Altitude must be at least ${min} km`);
        return false;
      }
      if (value > max) {
        setAltitudeError(`Altitude must not exceed ${max} km`);
        return false;
      }
    }
    setAltitudeError(null);
    return true;
  };

  const handleLocationSelected = (newLocation: Location) => {
    setLocation(newLocation);
    onLocationChange({ location: newLocation, altitude, inclination });
  };

  const handleAltitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAltitude(value);
    const isValid = validateAltitude(value);
    if (isValid) {
      onLocationChange({ location, altitude: value, inclination });
    }
  };

  const handleInclinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setInclination(value);
    onLocationChange({ location, altitude, inclination: value });
  };

  const handleRunClick = () => {
    if (!location) {
      toast({
        title: "Missing location",
        description: "Please select a location before running the simulation.",
        variant: "destructive"
      });
      return;
    }

    if (altitudeError) {
      toast({
        title: "Invalid altitude",
        description: altitudeError,
        variant: "destructive"
      });
      return;
    }

    if (onRunSimulation) {
      onRunSimulation();
    }
  };

  return (
    <div className="bg-card/80 p-3 rounded-lg border border-border/50 shadow-sm">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <div className="col-span-2">
          <Label htmlFor="location" className="text-xs mb-1 block">Location</Label>
          <LocationSearch 
            onLocationSelected={handleLocationSelected} 
            initialLocation={location || undefined}
          />
        </div>
        
        <div>
          <Label htmlFor="altitude" className="text-xs mb-1 block">Altitude (km)</Label>
          <Input
            id="altitude"
            type="number"
            min="100"
            max="36000"
            value={altitude}
            onChange={handleAltitudeChange}
            className={`h-8 text-sm ${altitudeError ? 'border-destructive' : ''}`}
          />
          {altitudeError && <p className="text-xs text-destructive mt-1">{altitudeError}</p>}
        </div>
        
        <div>
          <Label htmlFor="inclination" className="text-xs mb-1 block">Inclination (deg)</Label>
          <Input
            id="inclination"
            type="number"
            min="0"
            max="180"
            value={inclination}
            onChange={handleInclinationChange}
            className="h-8 text-sm"
          />
        </div>

        <div className="col-span-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleRunClick}
          >
            <Play className="h-4 w-4 mr-1" /> Run
          </Button>
        </div>
        
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">
            {location && `${location.name.split(',')[0]}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationInput;
