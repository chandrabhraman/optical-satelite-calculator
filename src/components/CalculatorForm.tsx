import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SensorInputs } from "@/utils/types";
import { calculateSensorParameters } from "@/utils/sensorCalculations";
import ParameterTooltip from "@/components/ParameterTooltip";
import { playSound, SOUNDS } from "@/utils/soundEffects";

interface CalculatorFormProps {
  onCalculate: (inputs: SensorInputs) => void;
}

const CalculatorForm = ({ onCalculate }: CalculatorFormProps) => {
  const [inputs, setInputs] = useState<SensorInputs>({
    pixelSize: 5.5, // μm
    pixelCountH: 4000, // Updated from 4096
    pixelCountV: 3072,
    gsdRequirements: 5, // Updated from 0.5 m
    altitudeMin: 400, // km (changed from 400000 m)
    altitudeMax: 600, // km (changed from 600000 m)
    focalLength: 1000, // mm
    aperture: 100, // Updated from 200 mm
    attitudeAccuracy: 0.1, // degrees (3 sigma)
    nominalOffNadirAngle: 0, // degrees - frozen to 0
    maxOffNadirAngle: 30, // degrees
    gpsAccuracy: 10 // m
  });

  const [fStop, setFStop] = useState<number>(0);

  useEffect(() => {
    if (inputs.pixelSize && inputs.altitudeMin && inputs.altitudeMax && inputs.gsdRequirements) {
      try {
        const altitudeMean = 0.5 * (inputs.altitudeMin + inputs.altitudeMax);
        const calculatedFocalLength = (altitudeMean * inputs.pixelSize) / inputs.gsdRequirements;
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

  // Calculate F-Stop whenever focal length or aperture changes
  useEffect(() => {
    if (inputs.focalLength > 0 && inputs.aperture > 0) {
      try {
        // F-Stop = Focal Length / Aperture Diameter
        const calculatedFStop = inputs.focalLength / inputs.aperture;
        setFStop(Number(calculatedFStop.toFixed(1)));
      } catch (error) {
        console.error("Error calculating F-Stop:", error);
      }
    }
  }, [inputs.focalLength, inputs.aperture]);

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
      altitudeMin: inputs.altitudeMin * 1000,
      altitudeMax: inputs.altitudeMax * 1000,
    };
    onCalculate(submittedInputs);
    
    // Play the calculation sound effect
    playSound(SOUNDS.calculate, 0.4);
  };

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
    <Card className="glassmorphism">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* GSD Requirements Field - Top and separated */}
          <div className="p-3 bg-primary/10 rounded-md border border-primary/30">
            <div className="space-y-2">
              <Label htmlFor="gsdRequirements" className="flex items-center text-primary font-medium">
                GSD Requirements (m)
                <ParameterTooltip description="Ground Sample Distance requirement specifies the desired resolution on the ground per pixel. Lower values provide higher detail imagery of Earth's surface." />
              </Label>
              <Input
                id="gsdRequirements"
                name="gsdRequirements"
                type="number"
                step="0.01"
                value={inputs.gsdRequirements}
                onChange={handleChange}
                required
                className="border-primary/30 focus:border-primary"
              />
              <p className="text-xs text-primary/70">This parameter determines the spatial resolution of your satellite sensor</p>
            </div>
          </div>
          
          <h3 className="text-sm font-medium text-primary">Sensor Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pixelSize" className="flex items-center">
                Pixel Size (μm)
                <ParameterTooltip description="The physical size of an individual pixel on the image sensor, measured in micrometers. Smaller pixels generally allow for higher resolution imaging." />
              </Label>
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
              <Label htmlFor="pixelCountH" className="flex items-center">
                Pixel Count (H)
                <ParameterTooltip description="The number of pixels along the horizontal axis of the sensor. Higher pixel counts allow for more detailed images across a wider field of view." />
              </Label>
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
              <Label htmlFor="pixelCountV" className="flex items-center">
                Pixel Count (V)
                <ParameterTooltip description="The number of pixels along the vertical axis of the sensor. Together with horizontal pixel count, determines the total resolution of the imaging system." />
              </Label>
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
              <Label htmlFor="altitudeMin" className="flex items-center">
                Altitude Minimum (km)
                <ParameterTooltip description="The lowest orbital altitude at which the satellite will operate. Lower altitudes generally provide better resolution but with a smaller field of view." />
              </Label>
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
              <Label htmlFor="altitudeMax" className="flex items-center">
                Altitude Maximum (km)
                <ParameterTooltip description="The highest orbital altitude at which the satellite will operate. Higher altitudes provide wider coverage but with reduced resolution." />
              </Label>
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
              <Label htmlFor="focalLength" className="flex items-center">
                Focal Length (mm)
                <ParameterTooltip description="The distance between the optical center of the lens and the sensor. Longer focal lengths provide higher magnification and narrower fields of view." />
              </Label>
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
              <Label htmlFor="aperture" className="flex items-center">
                Aperture (mm)
                <ParameterTooltip description="The diameter of the optical system's entrance pupil. Larger apertures collect more light, improving performance in low-light conditions." />
              </Label>
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
              <Label className="flex items-center">
                F-Stop (f/)
                <ParameterTooltip description="The f-number or f-stop is the ratio of the lens's focal length to the diameter of the entrance pupil (aperture). Lower f-stops allow more light but have shallower depth of field." />
              </Label>
              <Input
                type="text"
                value={`f/${fStop}`}
                readOnly
                className="bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Auto-calculated from Focal Length and Aperture</p>
            </div>
          </div>
          
          {/* Georeferencing Error Analysis Inputs Group */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-primary">Georeferencing Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border/50 rounded-md p-4">
              <div className="space-y-2">
                <Label htmlFor="attitudeAccuracy" className="flex items-center">
                  Attitude Measurement Accuracy (3σ, deg)
                  <ParameterTooltip description="The precision with which the satellite can determine its orientation. Lower values indicate better pointing accuracy, which improves geolocation precision." />
                </Label>
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
                <Label htmlFor="nominalOffNadirAngle" className="flex items-center">
                  Nominal Off-Nadir Angle (deg)
                  <ParameterTooltip description="The default pointing angle away from the nadir (directly below the satellite). Fixed at 0 degrees for this calculator." />
                </Label>
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
                <Label htmlFor="maxOffNadirAngle" className="flex items-center">
                  Maximum Off-Nadir Angle (deg)
                  <ParameterTooltip description="The maximum angle at which the satellite can point its sensors away from nadir. Higher values allow for more flexible imaging opportunities." />
                </Label>
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
                <Label htmlFor="gpsAccuracy" className="flex items-center">
                  GPS Accuracy (m)
                  <ParameterTooltip description="The precision of the satellite's position determination. Lower values indicate better positional knowledge, improving geolocation accuracy." />
                </Label>
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
          </div>

          <div className="p-3 bg-muted/50 rounded-md mt-2">
            <p className="text-sm font-medium mb-2 flex items-center">
              Calculated Fields of View
              <ParameterTooltip description="The angular extent of the observable area. Horizontal FOV represents the width, while Vertical FOV represents the height of the viewable area." />
            </p>
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
            className="w-full bg-primary hover:bg-primary/80"
            shake={true}
          >
            Calculate
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CalculatorForm;
