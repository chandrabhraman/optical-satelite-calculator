import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { PSFInputs, PSFResults } from "@/utils/modelingTypes";
import { Badge } from "@/components/ui/badge";
import { Eye, Target, Zap, Activity } from "lucide-react";

interface PSFVisualizationProps {
  inputs: PSFInputs;
  results: PSFResults | null;
  compact?: boolean;
}

const PSFVisualization: React.FC<PSFVisualizationProps> = ({ inputs, results, compact = false }) => {
  if (!results) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Configure parameters to see PSF analysis</p>
        </div>
      </div>
    );
  }

  // Generate PSF heatmap data for visualization
  const generateHeatmapData = () => {
    const size = compact ? 32 : 48;
    const extent = results.psfFWHM * 3;
    const step = extent / size;
    const center = size / 2;
    const sigma = results.psfFWHM / (2 * Math.sqrt(2 * Math.log(2)));

    const data = [];
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = (j - center) * step;
        const y = (i - center) * step;
        const r = Math.sqrt(x * x + y * y);
        const intensity = Math.exp(-(r * r) / (2 * sigma * sigma));
        
        data.push({
          x: j,
          y: i,
          intensity: intensity,
          radius: r
        });
      }
    }
    return data;
  };

  // Generate radial profile data
  const generateProfileData = () => {
    const points = 50;
    const maxRadius = results.psfFWHM * 2.5;
    const step = maxRadius / points;
    const sigma = results.psfFWHM / (2 * Math.sqrt(2 * Math.log(2)));

    return Array.from({ length: points }, (_, i) => {
      const r = i * step;
      const intensity = Math.exp(-(r * r) / (2 * sigma * sigma));
      return {
        radius: r,
        intensity: intensity,
        fwhm: r === results.psfFWHM / 2 ? 0.5 : null
      };
    });
  };

  const profileData = generateProfileData();
  const encircledEnergyData = results.encircledEnergy.radii.map((r, i) => ({
    radius: r,
    energy: results.encircledEnergy.energy[i]
  }));

  if (compact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            PSF Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">FWHM:</span>
                <span>{results.psfFWHM.toFixed(2)} μm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Strehl:</span>
                <span>{(results.strehlRatio * 100).toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profileData}>
                  <XAxis dataKey="radius" hide />
                  <YAxis hide />
                  <Line 
                    type="monotone" 
                    dataKey="intensity" 
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
                <p className="text-xs text-muted-foreground">FWHM</p>
                <p className="text-sm font-semibold">{results.psfFWHM.toFixed(2)} μm</p>
              </div>
              <Target className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Strehl Ratio</p>
                <p className="text-sm font-semibold">{(results.strehlRatio * 100).toFixed(1)}%</p>
              </div>
              <Activity className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Airy Disk</p>
                <p className="text-sm font-semibold">{results.airyDiskDiameter.toFixed(2)} μm</p>
              </div>
              <Eye className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">RMS Size</p>
                <p className="text-sm font-semibold">{results.rmsSpotSize.toFixed(2)} μm</p>
              </div>
              <Zap className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations */}
      <div className="flex-1">
        <Tabs defaultValue="profile" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Radial Profile</TabsTrigger>
            <TabsTrigger value="encircled">Encircled Energy</TabsTrigger>
            <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">PSF Radial Profile</CardTitle>
                <CardDescription>
                  Intensity distribution vs. radius from PSF center
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={profileData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="radius" 
                      label={{ value: 'Radius (μm)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Normalized Intensity', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        typeof value === 'number' ? value.toFixed(3) : value,
                        name === 'intensity' ? 'Intensity' : name
                      ]}
                      labelFormatter={(label) => `Radius: ${Number(label).toFixed(2)} μm`}
                    />
                    <Area
                      type="monotone"
                      dataKey="intensity"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary/50 border border-primary rounded"></div>
                    <span>FWHM: {results.psfFWHM.toFixed(2)} μm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500/50 border border-green-500 rounded"></div>
                    <span>Diffraction limit reference</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="encircled" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Encircled Energy Analysis</CardTitle>
                <CardDescription>
                  Cumulative energy containment vs. radius
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={encircledEnergyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="radius" 
                      label={{ value: 'Radius (μm)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Encircled Energy (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Energy']}
                      labelFormatter={(label) => `Radius: ${Number(label).toFixed(2)} μm`}
                    />
                    <Line
                      type="monotone"
                      dataKey="energy"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground">50% Energy</p>
                    <p className="font-semibold">{results.encircledEnergy.ee50.toFixed(2)} μm</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground">80% Energy</p>
                    <p className="font-semibold">{results.encircledEnergy.ee80.toFixed(2)} μm</p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground">95% Energy</p>
                    <p className="font-semibold">{results.encircledEnergy.ee95.toFixed(2)} μm</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Optical Quality Assessment</CardTitle>
                <CardDescription>
                  Performance metrics and limiting factors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Image Quality</Label>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={results.strehlRatio > 0.8 ? "default" : 
                                results.strehlRatio > 0.6 ? "secondary" : 
                                results.strehlRatio > 0.3 ? "outline" : "destructive"}
                      >
                        {results.strehlRatio > 0.8 ? "Excellent" :
                         results.strehlRatio > 0.6 ? "Good" :
                         results.strehlRatio > 0.3 ? "Acceptable" : "Poor"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        (Strehl: {(results.strehlRatio * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Limiting Factor</Label>
                    <Badge variant="outline">
                      {inputs.defocusAmount > 5 ? "Defocus" :
                       inputs.atmosphericCondition !== 'clear' ? "Atmosphere" :
                       "Diffraction"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Performance Recommendations</Label>
                  <div className="space-y-1">
                    {results.strehlRatio < 0.8 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        • Consider reducing optical aberrations or improving focus
                      </p>
                    )}
                    {inputs.defocusAmount > 2 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        • Improve focus accuracy - current defocus significantly impacts performance
                      </p>
                    )}
                    {inputs.atmosphericCondition !== 'clear' && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        • Consider atmospheric correction or wait for better conditions
                      </p>
                    )}
                    {results.strehlRatio > 0.8 && inputs.defocusAmount < 1 && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        • Excellent optical performance - system is well optimized
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium">System Parameters</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">F-number:</span>
                      <span>{(inputs.focalLength / inputs.aperture).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wavelength:</span>
                      <span>{inputs.wavelength} nm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Off-nadir:</span>
                      <span>{inputs.offNadirAngle}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Defocus:</span>
                      <span>{inputs.defocusAmount} μm</span>
                    </div>
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

export default PSFVisualization;