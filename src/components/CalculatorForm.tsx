
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SensorInputs } from "@/utils/types";

interface CalculatorFormProps {
  onCalculate: (inputs: SensorInputs) => void;
}

const CalculatorForm = ({ onCalculate }: CalculatorFormProps) => {
  const [inputs, setInputs] = useState<SensorInputs>({
    pixelSize: 5.5, // μm
    pixelCountH: 4096,
    pixelCountV: 3072,
    gsdRequirements: 0.5, // m
    altitudeMin: 400000, // m
    altitudeMax: 600000, // m
    focalLength: 1000, // mm
    aperture: 200, // mm
    attitudeAccuracy: 0.1, // degrees (3 sigma)
    nominalOffNadirAngle: 0, // degrees
    maxOffNadirAngle: 30, // degrees
    gpsAccuracy: 10 // m
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs({
      ...inputs,
      [name]: parseFloat(value)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(inputs);
  };

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
                step="0.1"
                value={inputs.gsdRequirements}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altitudeMin">Altitude Minimum (m)</Label>
              <Input
                id="altitudeMin"
                name="altitudeMin"
                type="number"
                value={inputs.altitudeMin}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altitudeMax">Altitude Maximum (m)</Label>
              <Input
                id="altitudeMax"
                name="altitudeMax"
                type="number"
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
                step="0.1"
                value={inputs.nominalOffNadirAngle}
                onChange={handleChange}
                required
              />
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
          <Button type="submit" className="w-full bg-primary hover:bg-primary/80">Calculate</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CalculatorForm;
