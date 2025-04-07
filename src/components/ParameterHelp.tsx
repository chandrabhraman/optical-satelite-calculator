
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";

interface ParameterHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ParameterHelp = ({ open, onOpenChange }: ParameterHelpProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Understanding Input Parameters</span>
            <DialogClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogTitle>
          <DialogDescription>
            Learn about each parameter used in the satellite optical sensor calculator.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="sensor" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="sensor">Sensor Properties</TabsTrigger>
            <TabsTrigger value="orbit">Orbital Parameters</TabsTrigger>
            <TabsTrigger value="accuracy">Accuracy Factors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sensor" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Pixel Size (μm)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The physical size of individual pixels on the sensor's detector array, measured in micrometers (μm). 
                Smaller pixels can provide higher resolution but may capture less light, potentially reducing sensitivity.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">Pixel Count (H & V)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The number of pixels along the horizontal (H) and vertical (V) dimensions of the sensor. 
                Together with pixel size, this determines the physical dimensions of the sensor and impacts the 
                overall field of view.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">GSD Requirements (m)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ground Sample Distance (GSD) is the distance between pixel centers as measured on the ground. 
                This parameter represents your target GSD in meters - the spatial resolution you need your 
                satellite imagery to achieve.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">Focal Length (mm)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The distance between the optical center of the lens and the image sensor when focused at infinity, 
                measured in millimeters. Longer focal lengths result in narrower fields of view but greater magnification, 
                allowing for smaller GSD values.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">Aperture (mm)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The effective diameter of the optical system's light-gathering area, measured in millimeters. 
                A larger aperture collects more light but may increase the size, mass, and cost of the optical system.
              </p>
              
              <div className="bg-muted/30 p-4 rounded-md text-sm">
                <p className="font-semibold">Technical Note:</p>
                <p>
                  The focal length is auto-calculated based on your GSD requirements, altitude, and pixel size. 
                  You can manually adjust it if needed, but changing other parameters will recalculate it.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="orbit" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Altitude Minimum & Maximum (km)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The minimum and maximum operational altitude range of the satellite above Earth's surface, measured 
                in kilometers. Altitude directly impacts GSD - as altitude increases, GSD increases (resolution decreases) 
                if focal length remains constant.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">Nominal Off-Nadir Angle (deg)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The default pointing angle of the sensor relative to nadir (directly beneath the satellite). 
                In this calculator, this is fixed at 0 degrees (nadir pointing) for baseline calculations.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">Maximum Off-Nadir Angle (deg)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The maximum angle at which the sensor can be pointed away from nadir. Larger off-nadir angles 
                increase the accessible area on Earth's surface but introduce greater geometric distortions and 
                reduce effective resolution.
              </p>
              
              <div className="bg-muted/30 p-4 rounded-md text-sm">
                <p className="font-semibold">Practical Consideration:</p>
                <p>
                  Off-nadir imaging capability significantly increases imaging opportunities and reduces revisit time, 
                  which is vital for time-critical applications like disaster response or frequent monitoring.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="accuracy" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Attitude Measurement Accuracy (3σ, deg)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The precision with which the satellite can determine and maintain its orientation in space, expressed 
                as a 3-sigma (99.7% confidence) value in degrees. This parameter directly affects the geometric accuracy 
                of the collected imagery.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">GPS Accuracy (m)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The precision with which the satellite can determine its own position in space, measured in meters. 
                This parameter affects the geolocation accuracy of the images - how accurately features in the image 
                can be mapped to their true locations on Earth.
              </p>
              
              <div className="bg-muted/30 p-4 rounded-md text-sm">
                <p className="font-semibold">Integration Note:</p>
                <p>
                  Modern satellite systems typically integrate star trackers, gyroscopes, and GPS receivers to achieve 
                  high accuracy in attitude and position determination. The values entered here should reflect the 
                  combined system performance, not individual sensor specifications.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ParameterHelp;
