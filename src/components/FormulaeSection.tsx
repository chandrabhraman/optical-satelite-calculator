
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
    <Card className="glassmorphism w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Formulae</CardTitle>
      </CardHeader>
      <CardContent>
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
                {"$$ \\text{IFOV} = \\frac{\\text{Pixel Size } (\\mu m)}{1000 \\times \\text{Focal Length } (mm)} \\text{ radians} $$"}
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Ground Sample Distance (GSD)</h3>
              <p className="text-muted-foreground mb-2">The distance between pixel centers measured on the ground.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                {"$$ \\text{GSD} = \\frac{\\text{Pixel Size } (\\mu m) \\times \\text{Altitude } (km)}{1000 \\times \\text{Focal Length } (mm)} \\text{ meters} $$"}
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Field of View (FOV)</h3>
              <p className="text-muted-foreground mb-2">The angular extent of the observable area.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                {"$$ \\text{FOV}_H = 2 \\times \\arctan{\\left( \\frac{\\text{Sensor Width}_H}{2 \\times \\text{Focal Length}} \\right)} $$"}
                {"$$ \\text{FOV}_V = 2 \\times \\arctan{\\left( \\frac{\\text{Sensor Width}_V}{2 \\times \\text{Focal Length}} \\right)} $$"}
                {"$$ \\text{where } \\text{Sensor Width} = \\frac{\\text{Pixel Size } (\\mu m) \\times \\text{Pixel Count}}{1000} \\text{ mm} $$"}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="geometry" className="space-y-6">
            <div className="prose max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold">Center Pixel Size</h3>
              <p className="text-muted-foreground mb-2">Size of the pixel at the center of the image, accounting for Earth's curvature.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                {"$$ \\begin{align*} \\text{Center Pixel Size} = R_E \\times \\left[ \\left(\\arcsin\\left(\\sin\\left(\\theta_{\\text{off}} + \\text{IFOV}\\right) \\times \\left(1 + \\frac{h}{R_E}\\right)\\right) - \\theta_{\\text{off}} - \\text{IFOV}\\right) - \\\\ \\left(\\arcsin\\left(\\sin\\left(\\theta_{\\text{off}}\\right) \\times \\left(1 + \\frac{h}{R_E}\\right)\\right) - \\theta_{\\text{off}}\\right) \\right] \\end{align*} $$"}
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Edge Pixel Size</h3>
              <p className="text-muted-foreground mb-2">Size of pixels at the edge of the sensor's field of view.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                {"$$ \\begin{align*} \\text{Edge Pixel Size} = R_E \\times \\left[ \\left(\\arcsin\\left(\\sin\\left(\\theta_{\\text{off}} + \\frac{\\text{FOV}_H}{2} + \\text{IFOV}\\right) \\times \\left(1 + \\frac{h}{R_E}\\right)\\right) - \\theta_{\\text{off}} - \\frac{\\text{FOV}_H}{2} - \\text{IFOV}\\right) - \\\\ \\left(\\arcsin\\left(\\sin\\left(\\theta_{\\text{off}} + \\frac{\\text{FOV}_H}{2}\\right) \\times \\left(1 + \\frac{h}{R_E}\\right)\\right) - \\theta_{\\text{off}} - \\frac{\\text{FOV}_H}{2}\\right) \\right] \\end{align*} $$"}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="errors" className="space-y-6">
            <div className="prose max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold">Edge Position Change (Roll)</h3>
              <p className="text-muted-foreground mb-2">Change in edge pixel position due to roll attitude error.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                {"$$ \\text{Roll Edge Change} = h \\times \\sec^2{(\\theta_{\\text{off}})} \\times \\sigma_{\\text{att}} $$"}
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Edge Position Change (Pitch)</h3>
              <p className="text-muted-foreground mb-2">Change in edge pixel position due to pitch attitude error.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                {"$$ \\text{Pitch Edge Change} = h \\times \\sec{(\\theta_{\\text{off}})} \\times \\sigma_{\\text{att}} $$"}
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Edge Position Change (Yaw)</h3>
              <p className="text-muted-foreground mb-2">Change in edge pixel position due to yaw attitude error.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                {"$$ \\text{Yaw Edge Change} = h \\times \\sec{(\\theta_{\\text{off}})} \\times \\sigma_{\\text{att}} $$"}
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Root Sum Square (RSS) Error</h3>
              <p className="text-muted-foreground mb-2">Combined error from all three attitude components.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                {"$$ \\text{RSS Error} = \\sqrt{(\\text{Roll Edge Change})^2 + (\\text{Pitch Edge Change})^2 + (\\text{Yaw Edge Change})^2} $$"}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Common variable definitions */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <h3 className="text-md font-medium mb-2 text-primary">Variable Definitions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex gap-2">
              <span className="font-bold">$R_E$:</span>
              <span className="text-muted-foreground">Earth radius (km)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">$h$:</span>
              <span className="text-muted-foreground">Altitude (km)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">$\\theta_{\\text{off}}$:</span>
              <span className="text-muted-foreground">Off-nadir angle (radians)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">$\\sigma_{\\text{att}}$:</span>
              <span className="text-muted-foreground">Attitude accuracy (radians)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">$\\text{IFOV}$:</span>
              <span className="text-muted-foreground">Instantaneous Field of View (radians)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">$\\text{FOV}$:</span>
              <span className="text-muted-foreground">Field of View (radians)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
