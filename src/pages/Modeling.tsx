import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PSFAnalysisForm from "@/components/modeling/PSFAnalysisForm";
import MTFAnalysisForm from "@/components/modeling/MTFAnalysisForm";
import PSFVisualization from "@/components/modeling/PSFVisualization";
import MTFVisualization from "@/components/modeling/MTFVisualization";
import ModelingResults from "@/components/modeling/ModelingResults";
import { PSFInputs, MTFInputs, PSFResults, MTFResults } from "@/utils/modelingTypes";

const Modeling = () => {
  const [psfInputs, setPsfInputs] = useState<PSFInputs>({
    pixelSize: 5.5,
    aperture: 150,
    focalLength: 600,
    wavelength: 550,
    atmosphericCondition: 'clear',
    offNadirAngle: 0,
    defocusAmount: 0,
  });

  const [mtfInputs, setMtfInputs] = useState<MTFInputs>({
    ...psfInputs,
    spatialFrequencyRange: [0, 200] as [number, number],
    detectorQE: 0.85,
    electronicNoise: 50,
    platformVelocity: 7500,
    integrationTime: 0.001,
  });

  const [psfResults, setPsfResults] = useState<PSFResults | null>(null);
  const [mtfResults, setMtfResults] = useState<MTFResults | null>(null);
  const [activeTab, setActiveTab] = useState("psf");

  return (
    <>
      <Helmet>
        <title>Advanced Optical Modeling - PSF & MTF Analysis</title>
        <meta name="description" content="Advanced point spread function and modular transfer function analysis for satellite optical sensors" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4">
              Advanced Optical Modeling
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Comprehensive analysis of Point Spread Function (PSF) and Modular Transfer Function (MTF) 
              for satellite optical sensor performance optimization and design validation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Input Panel */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    Analysis Parameters
                  </CardTitle>
                  <CardDescription>
                    Configure optical system parameters for PSF and MTF analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="psf">PSF Analysis</TabsTrigger>
                      <TabsTrigger value="mtf">MTF Analysis</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="psf" className="mt-6">
                      <PSFAnalysisForm 
                        inputs={psfInputs}
                        onInputsChange={setPsfInputs}
                        onResultsChange={setPsfResults}
                      />
                    </TabsContent>
                    
                    <TabsContent value="mtf" className="mt-6">
                      <MTFAnalysisForm 
                        inputs={mtfInputs}
                        onInputsChange={setMtfInputs}
                        onResultsChange={setMtfResults}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Results Summary */}
              {(psfResults || mtfResults) && (
                <ModelingResults 
                  psfResults={psfResults}
                  mtfResults={mtfResults}
                  activeAnalysis={activeTab}
                />
              )}
            </div>

            {/* Visualization Panel */}
            <div className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    Interactive Visualizations
                  </CardTitle>
                  <CardDescription>
                    Real-time analysis and visualization of optical system performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-full">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="psf">PSF Analysis</TabsTrigger>
                      <TabsTrigger value="mtf">MTF Analysis</TabsTrigger>
                      <TabsTrigger value="combined">Combined View</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="psf" className="mt-6 h-full">
                      <PSFVisualization 
                        inputs={psfInputs}
                        results={psfResults}
                      />
                    </TabsContent>
                    
                    <TabsContent value="mtf" className="mt-6 h-full">
                      <MTFVisualization 
                        inputs={mtfInputs}
                        results={mtfResults}
                      />
                    </TabsContent>
                    
                    <TabsContent value="combined" className="mt-6 h-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                        <PSFVisualization 
                          inputs={psfInputs}
                          results={psfResults}
                          compact={true}
                        />
                        <MTFVisualization 
                          inputs={mtfInputs}
                          results={mtfResults}
                          compact={true}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modeling;