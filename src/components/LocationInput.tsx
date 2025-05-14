
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { normalizeAngle, toDegrees, toRadians } from '@/utils/orbitalUtils';

export interface OrbitData {
  altitude: number;
  inclination: number;
  raan: number;
  trueAnomaly: number;
}

interface LocationInputProps {
  onOrbitChange: (data: OrbitData) => void;
  initialData?: Partial<OrbitData>;
  altitudeRange?: { min: number; max: number };
  onRunSimulation?: () => void;
}

const LocationInput: React.FC<LocationInputProps> = ({ 
  onOrbitChange, 
  initialData, 
  altitudeRange,
  onRunSimulation
}) => {
  const [altitude, setAltitude] = useState<number>(initialData?.altitude || 500);
  const [inclination, setInclination] = useState<number>(initialData?.inclination || 98);
  const [raan, setRaan] = useState<number>(initialData?.raan || 0);
  const [trueAnomaly, setTrueAnomaly] = useState<number>(initialData?.trueAnomaly || 0);
  
  const [altitudeError, setAltitudeError] = useState<string | null>(null);
  const [inclinationError, setInclinationError] = useState<string | null>(null);
  const [raanError, setRaanError] = useState<string | null>(null);
  const [trueAnomalyError, setTrueAnomalyError] = useState<string | null>(null);
  
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

  const validateInclination = (value: number) => {
    if (value < 0) {
      setInclinationError("Inclination must be at least 0°");
      return false;
    }
    if (value > 180) {
      setInclinationError("Inclination must not exceed 180°");
      return false;
    }
    setInclinationError(null);
    return true;
  };

  const validateRaan = (value: number) => {
    if (value < 0 || value > 360) {
      setRaanError("RAAN must be between 0° and 360°");
      return false;
    }
    setRaanError(null);
    return true;
  };

  const validateTrueAnomaly = (value: number) => {
    if (value < 0 || value > 360) {
      setTrueAnomalyError("True Anomaly must be between 0° and 360°");
      return false;
    }
    setTrueAnomalyError(null);
    return true;
  };

  const handleAltitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAltitude(value);
    const isValid = validateAltitude(value);
    if (isValid) {
      onOrbitChange({ altitude: value, inclination, raan, trueAnomaly });
    }
  };

  const handleInclinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setInclination(value);
    const isValid = validateInclination(value);
    if (isValid) {
      onOrbitChange({ altitude, inclination: value, raan, trueAnomaly });
    }
  };

  const handleRaanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setRaan(value);
    const isValid = validateRaan(value);
    if (isValid) {
      onOrbitChange({ altitude, inclination, raan: value, trueAnomaly });
    }
  };

  const handleTrueAnomalyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTrueAnomaly(value);
    const isValid = validateTrueAnomaly(value);
    if (isValid) {
      onOrbitChange({ altitude, inclination, raan, trueAnomaly: value });
    }
  };

  const handleRunClick = () => {
    const altitudeIsValid = validateAltitude(altitude);
    const inclinationIsValid = validateInclination(inclination);
    const raanIsValid = validateRaan(raan);
    const trueAnomalyIsValid = validateTrueAnomaly(trueAnomaly);

    if (!altitudeIsValid) {
      toast({
        title: "Invalid altitude",
        description: altitudeError,
        variant: "destructive"
      });
      return;
    }

    if (!inclinationIsValid) {
      toast({
        title: "Invalid inclination",
        description: inclinationError,
        variant: "destructive"
      });
      return;
    }

    if (!raanIsValid) {
      toast({
        title: "Invalid RAAN",
        description: raanError,
        variant: "destructive"
      });
      return;
    }

    if (!trueAnomalyIsValid) {
      toast({
        title: "Invalid True Anomaly",
        description: trueAnomalyError,
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
            className={`h-8 text-sm ${inclinationError ? 'border-destructive' : ''}`}
          />
          {inclinationError && <p className="text-xs text-destructive mt-1">{inclinationError}</p>}
        </div>
        
        <div>
          <Label htmlFor="raan" className="text-xs mb-1 block">RAAN (deg)</Label>
          <Input
            id="raan"
            type="number"
            min="0"
            max="360"
            value={raan}
            onChange={handleRaanChange}
            className={`h-8 text-sm ${raanError ? 'border-destructive' : ''}`}
          />
          {raanError && <p className="text-xs text-destructive mt-1">{raanError}</p>}
        </div>
        
        <div>
          <Label htmlFor="trueAnomaly" className="text-xs mb-1 block">True Anomaly (deg)</Label>
          <Input
            id="trueAnomaly"
            type="number"
            min="0"
            max="360"
            value={trueAnomaly}
            onChange={handleTrueAnomalyChange}
            className={`h-8 text-sm ${trueAnomalyError ? 'border-destructive' : ''}`}
          />
          {trueAnomalyError && <p className="text-xs text-destructive mt-1">{trueAnomalyError}</p>}
        </div>

        <div className="col-span-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            disabled={!!altitudeError || !!inclinationError || !!raanError || !!trueAnomalyError}
            onClick={handleRunClick}
          >
            <Play className="h-4 w-4 mr-1" /> Run
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationInput;
