
import { useState } from "react";
import { Share2 } from "lucide-react";
import CalculatorForm from "@/components/CalculatorForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import SatelliteVisualization from "@/components/SatelliteVisualization";
import { SensorInputs, CalculationResults } from "@/utils/types";
import { calculateResults } from "@/utils/calculationUtils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import ShareDialog from "@/components/ShareDialog";

const Index = () => {
  const [inputs, setInputs] = useState<SensorInputs | null>(null);
  const [results, setResults] = useState<CalculationResults | undefined>(undefined);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen space-gradient text-foreground">
      <div className="container mx-auto py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-3 font-serif">
            Satellite Optical Sensor Calculator
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Calculate optical sensor parameters and visualize sensor field coverage for satellite applications.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">Sensor Parameters</h2>
              {results && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-1" /> Share Results
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share your calculation results</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <CalculatorForm onCalculate={handleCalculate} />
            <ResultsDisplay results={results} />
          </div>
          
          <div className="h-full min-h-[80vh]">
            <SatelliteVisualization inputs={inputs} />
          </div>
        </div>
        
        <footer className="mt-12 text-center text-xs text-muted-foreground">
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
    </div>
  );
};

export default Index;
