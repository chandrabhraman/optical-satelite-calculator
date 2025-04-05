
import { useState } from "react";
import CalculatorForm from "@/components/CalculatorForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import SatelliteVisualization from "@/components/SatelliteVisualization";
import { SensorInputs, CalculationResults } from "@/utils/types";
import { calculateResults } from "@/utils/calculationUtils";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const [inputs, setInputs] = useState<SensorInputs | null>(null);
  const [results, setResults] = useState<CalculationResults | undefined>(undefined);

  const handleCalculate = (formInputs: SensorInputs) => {
    setInputs(formInputs);
    const calculatedResults = calculateResults(formInputs);
    setResults(calculatedResults);
  };

  return (
    <div className="min-h-screen space-gradient text-foreground">
      <div className="container mx-auto py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Satellite Optical Sensor Calculator</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Calculate optical sensor parameters and visualize sensor field coverage for satellite applications.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
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
    </div>
  );
};

export default Index;
