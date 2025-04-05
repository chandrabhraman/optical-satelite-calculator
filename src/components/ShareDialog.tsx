
import { useState } from "react";
import { Copy, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { SensorInputs, CalculationResults } from "@/utils/types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputs: SensorInputs | null;
  results: CalculationResults | undefined;
}

const ShareDialog = ({ open, onOpenChange, inputs, results }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  if (!inputs || !results) return null;
  
  // Create a shareable URL with query parameters
  const generateShareableUrl = () => {
    const params = new URLSearchParams();
    
    // Add input parameters to URL
    Object.entries(inputs).forEach(([key, value]) => {
      params.append(key, value.toString());
    });
    
    const shareableUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    return shareableUrl;
  };
  
  // Generate text format of results
  const generateTextResults = () => {
    const formatValue = (key: string, value: number): string => {
      if (key.includes("Angle")) {
        return `${value.toFixed(4)}°`;
      } else if (key.includes("Size") || key.includes("Change") || key.includes("Error")) {
        return `${value.toFixed(2)} m`;
      }
      return value.toFixed(4).toString();
    };
    
    // Calculate FOVs
    const sensorWidthH = inputs.pixelSize * inputs.pixelCountH / 1000; // in mm
    const sensorWidthV = inputs.pixelSize * inputs.pixelCountV / 1000; // in mm
    const fovH = 2 * Math.atan(sensorWidthH / (2 * inputs.focalLength)) * (180 / Math.PI);
    const fovV = 2 * Math.atan(sensorWidthV / (2 * inputs.focalLength)) * (180 / Math.PI);
    
    let text = "Satellite Optical Sensor Calculator Results\n";
    text += "===========================================\n\n";
    
    text += "Input Parameters:\n";
    text += `- Pixel Size: ${inputs.pixelSize} μm\n`;
    text += `- Pixel Count (H): ${inputs.pixelCountH}\n`;
    text += `- Pixel Count (V): ${inputs.pixelCountV}\n`;
    text += `- GSD Requirements: ${inputs.gsdRequirements} m\n`;
    text += `- Altitude Range: ${inputs.altitudeMin} - ${inputs.altitudeMax} m\n`;
    text += `- Focal Length: ${inputs.focalLength} mm\n`;
    text += `- Aperture: ${inputs.aperture} mm\n`;
    text += `- Attitude Accuracy: ${inputs.attitudeAccuracy}°\n`;
    text += `- Nominal Off-Nadir Angle: ${inputs.nominalOffNadirAngle}°\n`;
    text += `- Maximum Off-Nadir Angle: ${inputs.maxOffNadirAngle}°\n`;
    text += `- GPS Accuracy: ${inputs.gpsAccuracy} m\n\n`;
    
    text += `Calculated Field of View (FOV):\n`;
    text += `- Horizontal FOV: ${fovH.toFixed(2)}°\n`;
    text += `- Vertical FOV: ${fovV.toFixed(2)}°\n\n`;
    
    text += "Nominal Results (Nadir Facing @ Max Altitude):\n";
    Object.entries(results.nominal).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      text += `- ${formattedKey}: ${formatValue(key, value)}\n`;
    });
    
    text += "\nWorst Case Results (Off-Nadir @ Max Altitude):\n";
    Object.entries(results.worstCase).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      text += `- ${formattedKey}: ${formatValue(key, value)}\n`;
    });
    
    return text;
  };
  
  const handleCopyUrl = async () => {
    const url = generateShareableUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "URL Copied",
      description: "Shareable URL has been copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleCopyText = async () => {
    const text = generateTextResults();
    await navigator.clipboard.writeText(text);
    toast({
      title: "Results Copied",
      description: "Text results have been copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Results</DialogTitle>
          <DialogDescription>
            Share your satellite sensor calculation results with others.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="link">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
          </TabsList>
          <TabsContent value="link" className="mt-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Input 
                  readOnly 
                  value={generateShareableUrl()} 
                  className="font-mono text-xs"
                />
              </div>
              <Button size="sm" onClick={handleCopyUrl}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="text" className="mt-4">
            <Textarea 
              readOnly 
              value={generateTextResults()} 
              className="font-mono text-xs h-[300px]"
            />
            <Button 
              onClick={handleCopyText} 
              className="mt-2 w-full"
            >
              Copy to clipboard
            </Button>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-1" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
