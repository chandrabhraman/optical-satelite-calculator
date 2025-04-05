
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium">Location Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <LocationSearch 
            onLocationSelected={handleLocationSelected} 
            initialLocation={location || undefined}
          />
        </div>
        
        <Separator className="my-2" />
        
        <div className="space-y-2">
          <Label htmlFor="altitude">Altitude (km)</Label>
          <Input
            id="altitude"
            type="number"
            min="100"
            max="36000"
            value={altitude}
            onChange={handleAltitudeChange}
          />
          <p className="text-xs text-muted-foreground">
            Spacecraft altitude in kilometers above Earth's surface
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationInput;
