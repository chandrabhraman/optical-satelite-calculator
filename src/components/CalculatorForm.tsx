import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { SensorInputs } from "@/utils/types";
import { calculateSensorParameters } from "@/utils/sensorCalculations";
import ParameterTooltip from "@/components/ParameterTooltip";
import { playSound, SOUNDS } from "@/utils/soundEffects";
import { musicPlayer } from "@/utils/musicPlayer";

export const DEFAULT_FORM_INPUTS: SensorInputs = {
  pixelSize: 5.5,
  pixelCountH: 4000,
  pixelCountV: 3072,
  gsdRequirements: 5,
  altitudeMin: 400, // km in form
  altitudeMax: 600, // km in form
  focalLength: 1000,
  aperture: 100,
  attitudeAccuracy: 0.1,
  nominalOffNadirAngle: 0,
  maxOffNadirAngle: 30,
  gpsAccuracy: 10,
};

/** Convert form inputs (altitude in km) to the SensorInputs shape used by the app (altitude in m). */
export const toSubmittedInputs = (i: SensorInputs): SensorInputs => ({
  ...i,
  altitudeMin: i.altitudeMin * 1000,
  altitudeMax: i.altitudeMax * 1000,
});

interface CalculatorFormProps {
  onCalculate: (inputs: SensorInputs) => void;
  /** Optional: fired (debounced) whenever inputs change, for live recalculation. */
  onLiveChange?: (inputs: SensorInputs) => void;
}

const CalculatorForm = ({ onCalculate, onLiveChange }: CalculatorFormProps) => {
  const [inputs, setInputs] = useState<SensorInputs>(DEFAULT_FORM_INPUTS);
  const [fStop, setFStop] = useState<number>(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);

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

  useEffect(() => {
    if (inputs.focalLength > 0 && inputs.aperture > 0) {
      setFStop(Number((inputs.focalLength / inputs.aperture).toFixed(1)));
    }
  }, [inputs.focalLength, inputs.aperture]);

  // Debounced live recalculation
  const liveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!onLiveChange) return;
    if (liveTimer.current) window.clearTimeout(liveTimer.current);
    liveTimer.current = window.setTimeout(() => {
      // Only fire if everything is a valid number
      const allValid = Object.values(inputs).every(v => typeof v === "number" && !isNaN(v));
      if (allValid) onLiveChange(toSubmittedInputs(inputs));
    }, 300);
    return () => {
      if (liveTimer.current) window.clearTimeout(liveTimer.current);
    };
  }, [inputs, onLiveChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs({
      ...inputs,
      [name]: parseFloat(value),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(toSubmittedInputs(inputs));
    playSound(SOUNDS.calculate, 0.4);
    musicPlayer.playLoop(SOUNDS.backgroundLoop);
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
          nominalOffNadirAngle: inputs.nominalOffNadirAngle,
        });
        return { hfov: params.hfovDeg.toFixed(2), vfov: params.vfovDeg.toFixed(2) };
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
          {/* GSD Requirements */}
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

          {/* Essentials */}
          <h3 className="text-sm font-medium text-primary">Essentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pixelSize" className="flex items-center">
                Pixel Size (μm)
                <ParameterTooltip description="The physical size of an individual pixel on the image sensor, measured in micrometers." />
              </Label>
              <Input id="pixelSize" name="pixelSize" type="number" step="0.1" value={inputs.pixelSize} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aperture" className="flex items-center">
                Aperture (mm)
                <ParameterTooltip description="The diameter of the optical system's entrance pupil." />
              </Label>
              <Input id="aperture" name="aperture" type="number" value={inputs.aperture} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altitudeMin" className="flex items-center">
                Altitude Min (km)
                <ParameterTooltip description="Lowest operational orbital altitude." />
              </Label>
              <Input id="altitudeMin" name="altitudeMin" type="number" step="0.1" value={inputs.altitudeMin} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altitudeMax" className="flex items-center">
                Altitude Max (km)
                <ParameterTooltip description="Highest operational orbital altitude." />
              </Label>
              <Input id="altitudeMax" name="altitudeMax" type="number" step="0.1" value={inputs.altitudeMax} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="focalLength" className="flex items-center">
                Focal Length (mm)
                <ParameterTooltip description="Distance between lens optical center and sensor." />
              </Label>
              <Input id="focalLength" name="focalLength" type="number" value={inputs.focalLength} onChange={handleChange} required />
              <p className="text-xs text-muted-foreground">Auto-calculated from GSD, Altitude and Pixel Size</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">
                F-Stop (f/)
                <ParameterTooltip description="Ratio of focal length to aperture diameter." />
              </Label>
              <Input type="text" value={`f/${fStop}`} readOnly className="bg-muted/50 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Auto-calculated</p>
            </div>
          </div>

          {/* Advanced parameters - collapsed by default */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-primary hover:underline w-full justify-between border border-border/50 rounded-md px-3 py-2"
              >
                <span>Advanced parameters</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pixelCountH" className="flex items-center">
                    Pixel Count (H)
                    <ParameterTooltip description="Number of pixels along the horizontal axis of the sensor." />
                  </Label>
                  <Input id="pixelCountH" name="pixelCountH" type="number" value={inputs.pixelCountH} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pixelCountV" className="flex items-center">
                    Pixel Count (V)
                    <ParameterTooltip description="Number of pixels along the vertical axis of the sensor." />
                  </Label>
                  <Input id="pixelCountV" name="pixelCountV" type="number" value={inputs.pixelCountV} onChange={handleChange} required />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 text-primary">Georeferencing Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border/50 rounded-md p-4">
                  <div className="space-y-2">
                    <Label htmlFor="attitudeAccuracy" className="flex items-center">
                      Attitude Accuracy (3σ, deg)
                      <ParameterTooltip description="Precision with which the satellite can determine its orientation." />
                    </Label>
                    <Input id="attitudeAccuracy" name="attitudeAccuracy" type="number" step="0.01" value={inputs.attitudeAccuracy} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominalOffNadirAngle" className="flex items-center">
                      Nominal Off-Nadir Angle (deg)
                      <ParameterTooltip description="Fixed at 0 degrees (nadir)." />
                    </Label>
                    <Input id="nominalOffNadirAngle" name="nominalOffNadirAngle" type="number" value={0} readOnly className="bg-transparent border border-input opacity-75 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground">Fixed at 0 degrees (nadir)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxOffNadirAngle" className="flex items-center">
                      Max Off-Nadir Angle (deg)
                      <ParameterTooltip description="Maximum angle the satellite can point its sensors away from nadir." />
                    </Label>
                    <Input id="maxOffNadirAngle" name="maxOffNadirAngle" type="number" step="0.1" value={inputs.maxOffNadirAngle} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gpsAccuracy" className="flex items-center">
                      GPS Accuracy (m)
                      <ParameterTooltip description="Precision of satellite position determination." />
                    </Label>
                    <Input id="gpsAccuracy" name="gpsAccuracy" type="number" step="0.1" value={inputs.gpsAccuracy} onChange={handleChange} required />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="p-3 bg-muted/50 rounded-md mt-2">
            <p className="text-sm font-medium mb-2 flex items-center">
              Calculated Fields of View
              <ParameterTooltip description="The angular extent of the observable area." />
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

          <Button type="submit" className="w-full bg-primary hover:bg-primary/80" shake={true}>
            Calculate
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CalculatorForm;
