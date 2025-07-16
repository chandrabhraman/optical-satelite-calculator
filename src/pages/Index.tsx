import { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
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
import { SEOHead } from "@/components/SEOHead";
import { toolKeywords, metaDescriptions } from "@/utils/seoUtils";

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

  const faqItems = [
    {
      question: "What is Ground Sample Distance (GSD) and why is it important?",
      answer: "Ground Sample Distance (GSD) is the distance between two adjacent pixel centers measured on the ground. It determines the spatial resolution of satellite imagery and directly affects the level of detail that can be observed in the images."
    },
    {
      question: "How accurate are these satellite sensor calculations?",
      answer: "Our calculator provides approximate calculations suitable for preliminary design and educational purposes. For mission-critical applications, detailed optical modeling and professional validation are recommended."
    },
    {
      question: "Can I use this calculator for commercial satellite projects?",
      answer: "Yes, this tool is useful for initial analysis and conceptual design phases. However, we recommend professional optical analysis software for final design validation and mission planning."
    },
    {
      question: "What orbital parameters affect sensor performance?",
      answer: "Key orbital parameters include altitude, inclination, off-nadir angle, and ground track patterns. These affect coverage area, revisit time, and achievable ground sample distance."
    }
  ];

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Satellite Calculator", url: "/" }
  ];

  return (
    <>
      <SEOHead
        title="Satellite Optical Sensor Calculator | Professional GSD & Coverage Analysis"
        description={metaDescriptions.home}
        keywords={toolKeywords.calculator}
        structuredData={[
          {
            type: 'Calculator',
            name: 'Satellite Optical Sensor Calculator',
            description: metaDescriptions.home,
            url: 'https://opticalsatellitetools.space/'
          },
          {
            type: 'FAQ',
            faqItems: faqItems
          },
          {
            type: 'BreadcrumbList',
            breadcrumbs: breadcrumbs
          }
        ]}
      />
      
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
