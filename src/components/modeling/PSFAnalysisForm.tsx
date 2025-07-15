import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { PSFInputs, PSFResults } from "@/utils/modelingTypes";
import { calculatePSF } from "@/utils/psfCalculations";
import { Eye, Zap, Layers } from "lucide-react";

interface PSFAnalysisFormProps {
  inputs: PSFInputs;
  onInputsChange: (inputs: PSFInputs) => void;
  onResultsChange: (results: PSFResults) => void;
}

const PSFAnalysisForm: React.FC<PSFAnalysisFormProps> = ({
  inputs,
  onInputsChange,
  onResultsChange,
}) => {
  // Recalculate PSF whenever inputs change
  useEffect(() => {
    const results = calculatePSF(inputs);
    onResultsChange(results);
  }, [inputs, onResultsChange]);

  const updateInput = (field: keyof PSFInputs, value: any) => {
    onInputsChange({ ...inputs, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Basic Optical Parameters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Optical System
          </CardTitle>
          <CardDescription className="text-xs">
            Core optical system parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pixelSize" className="text-xs font-medium">
                Pixel Size (μm)
              </Label>
              <Input
                id="pixelSize"
                type="number"
                value={inputs.pixelSize}
                onChange={(e) => updateInput('pixelSize', parseFloat(e.target.value))}
                step="0.1"
                min="1"
                max="20"
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aperture" className="text-xs font-medium">
                Aperture (mm)
              </Label>
              <Input
                id="aperture"
                type="number"
                value={inputs.aperture}
                onChange={(e) => updateInput('aperture', parseFloat(e.target.value))}
                step="10"
                min="10"
                max="1000"
                className="h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="focalLength" className="text-xs font-medium">
                Focal Length (mm)
              </Label>
              <Input
                id="focalLength"
                type="number"
                value={inputs.focalLength}
                onChange={(e) => updateInput('focalLength', parseFloat(e.target.value))}
                step="10"
                min="50"
                max="5000"
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wavelength" className="text-xs font-medium">
                Wavelength (nm)
              </Label>
              <Input
                id="wavelength"
                type="number"
                value={inputs.wavelength}
                onChange={(e) => updateInput('wavelength', parseFloat(e.target.value))}
                step="10"
                min="400"
                max="1000"
                className="h-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Conditions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Environmental
          </CardTitle>
          <CardDescription className="text-xs">
            Atmospheric and observation conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Atmospheric Condition</Label>
            <Select
              value={inputs.atmosphericCondition}
              onValueChange={(value) => updateInput('atmosphericCondition', value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">
                  <div className="flex items-center gap-2">
                    Clear
                    <Badge variant="secondary" className="text-xs">Best</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="hazy">
                  <div className="flex items-center gap-2">
                    Hazy
                    <Badge variant="outline" className="text-xs">Moderate</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="cloudy">
                  <div className="flex items-center gap-2">
                    Cloudy
                    <Badge variant="destructive" className="text-xs">Poor</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Off-Nadir Angle: {inputs.offNadirAngle}°
            </Label>
            <Slider
              value={[inputs.offNadirAngle]}
              onValueChange={(value) => updateInput('offNadirAngle', value[0])}
              max={60}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nadir (0°)</span>
              <span>60° off-nadir</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Focus Quality */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Focus Quality
          </CardTitle>
          <CardDescription className="text-xs">
            Optical alignment and focus accuracy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Defocus Amount: {inputs.defocusAmount} μm
            </Label>
            <Slider
              value={[inputs.defocusAmount]}
              onValueChange={(value) => updateInput('defocusAmount', value[0])}
              max={20}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Perfect Focus</span>
              <span>20μm defocus</span>
            </div>
          </div>

          {inputs.defocusAmount > 0 && (
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {inputs.defocusAmount > 10 
                  ? "Significant defocus detected - image quality will be severely degraded"
                  : inputs.defocusAmount > 5
                  ? "Moderate defocus - noticeable impact on image sharpness"
                  : "Minor defocus - slight reduction in image quality"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PSFAnalysisForm;