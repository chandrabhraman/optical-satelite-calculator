import { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import CalculatorForm from "@/components/CalculatorForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import SatelliteVisualization from "@/components/SatelliteVisualization";
import FormulaeSection from "@/components/FormulaeSection";
import { SensorInputs, CalculationResults } from "@/utils/types";
import { calculateResults } from "@/utils/calculationUtils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import ShareDialog from "@/components/ShareDialog";
import GlobalCounter from "@/components/GlobalCounter";
import Footer from "@/components/Footer";

const Index = () => {
  const [inputs, setInputs] = useState<SensorInputs | null>(null);
  const [results, setResults] = useState<CalculationResults | undefined>(undefined);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [parameterHelpOpen, setParameterHelpOpen] = useState(false);
  const [resultsHelpOpen, setResultsHelpOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [calculationCount, setCalculationCount] = useState<number>(() => {
    const savedCount = localStorage.getItem('local-calculation-count');
    return savedCount ? parseInt(savedCount, 10) : 0;
  });
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
          const newCount = calculationCount + 1;
          setCalculationCount(newCount);
          localStorage.setItem('local-calculation-count', newCount.toString());
          
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
    const newCount = calculationCount + 1;
    setCalculationCount(newCount);
    localStorage.setItem('local-calculation-count', newCount.toString());
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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Satellite Optical Sensor Calculator",
    "applicationCategory": "ScientificApplication",
    "operatingSystem": "Web",
    "description": "Calculate optical sensor parameters and visualize sensor field coverage for satellite applications.",
    "keywords": "satellite optical sensor, GSD calculator, ground sample distance, satellite imaging, earth observation, remote sensing, sensor field coverage, satellite engineering, orbital parameters, sensor footprint, satellite visualization",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <Helmet>
        <title>Satellite Optical Sensor Calculator | Precision Satellite Tools</title>
        <meta name="description" content="Professional tool to calculate optical sensor parameters, ground sample distance (GSD), and visualize satellite sensor field coverage with precision engineering." />
        <meta name="keywords" content="satellite optical sensor, GSD calculator, ground sample distance, satellite imaging, earth observation, remote sensing, sensor field coverage, satellite engineering, orbital parameters, sensor footprint, satellite visualization" />
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3334194678637115" 
          crossOrigin="anonymous" 
        />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <style>
          {`
            @keyframes shake {
              0% { transform: translateX(0); }
              20% { transform: translateX(-5px); }
              40% { transform: translateX(5px); }
              60% { transform: translateX(-3px); }
              80% { transform: translateX(3px); }
              100% { transform: translateX(0); }
            }
          `}
        </style>
      </Helmet>

      <main className="min-h-screen space-gradient text-foreground">
        <div className="container mx-auto py-8 pb-12">
          <header className="text-center mb-12 relative">
            <div className="absolute top-0 right-0 pt-2">
              <GlobalCounter localCount={calculationCount} />
            </div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-3 font-serif">
              Satellite Optical Sensor Calculator
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Calculate optical sensor parameters and visualize sensor field coverage for satellite applications.
            </p>
          </header>

          <section className="prose prose-invert mx-auto mb-12 w-full max-w-4xl">
            <h2 className="text-primary">How to Use Satellite Optical Sensor Calculator</h2>
            <p>
              This calculator simplifies complex satellite sensor design by providing approximate calculations 
              for optical parameters. Enter your specifications, click calculate, and instantly visualize results
              for Earth observation systems with professional precision.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-primary">Sensor Parameters</h2>
              </div>
              <CalculatorForm onCalculate={handleCalculate} />
              
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-primary">Calculation Results</h2>
              </div>
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
              <SatelliteVisualization 
                inputs={inputs} 
                calculationCount={calculationCount} 
              />
            </section>
          </div>
          
          <section className="mt-16">
            <FormulaeSection />
          </section>
          
          <section className="my-16 prose prose-invert mx-auto w-full max-w-4xl">
            <h2 className="text-primary">Applications of Satellite Optical Sensor Calculator</h2>
            
            <p>
              Our calculator enables engineers and researchers to rapidly prototype some aspects of optical systems,
              compare different sensor configurations, optimize parameters for specific missions, 
              and visualize coverage capabilities—all essential for effective satellite design and analysis.
            </p>
          </section>
        </div>
        
        <Footer />
        
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
