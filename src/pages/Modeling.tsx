import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PSFAnalysisForm from "@/components/modeling/PSFAnalysisForm";
import MTFAnalysisForm from "@/components/modeling/MTFAnalysisForm";
import PSFVisualization from "@/components/modeling/PSFVisualization";
import MTFVisualization from "@/components/modeling/MTFVisualization";
import ModelingResults from "@/components/modeling/ModelingResults";
import { PSFInputs, MTFInputs, PSFResults, MTFResults } from "@/utils/modelingTypes";
import { SEOHead } from "@/components/SEOHead";
import { toolKeywords, metaDescriptions } from "@/utils/seoUtils";

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
    altitude: 400000, // 400km LEO default
  });

  const [psfResults, setPsfResults] = useState<PSFResults | null>(null);
  const [mtfResults, setMtfResults] = useState<MTFResults | null>(null);
  const [activeTab, setActiveTab] = useState("psf");

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Modeling", url: "/modeling" }
  ];

  const faqItems = [
    {
      question: "What is PSF analysis used for in satellite optics?",
      answer: "Point Spread Function (PSF) analysis characterizes how a point source of light is spread by an optical system, helping evaluate image sharpness and optical quality."
    },
    {
      question: "How does MTF affect satellite image quality?",
      answer: "Modulation Transfer Function (MTF) measures how well an optical system preserves contrast at different spatial frequencies, directly impacting image detail and resolution."
    }
  ];

  return (
    <>
      <SEOHead
        title="Advanced Optical Modeling - PSF & MTF Analysis"
        description={metaDescriptions.modeling}
        keywords={toolKeywords.modeling}
        canonical="https://opticalsatellitetools.space/modeling"
        structuredData={[
          {
            type: 'WebApplication',
            name: 'Satellite Optical Modeling Tool',
            description: metaDescriptions.modeling,
            url: 'https://opticalsatellitetools.space/modeling',
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
                <CardContent className="h-[calc(100vh-12rem)] min-h-[600px]">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="psf">PSF Analysis</TabsTrigger>
                      <TabsTrigger value="mtf">MTF Analysis</TabsTrigger>
                      <TabsTrigger value="combined">Combined View</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="psf" className="mt-6 flex-1">
                      <PSFVisualization 
                        inputs={psfInputs}
                        results={psfResults}
                      />
                    </TabsContent>
                    
                    <TabsContent value="mtf" className="mt-6 flex-1">
                      <MTFVisualization 
                        inputs={mtfInputs}
                        results={mtfResults}
                      />
                    </TabsContent>
                    
                    <TabsContent value="combined" className="mt-6 flex-1">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[500px]">
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
      
      {/* Formulae Section */}
      <section className="mt-16">
        <ModelingFormulaeSection />
      </section>
    </>
  );
};

// Modeling Formulae Section Component
const ModelingFormulaeSection = () => {
  // Initialize MathJax on component mount
  useEffect(() => {
    if (!window.MathJax) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
      script.async = true;
      document.head.appendChild(script);

      window.MathJax = {
        tex: {
          inlineMath: [["$", "$"]],
          displayMath: [["$$", "$$"]],
        },
        svg: {
          fontCache: "global",
        },
      };
    } else {
      if (window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
      }
    }
  }, []);

  const handleTabChange = () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      setTimeout(() => {
        window.MathJax.typesetPromise();
      }, 100);
    }
  };

  return (
    <div className="glassmorphism w-full rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Optical Modeling Formulae</h3>
      </div>
      <div className="p-6 pt-0">
        <Tabs defaultValue="psf" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="psf">PSF Analysis</TabsTrigger>
            <TabsTrigger value="mtf">MTF Analysis</TabsTrigger>
            <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="psf" className="space-y-6">
            <div className="prose max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold">Airy Disk Diameter</h3>
              <p className="text-muted-foreground mb-2">The diffraction-limited spot size for a circular aperture.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{"$$d_{\\text{Airy}} = 2.44 \\times \\lambda \\times \\frac{f}{D}$$"}</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Diffraction-Limited PSF FWHM</h3>
              <p className="text-muted-foreground mb-2">Full Width at Half Maximum of the point spread function.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{"$$\\text{FWHM}_{\\text{diff}} = 1.22 \\times \\lambda \\times \\frac{f}{D}$$"}</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Atmospheric Seeing Effect</h3>
              <p className="text-muted-foreground mb-2">PSF degradation due to atmospheric turbulence.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{"$$\\text{FWHM}_{\\text{atm}} = \\begin{cases} 0 & \\text{clear} \\\\ 1.5 \\times \\text{FWHM}_{\\text{diff}} & \\text{hazy} \\\\ 3.0 \\times \\text{FWHM}_{\\text{diff}} & \\text{cloudy} \\end{cases}$$"}</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Combined PSF FWHM</h3>
              <p className="text-muted-foreground mb-2">Total PSF including all degradation sources.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{"$$\\text{FWHM}_{\\text{total}} = \\sqrt{\\text{FWHM}_{\\text{diff}}^2 + \\text{FWHM}_{\\text{atm}}^2 + \\text{FWHM}_{\\text{defocus}}^2}$$"}</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="mtf" className="space-y-6">
            <div className="prose max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold">Diffraction MTF</h3>
              <p className="text-muted-foreground mb-2">MTF limited by optical diffraction.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{"$$\\text{MTF}_{\\text{diff}}(f) = \\frac{2}{\\pi} \\left[ \\arccos\\left(\\frac{f}{f_c}\\right) - \\frac{f}{f_c}\\sqrt{1 - \\left(\\frac{f}{f_c}\\right)^2} \\right]$$"}</p>
                <p>{"$$\\text{where } f_c = \\frac{D}{\\lambda \\cdot f}$$"}</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Detector MTF</h3>
              <p className="text-muted-foreground mb-2">MTF degradation due to finite pixel size.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{"$$\\text{MTF}_{\\text{det}}(f) = \\left| \\frac{\\sin(\\pi f p)}{\\pi f p} \\right|$$"}</p>
                <p>{"$$\\text{where } p \\text{ is the pixel size}$$"}</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Motion MTF</h3>
              <p className="text-muted-foreground mb-2">MTF degradation due to image motion during exposure.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{"$$\\text{MTF}_{\\text{motion}}(f) = \\left| \\frac{\\sin(\\pi f d)}{\\pi f d} \\right|$$"}</p>
                <p>{"$$\\text{where } d = v \\cdot t_{\\text{int}} \\text{ (motion distance)}$$"}</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Overall System MTF</h3>
              <p className="text-muted-foreground mb-2">Combined MTF of all system components.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{"$$\\text{MTF}_{\\text{system}}(f) = \\text{MTF}_{\\text{diff}}(f) \\times \\text{MTF}_{\\text{det}}(f) \\times \\text{MTF}_{\\text{motion}}(f)$$"}</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="quality" className="space-y-6">
            <div className="prose max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold">Strehl Ratio</h3>
              <p className="text-muted-foreground mb-2">Ratio of peak intensity to diffraction-limited peak.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{"$$S = \\frac{I_{\\text{peak}}}{I_{\\text{diff-limited}}} \\approx \\exp\\left(-\\left(\\frac{\\sigma_{\\text{wave}}}{\\lambda}\\right)^2\\right)$$"}</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Encircled Energy</h3>
              <p className="text-muted-foreground mb-2">Fraction of total energy within a given radius.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{"$$\\text{EE}(r) = \\int_0^r \\int_0^{2\\pi} \\text{PSF}(\\rho, \\theta) \\rho \\, d\\rho \\, d\\theta$$"}</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Nyquist Frequency</h3>
              <p className="text-muted-foreground mb-2">Maximum spatial frequency that can be sampled without aliasing.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{"$$f_{\\text{Nyquist}} = \\frac{1}{2p}$$"}</p>
                <p>{"$$\\text{where } p \\text{ is the pixel pitch}$$"}</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-6">Sampling Efficiency</h3>
              <p className="text-muted-foreground mb-2">Ratio of MTF50 to Nyquist frequency.</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{"$$\\eta_{\\text{sampling}} = \\frac{\\text{MTF50}}{f_{\\text{Nyquist}}}$$"}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Variable definitions */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <h3 className="text-md font-medium mb-2 text-primary">Variable Definitions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex gap-2">
              <span className="font-bold">{"$\\lambda$:"}</span>
              <span className="text-muted-foreground">Wavelength (μm)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">{"$D$:"}</span>
              <span className="text-muted-foreground">Aperture diameter (mm)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">{"$f$:"}</span>
              <span className="text-muted-foreground">Focal length (mm)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">{"$p$:"}</span>
              <span className="text-muted-foreground">Pixel size (μm)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">{"$v$:"}</span>
              <span className="text-muted-foreground">Platform velocity (m/s)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">{"$t_{\\text{int}}$:"}</span>
              <span className="text-muted-foreground">Integration time (s)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">{"$f_c$:"}</span>
              <span className="text-muted-foreground">Cutoff frequency (cycles/mm)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">{"$\\text{MTF50}$:"}</span>
              <span className="text-muted-foreground">Frequency at 50% MTF (cycles/mm)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modeling;