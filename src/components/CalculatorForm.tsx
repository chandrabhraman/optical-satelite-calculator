
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SensorInputs } from "@/utils/types";
import { calculateSensorParameters } from "@/utils/sensorCalculations";

interface CalculatorFormProps {
  onCalculate: (inputs: SensorInputs) => void;
}

const CalculatorForm = ({ onCalculate }: CalculatorFormProps) => {
  const [inputs, setInputs] = useState<SensorInputs>({
    pixelSize: 5.5, // μm
    pixelCountH: 4096,
    pixelCountV: 3072,
    gsdRequirements: 0.5, // m
    altitudeMin: 400, // km (changed from 400000 m)
    altitudeMax: 600, // km (changed from 600000 m)
    focalLength: 1000, // mm
    aperture: 200, // mm
    attitudeAccuracy: 0.1, // degrees (3 sigma)
    nominalOffNadirAngle: 0, // degrees - frozen to 0
    maxOffNadirAngle: 30, // degrees
    gpsAccuracy: 10 // m
  });

  // Effect to update focal length when relevant parameters change
  useEffect(() => {
    if (inputs.pixelSize && inputs.altitudeMin && inputs.altitudeMax && inputs.gsdRequirements) {
      try {
        // Calculate mean altitude
        const altitudeMean = 0.5 * (inputs.altitudeMin + inputs.altitudeMax);
        
        // Calculate focal length based on corrected formula
        // focal length (mm) = Altitude mean (in km) * Pixel size (in um) * (1/GSD Requirements (in m/px))
        const calculatedFocalLength = (altitudeMean * inputs.pixelSize) / inputs.gsdRequirements;
        
        // Only update if it's significantly different (to prevent infinite loops)
        if (Math.abs(calculatedFocalLength - inputs.focalLength) > 1) {
          setInputs(prev => ({
            ...prev,
            focalLength: Math.round(calculatedFocalLength)
          }));
        }
      } catch (error) {
        console.error("Error calculating focal length:", error);
      }
    }
  }, [inputs.pixelSize, inputs.altitudeMin, inputs.altitudeMax, inputs.gsdRequirements]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs({
      ...inputs,
      [name]: parseFloat(value)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submittedInputs = {
      ...inputs,
      // Convert km back to meters for calculations
      altitudeMin: inputs.altitudeMin * 1000,
      altitudeMax: inputs.altitudeMax * 1000,
    };
    onCalculate(submittedInputs);
  };

  // Calculate fields of view for display
  const getFovValues = () => {
    try {
      if (inputs.pixelSize && inputs.focalLength) {
        const params = calculateSensorParameters({
          pixelSize: inputs.pixelSize,
          pixelCountH: inputs.pixelCountH,
          pixelCountV: inputs.pixelCountV,
          altitudeMin: inputs.altitudeMin,
          altitudeMax: inputs.altitudeMax,
          focalLength: inputs.focalLength,
          aperture: inputs.aperture,
          nominalOffNadirAngle: inputs.nominalOffNadirAngle
        });
        
        return {
          hfov: params.hfovDeg.toFixed(2),
          vfov: params.vfovDeg.toFixed(2)
        };
      }
    } catch (error) {
      console.error("Error calculating FOV:", error);
    }
    
    return { hfov: "N/A", vfov: "N/A" };
  };
  
  const { hfov, vfov } = getFovValues();

  return (
    <Card className="glassmorphism w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">Sensor Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pixelSize">Pixel Size (μm)</Label>
              <Input
                id="pixelSize"
                name="pixelSize"
                type="number"
                step="0.1"
                value={inputs.pixelSize}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pixelCountH">Pixel Count (H)</Label>
              <Input
                id="pixelCountH"
                name="pixelCountH"
                type="number"
                value={inputs.pixelCountH}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pixelCountV">Pixel Count (V)</Label>
              <Input
                id="pixelCountV"
                name="pixelCountV"
                type="number"
                value={inputs.pixelCountV}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gsdRequirements">GSD Requirements (m)</Label>
              <Input
                id="gsdRequirements"
                name="gsdRequirements"
                type="number"
                step="0.01"
                value={inputs.gsdRequirements}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altitudeMin">Altitude Minimum (km)</Label>
              <Input
                id="altitudeMin"
                name="altitudeMin"
                type="number"
                step="0.1"
                value={inputs.altitudeMin}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altitudeMax">Altitude Maximum (km)</Label>
              <Input
                id="altitudeMax"
                name="altitudeMax"
                type="number"
                step="0.1"
                value={inputs.altitudeMax}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="focalLength">Focal Length (mm)</Label>
              <Input
                id="focalLength"
                name="focalLength"
                type="number"
                value={inputs.focalLength}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">Auto-calculated from GSD, Altitude and Pixel Size</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aperture">Aperture (mm)</Label>
              <Input
                id="aperture"
                name="aperture"
                type="number"
                value={inputs.aperture}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attitudeAccuracy">Attitude Measurement Accuracy (3σ, deg)</Label>
              <Input
                id="attitudeAccuracy"
                name="attitudeAccuracy"
                type="number"
                step="0.01"
                value={inputs.attitudeAccuracy}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nominalOffNadirAngle">Nominal Off-Nadir Angle (deg)</Label>
              <Input
                id="nominalOffNadirAngle"
                name="nominalOffNadirAngle"
                type="number"
                value={0}
                readOnly
                className="bg-transparent border border-input opacity-75 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Fixed at 0 degrees (nadir)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxOffNadirAngle">Maximum Off-Nadir Angle (deg)</Label>
              <Input
                id="maxOffNadirAngle"
                name="maxOffNadirAngle"
                type="number"
                step="0.1"
                value={inputs.maxOffNadirAngle}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpsAccuracy">GPS Accuracy (m)</Label>
              <Input
                id="gpsAccuracy"
                name="gpsAccuracy"
                type="number"
                step="0.1"
                value={inputs.gpsAccuracy}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-md mt-2">
            <p className="text-sm font-medium mb-2">Calculated Fields of View</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Horizontal FOV</p>
                <p className="font-mono">{hfov}°</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vertical FOV</p>
                <p className="font-mono">{vfov}°</p>
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/80 animate-[pulse_2s_infinite]"
          >
            Calculate
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CalculatorForm;
