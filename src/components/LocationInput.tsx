
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import LocationSearch, { Location } from './LocationSearch';

export interface LocationData {
  location: Location | null;
  altitude: number;
}

interface LocationInputProps {
  onLocationChange: (data: LocationData) => void;
  initialData?: LocationData;
}

const LocationInput: React.FC<LocationInputProps> = ({ onLocationChange, initialData }) => {
  const [location, setLocation] = useState<Location | null>(initialData?.location || null);
  const [altitude, setAltitude] = useState<number>(initialData?.altitude || 500);

  const handleLocationSelected = (newLocation: Location) => {
    setLocation(newLocation);
    onLocationChange({ location: newLocation, altitude });
  };

  const handleAltitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAltitude(value);
    onLocationChange({ location, altitude: value });
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
            className="h-8 text-sm"
          />
        </div>
        
        <div className="flex items-end">
          <p className="text-xs text-muted-foreground">
            {location && `${location.name.split(',')[0]}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationInput;
