
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculationResults } from "@/utils/types";

interface ResultsDisplayProps {
  results?: CalculationResults;
  altitude?: number; // New prop to pass the altitude
}

const ResultsSection = ({ title, data, showGeoreferencingErrors = false }: { 
  title: string; 
  data: Record<string, number>;
  showGeoreferencingErrors?: boolean;
}) => {
  // Separate the data into general results and georeferencing errors
  const generalResults: Record<string, number> = {};
  const georeferencingErrors: Record<string, number> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (['rollEdgeChange', 'pitchEdgeChange', 'yawEdgeChange', 'rssError'].includes(key)) {
      georeferencingErrors[key] = value;
    } else {
      generalResults[key] = value;
    }
  });
  
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-medium text-primary">{title}</h3>
      
      {/* General Results */}
      <div className="space-y-2">
        {Object.entries(generalResults).map(([key, value]) => (
          <div key={key} className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">{formatLabel(key)}</div>
            <div className="text-right font-mono">{formatValue(key, value)}</div>
          </div>
        ))}
      </div>
      
      {/* Georeferencing Errors Section - Only displayed in worstCase tab */}
      {showGeoreferencingErrors && Object.keys(georeferencingErrors).length > 0 && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <h4 className="text-sm font-medium text-primary mb-2">Georeferencing Errors</h4>
          <div className="space-y-2">
            {Object.entries(georeferencingErrors).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">{formatLabel(key)}</div>
                <div className="text-right font-mono">{formatValue(key, value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const formatLabel = (key: string): string => {
  const labels: Record<string, string> = {
    centerPixelSize: "Center Pixel Size",
    edgePixelSize: "Edge Pixel Size",
    rollEdgeChange: "Edge Position Change (Roll)",
    pitchEdgeChange: "Edge Position Change (Pitch)",
    yawEdgeChange: "Edge Position Change (Yaw)",
    rssError: "RSS Error in Y,P,R",
    horizontalFootprint: "Horizontal Footprint (Swath)",
    verticalFootprint: "Vertical Footprint"
  };
  
  return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const formatValue = (key: string, value: number): string => {
  if (isNaN(value)) {
    return "N/A";
  }
  
  if (key.includes("Angle")) {
    return `${value.toFixed(4)}°`;
  } else if (key.includes("Footprint")) {
    return `${value.toFixed(2)} km`;
  } else if (key.includes("Size") || key.includes("Change") || key.includes("Error")) {
    return `${value.toFixed(2)} m`;
  }
  return value.toFixed(4).toString();
};

const ResultsDisplay = ({ results, altitude = 600 }: ResultsDisplayProps) => {
  if (!results) {
    return null;
  }

  const altitudeInKm = altitude >= 1000 ? (altitude / 1000) : altitude;
  const altitudeDisplay = `${altitudeInKm.toFixed(0)} km`;

  return (
    <Card className="glassmorphism w-full">
      <CardContent className="p-6">
        <Tabs defaultValue="nominal">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="nominal">Nadir geometry</TabsTrigger>
            <TabsTrigger value="worstCase">Off Nadir geometry</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nominal" className="space-y-4">
            <ResultsSection 
              title={`Nadir Facing @ ${altitudeDisplay}`}
              data={results.nominal} 
              showGeoreferencingErrors={false}
            />
          </TabsContent>
          
          <TabsContent value="worstCase" className="space-y-4">
            <ResultsSection 
              title={`Off-Nadir Facing @ ${altitudeDisplay}`}
              data={results.worstCase} 
              showGeoreferencingErrors={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay;
