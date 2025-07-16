
import React, { useState } from "react";
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
import { SEOHead } from "@/components/SEOHead";
import { toolKeywords, metaDescriptions } from "@/utils/seoUtils";

const RevisitAnalysis: React.FC = () => {
  // State for handling analysis results
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("heatmap");
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
    gridCellSize: string;
  } | null>(null);
  
  const handleRunAnalysis = (formData: any) => {
    console.log("Starting analysis with form data:", formData);
    
    // Generate satellites array based on form data
    const satellites = [];
    const numSatellites = formData.totalSatellites || 1;
    
    for (let i = 0; i < numSatellites; i++) {
      let satellite = {
        id: `sat_${i + 1}`,
        name: `Satellite ${i + 1}`,
        altitude: formData.altitude || 550,
        inclination: formData.inclination || 97.6,
        raan: formData.raan || 0,
        trueAnomaly: 0
      };
      
      // Handle GEO orbit type
      if (formData.orbitType === "geo") {
        satellite.altitude = 35786; // GEO altitude in km
        satellite.inclination = formData.inclination || 0; // Use form inclination or default to 0
        // Convert longitude to RAAN (longitude is the sub-satellite point)
        satellite.raan = formData.longitudeGEO || 0;
        satellite.trueAnomaly = 0; // GEO satellites are typically at 0 true anomaly
      }
      // Adjust parameters based on constellation type
      else if (formData.constellationType === "train") {
        // For train constellation, space satellites in mean anomaly
        satellite.trueAnomaly = i * (formData.inPlaneSpacing || 30);
      } else if (formData.constellationType === "walker") {
        // For walker constellation, distribute across planes
        const satellitesPerPlane = Math.floor(numSatellites / (formData.planes || 1));
        const planeIndex = Math.floor(i / satellitesPerPlane);
        const satInPlane = i % satellitesPerPlane;
        
        satellite.raan = (formData.raan || 0) + (planeIndex * 180 / (formData.planes || 1));
        satellite.trueAnomaly = satInPlane * (360 / satellitesPerPlane) + (planeIndex * (formData.phasing || 0));
      }
      
      satellites.push(satellite);
    }
    
    console.log("Generated satellites:", satellites);
    
    // Start analysis process
    setIsAnalysisRunning(true);
    setAnalysisProgress(0);
    
    // Calculate time span from start and end dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const timeSpanHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    
    // Store the analysis data with generated satellites
    const newAnalysisData = {
      satellites: satellites,
      timeSpan: timeSpanHours,
      gridCellSize: formData.gridCellSize
    };
    
    console.log("Setting analysis data with satellites count:", newAnalysisData.satellites.length);
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

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Revisit Analysis", url: "/revisit-analysis" }
  ];

  const faqItems = [
    {
      question: "What is satellite revisit time?",
      answer: "Revisit time is the time interval between consecutive observations of the same location by a satellite. It depends on orbital parameters, sensor characteristics, and mission requirements."
    },
    {
      question: "How do I optimize coverage for my mission?",
      answer: "Coverage optimization involves adjusting orbital altitude, inclination, constellation size, and phasing to achieve desired revisit times and global coverage patterns."
    }
  ];

  return (
    <>
      <SEOHead
        title="Satellite Revisit Analysis | Ground Track & Coverage Pattern Analysis"
        description={metaDescriptions.revisit}
        keywords={toolKeywords.revisit}
        canonical="https://opticalsatellitetools.space/revisit-analysis"
        structuredData={[
          {
            type: 'WebApplication',
            name: 'Satellite Revisit Analysis Tool',
            description: metaDescriptions.revisit,
            url: 'https://opticalsatellitetools.space/revisit-analysis',
            applicationCategory: 'UtilityApplication'
          },
          {
            type: 'BreadcrumbList',
            breadcrumbs: breadcrumbs
          },
          {
            type: 'FAQ',
            faqItems: faqItems
          }
        ]}
      />
      
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
