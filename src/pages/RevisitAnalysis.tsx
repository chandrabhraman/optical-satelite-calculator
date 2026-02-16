
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
import { generateTLE } from "@/utils/tleGenerator";

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
      tle?: string;
      eccentricity?: number;
      argOfPerigee?: number;
    }>;
    timeSpan: number;
    gridCellSize: string;
    startDate: Date;
    endDate: Date;
    onlyDaytimeRevisit?: boolean;
    localDaytimeStart?: number;
    localDaytimeEnd?: number;
  } | null>(null);
  
  const handleRunAnalysis = (formData: any) => {
    console.log("Starting analysis with form data:", formData);
    
    // Generate satellites array based on form data
    const satellites = [];
    
    // Handle Celestrak workflow
    if (formData.constellationType === "celestrak" && formData.celestrakSatellites) {
      console.log("Processing Celestrak satellites:", formData.celestrakSatellites.length);
      
      for (const satData of formData.celestrakSatellites) {
        satellites.push({
          id: `celestrak_${satData.noradId}`,
          name: satData.name,
          altitude: 0, // Will be determined from TLE
          inclination: 0, // Will be determined from TLE
          raan: 0,
          trueAnomaly: 0,
          eccentricity: 0,
          argOfPerigee: 0,
          tle: satData.tle
        });
      }
    } else {
      // Original manual workflow
      const numSatellites = Number(formData.totalSatellites) || 1;
      
      // Parse all numeric values upfront to avoid string issues
      const altitude = Number(formData.altitude) || 550;
      const inclination = Number(formData.inclination) || 97.6;
      const raan = Number(formData.raan) || 0;
      const eccentricity = Number(formData.eccentricity) || 0.0;
      const argOfPerigee = Number(formData.argOfPerigee) || 0.0;
      const inPlaneSpacing = Number(formData.inPlaneSpacing) || 30;
      const planes = Number(formData.planes) || 1;
      const phasing = Number(formData.phasing) || 0;
      const longitudeGEO = Number(formData.longitudeGEO) || 0;
      
      for (let i = 0; i < numSatellites; i++) {
        let satellite = {
          id: `sat_${i + 1}`,
          name: `Satellite ${i + 1}`,
          altitude: altitude,
          inclination: inclination,
          raan: raan,
          trueAnomaly: 0,
          eccentricity: eccentricity,
          argOfPerigee: argOfPerigee,
          tle: undefined as string | undefined
        };
        
        // Handle GEO orbit type
        if (formData.orbitType === "geo") {
          satellite.altitude = 35786; // GEO altitude in km
          satellite.inclination = Number(formData.inclination) || 0;
          satellite.raan = longitudeGEO;
          satellite.trueAnomaly = 0;
        }
        
        // Adjust parameters based on constellation type (applied AFTER orbit type)
        if (formData.constellationType === "train") {
          // For train constellation, space satellites in mean anomaly
          satellite.trueAnomaly = i * inPlaneSpacing;
        } else if (formData.constellationType === "walker") {
          // For walker constellation, distribute across planes
          const satellitesPerPlane = Math.floor(numSatellites / planes);
          const planeIndex = Math.floor(i / satellitesPerPlane);
          const satInPlane = i % satellitesPerPlane;
          
          satellite.raan = raan + (planeIndex * 180 / planes);
          satellite.trueAnomaly = satInPlane * (360 / satellitesPerPlane) + (planeIndex * phasing);
        }
        
        // Generate TLE for this satellite
        if (formData.tleInput && formData.constellationType === "single") {
          satellite.tle = formData.tleInput;
        } else {
          satellite.tle = generateTLE({
            altitude: satellite.altitude,
            inclination: satellite.inclination,
            raan: satellite.raan,
            trueAnomaly: satellite.trueAnomaly,
            eccentricity: satellite.eccentricity,
            argOfPerigee: satellite.argOfPerigee
          });
        }
        
        satellites.push(satellite);
      }
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
      gridCellSize: formData.gridCellSize,
      startDate: startDate,
      endDate: endDate,
      onlyDaytimeRevisit: formData.onlyDaytimeRevisit || false,
      localDaytimeStart: parseInt(formData.localDaytimeStart) || 1000,
      localDaytimeEnd: parseInt(formData.localDaytimeEnd) || 1700
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
      
      <div className="min-h-screen space-gradient">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4">
              Satellite Revisit Analysis
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Comprehensive analysis of satellite ground tracks, coverage patterns, and revisit times 
              using SGP4 orbit propagator for accurate positioning calculations.
            </p>
          </div>
          
          <Alert className="mb-6 glassmorphism border-primary/20">
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
      </div>
      
      <Footer />
    </>
  );
};

export default RevisitAnalysis;
