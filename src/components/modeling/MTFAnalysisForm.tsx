import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { MTFInputs, MTFResults } from "@/utils/modelingTypes";
import { calculateMTF } from "@/utils/mtfCalculations";
import { Activity, Cpu, Zap, BarChart3 } from "lucide-react";

interface MTFAnalysisFormProps {
  inputs: MTFInputs;
  onInputsChange: (inputs: MTFInputs) => void;
  onResultsChange: (results: MTFResults) => void;
}

const MTFAnalysisForm: React.FC<MTFAnalysisFormProps> = ({
  inputs,
  onInputsChange,
  onResultsChange,
}) => {
  // Recalculate MTF whenever inputs change
  useEffect(() => {
    const results = calculateMTF(inputs);
    onResultsChange(results);
  }, [inputs, onResultsChange]);

  const updateInput = (field: keyof MTFInputs, value: any) => {
    onInputsChange({ ...inputs, [field]: value });
  };

  const nyquistFreq = 1000 / (2 * inputs.pixelSize);

  return (
    <div className="space-y-6">
      {/* Shared Optical Parameters (read-only display) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Inherited Parameters
          </CardTitle>
          <CardDescription className="text-xs">
            Parameters shared from PSF analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pixel Size:</span>
              <span>{inputs.pixelSize} μm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aperture:</span>
              <span>{inputs.aperture} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Focal Length:</span>
              <span>{inputs.focalLength} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wavelength:</span>
              <span>{inputs.wavelength} nm</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frequency Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Frequency Analysis
          </CardTitle>
          <CardDescription className="text-xs">
            Spatial frequency range and sampling parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="freqMin" className="text-xs font-medium">
                Min Frequency (cycles/mm)
              </Label>
              <Input
                id="freqMin"
                type="number"
                value={inputs.spatialFrequencyRange[0]}
                onChange={(e) => updateInput('spatialFrequencyRange', [
                  parseFloat(e.target.value), 
                  inputs.spatialFrequencyRange[1]
                ])}
                step="10"
                min="0"
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freqMax" className="text-xs font-medium">
                Max Frequency (cycles/mm)
              </Label>
              <Input
                id="freqMax"
                type="number"
                value={inputs.spatialFrequencyRange[1]}
                onChange={(e) => updateInput('spatialFrequencyRange', [
                  inputs.spatialFrequencyRange[0], 
                  parseFloat(e.target.value)
                ])}
                step="10"
                min="10"
                className="h-8"
              />
            </div>
          </div>

          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-800 dark:text-blue-200">Nyquist Frequency:</span>
              <Badge variant="outline" className="text-xs">
                {nyquistFreq.toFixed(1)} cycles/mm
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detector Parameters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            Detector Performance
          </CardTitle>
          <CardDescription className="text-xs">
            Sensor quantum efficiency and noise characteristics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Quantum Efficiency: {(inputs.detectorQE * 100).toFixed(1)}%
            </Label>
            <Slider
              value={[inputs.detectorQE]}
              onValueChange={(value) => updateInput('detectorQE', value[0])}
              max={1}
              step={0.01}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Electronic Noise: {inputs.electronicNoise} e⁻ RMS
            </Label>
            <Slider
              value={[inputs.electronicNoise]}
              onValueChange={(value) => updateInput('electronicNoise', value[0])}
              max={200}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 e⁻</span>
              <span>200 e⁻</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motion Parameters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Platform Motion
          </CardTitle>
          <CardDescription className="text-xs">
            Satellite velocity and integration time effects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="velocity" className="text-xs font-medium">
                Platform Velocity (m/s)
              </Label>
              <Input
                id="velocity"
                type="number"
                value={inputs.platformVelocity}
                onChange={(e) => updateInput('platformVelocity', parseFloat(e.target.value))}
                step="100"
                min="1000"
                max="15000"
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="integration" className="text-xs font-medium">
                Integration Time (s)
              </Label>
              <Input
                id="integration"
                type="number"
                value={inputs.integrationTime}
                onChange={(e) => updateInput('integrationTime', parseFloat(e.target.value))}
                step="0.0001"
                min="0.0001"
                max="0.01"
                className="h-8"
              />
            </div>
          </div>

          {/* Motion blur calculation display */}
          {(() => {
            const altitude = 400000; // 400km
            const groundVelocity = inputs.platformVelocity * (altitude / (altitude + inputs.focalLength * 1e-3));
            const motionBlurPixels = (groundVelocity * inputs.integrationTime) / (inputs.pixelSize * 1e-6);
            
            return (
              <div className="p-2 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-md">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ground Velocity:</span>
                    <span>{(groundVelocity / 1000).toFixed(2)} km/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Motion Blur:</span>
                    <span>
                      {motionBlurPixels.toFixed(2)} pixels
                      {motionBlurPixels > 1 && (
                        <Badge variant="destructive" className="ml-2 text-xs">Significant</Badge>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

export default MTFAnalysisForm;