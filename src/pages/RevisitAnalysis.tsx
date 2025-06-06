
import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Footer from "@/components/Footer";
import RevisitAnalysisForm from "@/components/revisit/RevisitAnalysisForm";
import RevisitVisualization from "@/components/revisit/RevisitVisualization";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RocketIcon } from "lucide-react";

const RevisitAnalysis: React.FC = () => {
  // State for handling analysis results
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("map");
  const [analysisData, setAnalysisData] = useState<{
    satellites: Array<{
      id: string;
      name: string;
      altitude: number;
      inclination: number;
      raan: number;
      trueAnomaly: number;
    }>;
    timeSpan: number;
  } | null>(null);
  
  const handleRunAnalysis = (formData: any) => {
    console.log("Starting analysis with form data:", formData);
    console.log("Form data satellites:", formData.satellites);
    console.log("Form data timeSpan:", formData.timeSpan);
    
    // Validate that we have satellites data
    if (!formData.satellites || !Array.isArray(formData.satellites) || formData.satellites.length === 0) {
      console.error("No satellites data received from form");
      return;
    }
    
    // Start analysis process
    setIsAnalysisRunning(true);
    setAnalysisProgress(0);
    
    // Store the actual analysis data from the form
    const newAnalysisData = {
      satellites: formData.satellites,
      timeSpan: formData.timeSpan || 24
    };
    
    console.log("Setting analysis data with satellites count:", newAnalysisData.satellites.length);
    console.log("Full analysis data:", newAnalysisData);
    setAnalysisData(newAnalysisData);
    
    // Mock progress updates - in a real implementation, this would be based on the
    // actual propagation progress from the Orekit SGP4 calculations
    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsAnalysisRunning(false);
          console.log("Analysis complete, final data:", newAnalysisData);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  return (
    <>
      <Helmet>
        <title>Revisit Analysis | Satellite Optical Sensor Calculator</title>
        <meta 
          name="description" 
          content="Design and analyze satellite constellations to understand revisit characteristics and coverage patterns using SGP4 propagation." 
        />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 font-serif">Satellite Revisit Analysis</h1>
        
        <Alert className="mb-4">
          <RocketIcon className="h-4 w-4" />
          <AlertDescription>
            Using SGP4 orbit propagator for accurate satellite positioning calculations.
            Analysis displays realistic ground tracks and revisit statistics.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input Form */}
          <div className="lg:col-span-1">
            <Card className="h-full glassmorphism">
              <CardHeader>
                <CardTitle>Constellation Parameters</CardTitle>
                <CardDescription>
                  Define your satellite constellation and analysis parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[calc(100vh-240px)]">
                <RevisitAnalysisForm 
                  onRunAnalysis={handleRunAnalysis}
                  isAnalysisRunning={isAnalysisRunning}
                  analysisProgress={analysisProgress}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Visualization */}
          <div className="lg:col-span-2">
            <Card className="h-full glassmorphism">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Analysis & Visualization</span>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="map">Map & Animation</TabsTrigger>
                      <TabsTrigger value="heatmap">Global Heatmap</TabsTrigger>
                      <TabsTrigger value="aoi">AOI Analysis</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-1 h-[calc(100vh-240px)]">
                <RevisitVisualization 
                  tab={activeTab}
                  isAnalysisRunning={isAnalysisRunning}
                  analysisProgress={analysisProgress}
                  analysisData={analysisData}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default RevisitAnalysis;
