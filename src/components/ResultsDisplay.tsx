
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculationResults } from "@/utils/types";

interface ResultsDisplayProps {
  results?: CalculationResults;
}

const ResultsSection = ({ title, data }: { title: string; data: Record<string, number> }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-medium text-primary">{title}</h3>
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">{formatLabel(key)}</div>
          <div className="text-right font-mono">{formatValue(key, value)}</div>
        </div>
      ))}
    </div>
  </div>
);

const formatLabel = (key: string): string => {
  const labels: Record<string, string> = {
    centerPixelSize: "Center Pixel Size",
    edgePixelAngle: "Edge Pixel Angle from Nadir",
    earthCenterAngle: "Angle Subtended at Earth Center",
    edgePixelSize: "Edge Pixel Size",
    attitudeControlChange: "Coverage Change due to Attitude Control",
    attitudeMeasurementChange: "Coverage Change due to Measurement",
    gpsPositionChange: "Pixel Position Change due to GPS",
    rollEdgeChange: "Edge Position Change (Roll)",
    pitchEdgeChange: "Edge Position Change (Pitch)",
    yawEdgeChange: "Edge Position Change (Yaw)",
    rssError: "RSS Error in Y,P,R"
  };
  
  return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const formatValue = (key: string, value: number): string => {
  if (key.includes("Angle")) {
    return `${value.toFixed(4)}°`;
  } else if (key.includes("Size") || key.includes("Change") || key.includes("Error")) {
    return `${value.toFixed(2)} m`;
  }
  return value.toFixed(4).toString();
};

const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  if (!results) {
    return (
      <Card className="glassmorphism w-full h-full flex items-center justify-center">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Enter parameters and click Calculate to see results</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphism w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">Calculation Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="nominal">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="nominal">Nominal Scenario</TabsTrigger>
            <TabsTrigger value="worstCase">Worst Case Scenario</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nominal" className="space-y-4">
            <ResultsSection 
              title="Nadir Facing @ Max Altitude" 
              data={results.nominal} 
            />
          </TabsContent>
          
          <TabsContent value="worstCase" className="space-y-4">
            <ResultsSection 
              title="Off-Nadir Facing @ Max Altitude" 
              data={results.worstCase} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay;
