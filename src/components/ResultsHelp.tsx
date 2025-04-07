
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

interface ResultsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ResultsHelp = ({ open, onOpenChange }: ResultsHelpProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Understanding Calculation Results</span>
            <DialogClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogTitle>
          <DialogDescription>
            Learn about the calculation results and their significance in satellite optical sensor design.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="basic">Basic Parameters</TabsTrigger>
            <TabsTrigger value="error">Error Analysis</TabsTrigger>
            <TabsTrigger value="coverage">Coverage Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Ground Sample Distance (GSD)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The calculated GSD represents the distance between pixel centers as measured on the ground. 
                This is effectively the spatial resolution of your imagery. The calculator shows both the center 
                GSD (at nadir) and the edge GSD (at the edge of the sensor's field of view).
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Interpretation:</strong> Lower GSD values indicate higher spatial resolution. For example, a GSD 
                of 0.5m means you can resolve objects approximately 0.5m in size or larger.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">Instantaneous Field of View (IFOV)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                IFOV is the angular measurement of the ground area viewed by a single detector element (pixel). 
                It's expressed in microradians (μrad) and represents the angular resolution of the sensor.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">Field of View (FOV)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The total angular extent of the observable area. The calculator shows both horizontal and vertical 
                FOV in degrees, as well as the swath width (the width of the area imaged on the ground) in kilometers.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Operational Significance:</strong> Larger FOV/swath width means more area covered in a single 
                image, potentially reducing the number of images (and satellite passes) required to map a region.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">F-Number</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The ratio of the focal length to the aperture diameter (focal length ÷ aperture). This value 
                affects the light-gathering ability and diffraction limit of the optical system.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Design Consideration:</strong> Lower f-numbers gather more light but may have shallower 
                depth of field and require more complex optical designs to minimize aberrations.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="error" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Attitude-Induced Error</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The ground position error caused by uncertainties in the satellite's attitude (orientation) measurement. 
                This is calculated for each axis (roll, pitch, and yaw) and combined as a root sum square (RSS) error.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">Edge Position Change</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The change in position of pixels at the edge of the sensor's field of view due to attitude errors. 
                These values are typically larger than the center errors due to the increased effect of angular 
                errors at the edges of the field of view.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Geometric Accuracy:</strong> These values help determine the geometric accuracy of your imagery 
                without ground control points. For applications requiring precise measurements from imagery, these 
                errors must be managed and minimized.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">Total Geolocation Error</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The combined effect of all error sources (attitude errors, GPS position uncertainty, etc.) on the 
                accuracy with which features in the image can be mapped to their true locations on Earth's surface.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Application Impact:</strong> For mapping applications, this error determines how well 
                features identified in the satellite imagery will align with their true positions on a map.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="coverage" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Swath Width</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The width of the ground area captured in a single image frame, measured in kilometers. 
                This is calculated based on the sensor's horizontal field of view and the satellite's altitude.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">Maximum Off-Nadir Coverage</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The maximum distance from the satellite's ground track that can be imaged when using the 
                maximum off-nadir angle capability. This represents the satellite's cross-track imaging reach.
              </p>
              
              <h3 className="text-lg font-semibold text-primary mb-2">Total Accessible Width</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The total width of the area that can be accessed by the satellite in a single pass, combining 
                the swath width and the off-nadir pointing capability. This is a key factor in determining 
                revisit capabilities and area coverage rates.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Mission Planning:</strong> These parameters are crucial for mission planning, 
                determining how many satellites might be needed in a constellation to achieve desired 
                revisit times for specific regions of interest.
              </p>
              
              <div className="bg-muted/30 p-4 rounded-md text-sm">
                <p className="font-semibold">Real-World Application:</p>
                <p>
                  When planning satellite imaging operations, there's often a trade-off between coverage and resolution. 
                  The visualization component of this calculator helps illustrate the relationship between sensor 
                  specifications and the resulting coverage capabilities.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ResultsHelp;
