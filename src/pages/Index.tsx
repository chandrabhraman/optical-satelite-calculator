
import { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import CalculatorForm from "@/components/CalculatorForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import SatelliteVisualization from "@/components/SatelliteVisualization";
import FormulaeSection from "@/components/FormulaeSection";
import { SensorInputs, CalculationResults } from "@/utils/types";
import { calculateResults } from "@/utils/calculationUtils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import ShareDialog from "@/components/ShareDialog";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const [inputs, setInputs] = useState<SensorInputs | null>(null);
  const [results, setResults] = useState<CalculationResults | undefined>(undefined);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const paramsExist = Array.from(searchParams.keys()).length > 0;
    
    if (paramsExist) {
      try {
        const inputsFromUrl: Partial<SensorInputs> = {};
        
        for (const [key, value] of searchParams.entries()) {
          if (key in (inputs || {}) && !isNaN(Number(value))) {
            inputsFromUrl[key as keyof SensorInputs] = Number(value);
          }
        }
        
        if (inputsFromUrl.altitudeMin !== undefined) {
          inputsFromUrl.altitudeMin *= 1000;
        }
        
        if (inputsFromUrl.altitudeMax !== undefined) {
          inputsFromUrl.altitudeMax *= 1000;
        }
        
        const requiredKeys: (keyof SensorInputs)[] = [
          'pixelSize', 'pixelCountH', 'pixelCountV', 'gsdRequirements',
          'altitudeMin', 'altitudeMax', 'focalLength', 'aperture',
          'attitudeAccuracy', 'nominalOffNadirAngle', 'maxOffNadirAngle', 'gpsAccuracy'
        ];
        
        const allParamsPresent = requiredKeys.every(key => inputsFromUrl[key] !== undefined);
        
        if (allParamsPresent) {
          const completeInputs = inputsFromUrl as SensorInputs;
          setInputs(completeInputs);
          const calculatedResults = calculateResults(completeInputs);
          setResults(calculatedResults);
          
          toast({
            title: "Parameters loaded",
            description: "Calculation results have been loaded from the URL",
          });
        }
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
        toast({
          title: "Error loading parameters",
          description: "Could not load the calculation parameters from the URL",
          variant: "destructive"
        });
      }
    }
  }, []);

  const handleCalculate = (formInputs: SensorInputs) => {
    setInputs(formInputs);
    const calculatedResults = calculateResults(formInputs);
    setResults(calculatedResults);
  };

  const handleShare = () => {
    if (!results) {
      toast({
        title: "No results to share",
        description: "Please calculate results first before sharing.",
        variant: "destructive"
      });
      return;
    }
    setShareDialogOpen(true);
  };

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Satellite Optical Sensor Calculator",
    "applicationCategory": "ScientificApplication",
    "operatingSystem": "Web",
    "description": "Calculate optical sensor parameters and visualize sensor field coverage for satellite applications.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <Helmet>
        <title>Satellite Optical Sensor Calculator | Precision Engineering Tools</title>
        <meta name="description" content="Calculate optical sensor parameters and visualize sensor field coverage for satellite applications with our professional calculator tool." />
        <meta name="keywords" content="satellite, optical sensor, GSD, focal length, sensor calculator, satellite visualization" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <main className="min-h-screen space-gradient text-foreground">
        <div className="container mx-auto py-8 pb-24">
          <header className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-3 font-serif">
              Satellite Optical Sensor Calculator
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Calculate optical sensor parameters and visualize sensor field coverage for satellite applications.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-primary">Sensor Parameters</h2>
              <CalculatorForm onCalculate={handleCalculate} />
              <ResultsDisplay 
                results={results} 
                altitude={inputs?.altitudeMax}
              />
              
              {results && (
                <div className="flex justify-center mt-2 mb-4">
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-1" /> Share Results
                  </Button>
                </div>
              )}
            </section>
            
            <section className="h-full min-h-[70vh]">
              <SatelliteVisualization inputs={inputs} />
            </section>
          </div>
          
          {/* New Formulae Section */}
          <section className="mt-16">
            <FormulaeSection />
          </section>
          
          <footer className="mt-16 text-center text-xs text-muted-foreground">
            <Separator className="mb-4" />
            <p>Satellite Optical Sensor Calculator &copy; {new Date().getFullYear()}</p>
          </footer>
        </div>
        <ShareDialog 
          open={shareDialogOpen} 
          onOpenChange={setShareDialogOpen} 
          inputs={inputs} 
          results={results} 
        />
      </main>
    </>
  );
};

export default Index;
