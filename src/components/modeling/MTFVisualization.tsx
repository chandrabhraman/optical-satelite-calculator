import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { MTFInputs, MTFResults } from "@/utils/modelingTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, BarChart3, Zap, Target, Camera } from "lucide-react";
import { toast } from "sonner";

interface MTFVisualizationProps {
  inputs: MTFInputs;
  results: MTFResults | null;
  compact?: boolean;
}

const MTFVisualization: React.FC<MTFVisualizationProps> = ({ inputs, results, compact = false }) => {
  if (!results) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Configure parameters to see MTF analysis</p>
        </div>
      </div>
    );
  }

  // Generate combined MTF data for visualization
  const generateMTFData = () => {
    return results.frequencies.map((freq, i) => ({
      frequency: freq,
      overall: results.overallMTF[i],
      optics: results.opticsMTF[i],
      detector: results.detectorMTF[i],
      motion: results.motionMTF[i],
      nyquist: freq === results.nyquistFrequency ? 1 : null
    }));
  };

  // Generate MTF breakdown data
  const generateBreakdownData = () => {
    const categories = ['Optics', 'Detector', 'Motion', 'Overall'];
    const mtfAt50 = results.frequencies.findIndex(f => f >= 50);
    const mtfAtNyquist = results.frequencies.findIndex(f => f >= results.nyquistFrequency);
    
    return categories.map(category => ({
      category,
      mtf50: category === 'Optics' ? results.opticsMTF[mtfAt50] || 0 :
             category === 'Detector' ? results.detectorMTF[mtfAt50] || 0 :
             category === 'Motion' ? results.motionMTF[mtfAt50] || 0 :
             results.overallMTF[mtfAt50] || 0,
      mtfNyquist: category === 'Optics' ? results.opticsMTF[mtfAtNyquist] || 0 :
                  category === 'Detector' ? results.detectorMTF[mtfAtNyquist] || 0 :
                  category === 'Motion' ? results.motionMTF[mtfAtNyquist] || 0 :
                  results.overallMTF[mtfAtNyquist] || 0
    }));
  };

  const mtfData = generateMTFData();
  const breakdownData = generateBreakdownData();

  const handleSnapshot = async (containerId: string, filename: string) => {
    const container = document.getElementById(containerId);
    if (!container) {
      toast.error("Unable to find visualization container.");
      return;
    }

    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = filename;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success("Snapshot saved successfully!");
        } else {
          toast.error("Failed to create snapshot blob.");
        }
      }, 'image/png', 1.0);
      
    } catch (error) {
      console.error("Error capturing snapshot:", error);
      toast.error("Failed to capture snapshot. Please try again.");
    }
  };

  if (compact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            MTF Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">MTF50:</span>
                <span>{results.mtf50.toFixed(1)} cycles/mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nyquist:</span>
                <span>{results.nyquistFrequency.toFixed(1)} cycles/mm</span>
              </div>
            </div>
            
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mtfData}>
                  <XAxis dataKey="frequency" hide />
                  <YAxis hide />
                  <Line 
                    type="monotone" 
                    dataKey="overall" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">MTF50</p>
                <p className="text-sm font-semibold">{results.mtf50.toFixed(1)} cycles/mm</p>
              </div>
              <Target className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Nyquist</p>
                <p className="text-sm font-semibold">{results.nyquistFrequency.toFixed(1)} cycles/mm</p>
              </div>
              <Activity className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sampling Eff.</p>
                <p className="text-sm font-semibold">{(results.samplingEfficiency * 100).toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">MTF @ Nyquist</p>
                <p className="text-sm font-semibold">
                  {(results.overallMTF[results.frequencies.findIndex(f => f >= results.nyquistFrequency)] || 0 * 100).toFixed(1)}%
                </p>
              </div>
              <Zap className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations */}
      <div className="flex-1">
        <Tabs defaultValue="curves" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="curves">MTF Curves</TabsTrigger>
            <TabsTrigger value="breakdown">Component Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="curves" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  MTF Response Curves
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleSnapshot('mtf-curves-chart', `mtf-response-curves-${new Date().toISOString().split('T')[0]}.png`)}
                    className="gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Snapshot
                  </Button>
                </CardTitle>
                <CardDescription>
                  Modulation Transfer Function vs. spatial frequency
                </CardDescription>
              </CardHeader>
               <CardContent className="p-4">
                 <div id="mtf-curves-chart" className="w-full">
                   <div className="w-full h-80 overflow-hidden">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={mtfData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                         <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                         <XAxis 
                           dataKey="frequency" 
                           tickFormatter={(value) => Number(value).toFixed(2)}
                           label={{ value: 'Spatial Frequency (cycles/mm)', position: 'insideBottom', offset: -5 }}
                         />
                         <YAxis 
                           domain={[0, 1]}
                           label={{ value: 'MTF', angle: -90, position: 'insideLeft' }}
                         />
                         <Tooltip 
                           formatter={(value, name) => [
                             `${(Number(value) * 100).toFixed(1)}%`,
                             name === 'overall' ? 'Overall MTF' :
                             name === 'optics' ? 'Optics MTF' :
                             name === 'detector' ? 'Detector MTF' :
                             name === 'motion' ? 'Motion MTF' : name
                           ]}
                           labelFormatter={(label) => `Frequency: ${Number(label).toFixed(2)} cycles/mm`}
                         />
                         <Line
                           type="monotone"
                           dataKey="overall"
                           stroke="hsl(var(--primary))"
                           strokeWidth={3}
                           dot={false}
                           name="Overall"
                         />
                         <Line
                           type="monotone"
                           dataKey="optics"
                           stroke="hsl(var(--chart-1))"
                           strokeWidth={2}
                           strokeDasharray="5 5"
                           dot={false}
                           name="Optics"
                         />
                         <Line
                           type="monotone"
                           dataKey="detector"
                           stroke="hsl(var(--chart-2))"
                           strokeWidth={2}
                           strokeDasharray="3 3"
                           dot={false}
                           name="Detector"
                         />
                         <Line
                           type="monotone"
                           dataKey="motion"
                           stroke="hsl(var(--chart-3))"
                           strokeWidth={2}
                           strokeDasharray="1 1"
                           dot={false}
                           name="Motion"
                         />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>

                   <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-0.5 bg-primary"></div>
                       <span>Overall MTF</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-0.5 bg-chart-1 border-dashed border-t"></div>
                       <span>Optics</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-0.5 bg-chart-2 border-dashed border-t"></div>
                       <span>Detector</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-0.5 bg-chart-3 border-dotted border-t"></div>
                       <span>Motion</span>
                     </div>
                   </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Component MTF Analysis
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleSnapshot('mtf-breakdown-chart', `mtf-component-analysis-${new Date().toISOString().split('T')[0]}.png`)}
                    className="gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Snapshot
                  </Button>
                </CardTitle>
                <CardDescription>
                  Individual contribution of each system component
                </CardDescription>
              </CardHeader>
               <CardContent className="p-4">
                 <div id="mtf-breakdown-chart" className="w-full">
                   <div className="w-full h-80 overflow-hidden">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={breakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                         <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                         <XAxis dataKey="category" />
                         <YAxis 
                           domain={[0, 1]}
                           label={{ value: 'MTF', angle: -90, position: 'insideLeft' }}
                         />
                         <Tooltip 
                           formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'MTF']}
                         />
                         <Bar 
                           dataKey="mtf50" 
                           fill="hsl(var(--chart-1))" 
                           name="@ 50 cycles/mm"
                           opacity={0.8}
                         />
                         <Bar 
                           dataKey="mtfNyquist" 
                           fill="hsl(var(--chart-2))" 
                           name="@ Nyquist"
                           opacity={0.8}
                         />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>

                   <div className="mt-4 space-y-3">
                     <div className="grid grid-cols-2 gap-2 text-xs">
                       <div className="flex items-center gap-2">
                         <div className="w-3 h-3 bg-chart-1/80 rounded"></div>
                         <span>MTF @ 50 cycles/mm</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-3 h-3 bg-chart-2/80 rounded"></div>
                         <span>MTF @ Nyquist freq.</span>
                       </div>
                     </div>

                     <div className="p-3 bg-muted/30 rounded text-xs space-y-1">
                       <p className="font-medium">Component Analysis:</p>
                       <p>• <strong>Optics:</strong> Limited by diffraction, aberrations, and atmospheric effects</p>
                       <p>• <strong>Detector:</strong> Affected by pixel size and quantum efficiency</p>
                       <p>• <strong>Motion:</strong> Degraded by platform velocity and integration time</p>
                       <p>• <strong>Overall:</strong> Product of all individual MTF components</p>
                     </div>
                   </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">System Performance Assessment</CardTitle>
                <CardDescription>
                  Overall system quality and optimization recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Image Quality</Label>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={results.mtf50 > 80 ? "default" : 
                                results.mtf50 > 50 ? "secondary" : 
                                results.mtf50 > 25 ? "outline" : "destructive"}
                      >
                        {results.mtf50 > 80 ? "Excellent" :
                         results.mtf50 > 50 ? "Good" :
                         results.mtf50 > 25 ? "Acceptable" : "Poor"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        (MTF50: {results.mtf50.toFixed(1)} cycles/mm)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sampling Quality</Label>
                    <Badge 
                      variant={results.samplingEfficiency > 0.7 ? "default" : 
                              results.samplingEfficiency > 0.4 ? "secondary" : "outline"}
                    >
                      {results.samplingEfficiency > 0.7 ? "Well Sampled" :
                       results.samplingEfficiency > 0.4 ? "Adequately Sampled" : "Undersampled"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Optimization Recommendations</Label>
                  <div className="space-y-1">
                    {results.mtf50 < 50 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        • Consider reducing pixel size or improving optical design
                      </p>
                    )}
                    {results.samplingEfficiency < 0.5 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        • System is undersampled - reduce pixel size or improve optics
                      </p>
                    )}
                    {inputs.integrationTime > 0.002 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        • Reduce integration time to minimize motion blur
                      </p>
                    )}
                    {inputs.detectorQE < 0.7 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        • Consider upgrading to a detector with higher quantum efficiency
                      </p>
                    )}
                    {results.mtf50 > 80 && results.samplingEfficiency > 0.7 && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        • Excellent system performance - well optimized for current mission
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium">System Summary</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pixel Size:</span>
                      <span>{inputs.pixelSize} μm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">F-number:</span>
                      <span>{(inputs.focalLength / inputs.aperture).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Integration:</span>
                      <span>{(inputs.integrationTime * 1000).toFixed(2)} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform Speed:</span>
                      <span>{(inputs.platformVelocity / 1000).toFixed(1)} km/s</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Performance Score:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div 
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (results.mtf50 / 100) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-blue-800 dark:text-blue-200 font-medium">
                      {Math.round((results.mtf50 / 100) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Label: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <label className={className}>{children}</label>
);

export default MTFVisualization;