
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
  const [analysisParameters, setAnalysisParameters] = useState({
    satellites: [],
    timeSpan: 24
  });
  
  const handleRunAnalysis = (formData: any) => {
    // Start analysis process
    setIsAnalysisRunning(true);
    setAnalysisProgress(0);
    
    // Store analysis parameters
    setAnalysisParameters({
      satellites: formData.satellites || [],
      timeSpan: formData.timeSpan || 24
    });
    
    // Mock progress updates - in a real implementation, this would be based on the
    // actual propagation progress from the Orekit SGP4 calculations
    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsAnalysisRunning(false);
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
