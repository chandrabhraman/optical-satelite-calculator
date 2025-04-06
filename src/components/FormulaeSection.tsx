
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect } from "react";

// We'll use MathJax for rendering LaTeX
const FormulaeSection = () => {
  // Initialize MathJax on component mount
  useEffect(() => {
    // Add MathJax script if it doesn't exist
    if (!window.MathJax) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
      script.async = true;
      document.head.appendChild(script);

      // Configure MathJax
      window.MathJax = {
        tex: {
          inlineMath: [["$", "$"]],
          displayMath: [["$$", "$$"]],
        },
        svg: {
          fontCache: "global",
        },
      };
    } else {
      // If MathJax is already loaded, typeset the page
      if (window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
      }
    }
  }, []);

  // Trigger MathJax rendering when tab changes
  const handleTabChange = () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      setTimeout(() => {
        window.MathJax.typesetPromise();
      }, 100);
    }
  };

  return (
    <div className="glassmorphism w-full rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Formulae</h3>
      </div>
      <div className="p-6 pt-0">
        <Tabs defaultValue="basic" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="basic">Basic Parameters</TabsTrigger>
            <TabsTrigger value="geometry">Geometric Calculations</TabsTrigger>
            <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6">
            <div className="prose max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold">Instantaneous Field of View (IFOV)</h3>
              <p className="text-muted-foreground mb-2">The angular measurement of a single detector element's view.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="font-mono">IFOV = (Pixel Size μm) / (1000 × Focal Length mm) [radians]</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Ground Sample Distance (GSD)</h3>
              <p className="text-muted-foreground mb-2">The distance between pixel centers measured on the ground.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="font-mono">GSD = (Pixel Size μm × Altitude km) / (1000 × Focal Length mm) [meters]</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Field of View (FOV)</h3>
              <p className="text-muted-foreground mb-2">The angular extent of the observable area.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="font-mono">FOV_H = 2 × arctan(Sensor Width_H / (2 × Focal Length))</p>
                <p className="font-mono">FOV_V = 2 × arctan(Sensor Width_V / (2 × Focal Length))</p>
                <p className="font-mono">where Sensor Width = (Pixel Size μm × Pixel Count) / 1000 [mm]</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="geometry" className="space-y-6">
            <div className="prose max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold">Center Pixel Size</h3>
              <p className="text-muted-foreground mb-2">Size of the pixel at the center of the image, accounting for Earth's curvature.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="font-mono">Center Pixel Size = R_E × [arcsin(sin(θ_off + IFOV) × (1 + h/R_E)) - θ_off - IFOV) - </p>
                <p className="font-mono">                      (arcsin(sin(θ_off) × (1 + h/R_E)) - θ_off)]</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Edge Pixel Size</h3>
              <p className="text-muted-foreground mb-2">Size of pixels at the edge of the sensor's field of view.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="font-mono">Edge Pixel Size = R_E × [arcsin(sin(θ_off + FOV_H/2 + IFOV) × (1 + h/R_E)) - θ_off - FOV_H/2 - IFOV) - </p>
                <p className="font-mono">                     (arcsin(sin(θ_off + FOV_H/2) × (1 + h/R_E)) - θ_off - FOV_H/2)]</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="errors" className="space-y-6">
            <div className="prose max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold">Edge Position Change (Roll)</h3>
              <p className="text-muted-foreground mb-2">Change in edge pixel position due to roll attitude error.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="font-mono">Roll Edge Change = h × tan(FOV_H/2) × σ_att</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Edge Position Change (Pitch)</h3>
              <p className="text-muted-foreground mb-2">Change in edge pixel position due to pitch attitude error.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="font-mono">Pitch Edge Change = h × σ_att</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Edge Position Change (Yaw)</h3>
              <p className="text-muted-foreground mb-2">Change in edge pixel position due to yaw attitude error.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="font-mono">Yaw Edge Change = h × tan(FOV_H/2) × σ_att</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Root Sum Square (RSS) Error</h3>
              <p className="text-muted-foreground mb-2">Combined error from all three attitude components.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="font-mono">RSS Error = √((Roll Edge Change)² + (Pitch Edge Change)² + (Yaw Edge Change)²)</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Common variable definitions */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <h3 className="text-md font-medium mb-2 text-primary">Variable Definitions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex gap-2">
              <span className="font-bold">R_E:</span>
              <span className="text-muted-foreground">Earth radius (km)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">h:</span>
              <span className="text-muted-foreground">Altitude (km)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">θ_off:</span>
              <span className="text-muted-foreground">Off-nadir angle (radians)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">σ_att:</span>
              <span className="text-muted-foreground">Attitude accuracy (radians)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">IFOV:</span>
              <span className="text-muted-foreground">Instantaneous Field of View (radians)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">FOV:</span>
              <span className="text-muted-foreground">Field of View (radians)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulaeSection;

// Define the MathJax types for TypeScript
declare global {
  interface Window {
    MathJax: {
      typesetPromise?: () => Promise<any>;
      tex?: {
        inlineMath: string[][];
        displayMath: string[][];
      };
      svg?: {
        fontCache: string;
      };
    };
  }
}
