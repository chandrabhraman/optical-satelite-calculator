import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PSFResults, MTFResults } from "@/utils/modelingTypes";
import { Download, Share2, Eye, BarChart3 } from "lucide-react";

interface ModelingResultsProps {
  psfResults: PSFResults | null;
  mtfResults: MTFResults | null;
  activeAnalysis: string;
}

const ModelingResults: React.FC<ModelingResultsProps> = ({
  psfResults,
  mtfResults,
  activeAnalysis,
}) => {
  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      analysis: activeAnalysis,
      psf: psfResults,
      mtf: mtfResults,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `optical-modeling-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Optical Modeling Results',
        text: `PSF and MTF analysis results - ${activeAnalysis}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).catch(console.error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {activeAnalysis === 'psf' ? (
            <Eye className="w-4 h-4 text-primary" />
          ) : (
            <BarChart3 className="w-4 h-4 text-primary" />
          )}
          Results Summary
        </CardTitle>
        <CardDescription className="text-xs">
          Key performance metrics and quality assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PSF Results */}
        {psfResults && activeAnalysis === 'psf' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Image Quality</span>
              <Badge 
                variant={psfResults.strehlRatio > 0.8 ? "default" : 
                        psfResults.strehlRatio > 0.6 ? "secondary" : 
                        psfResults.strehlRatio > 0.3 ? "outline" : "destructive"}
                className="text-xs"
              >
                {psfResults.strehlRatio > 0.8 ? "Excellent" :
                 psfResults.strehlRatio > 0.6 ? "Good" :
                 psfResults.strehlRatio > 0.3 ? "Acceptable" : "Poor"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PSF FWHM:</span>
                <span className="font-medium">{psfResults.psfFWHM.toFixed(2)} μm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Strehl Ratio:</span>
                <span className="font-medium">{(psfResults.strehlRatio * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">RMS Spot:</span>
                <span className="font-medium">{psfResults.rmsSpotSize.toFixed(2)} μm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Airy Disk:</span>
                <span className="font-medium">{psfResults.airyDiskDiameter.toFixed(2)} μm</span>
              </div>
            </div>

            <div className="p-2 bg-muted/30 rounded text-xs">
              <div className="font-medium mb-1">Encircled Energy:</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-muted-foreground">50%</div>
                  <div className="font-medium">{psfResults.encircledEnergy.ee50.toFixed(1)} μm</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">80%</div>
                  <div className="font-medium">{psfResults.encircledEnergy.ee80.toFixed(1)} μm</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">95%</div>
                  <div className="font-medium">{psfResults.encircledEnergy.ee95.toFixed(1)} μm</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MTF Results */}
        {mtfResults && activeAnalysis === 'mtf' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">System Performance</span>
              <Badge 
                variant={mtfResults.mtf50 > 80 ? "default" : 
                        mtfResults.mtf50 > 50 ? "secondary" : 
                        mtfResults.mtf50 > 25 ? "outline" : "destructive"}
                className="text-xs"
              >
                {mtfResults.mtf50 > 80 ? "Excellent" :
                 mtfResults.mtf50 > 50 ? "Good" :
                 mtfResults.mtf50 > 25 ? "Acceptable" : "Poor"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">MTF50:</span>
                <span className="font-medium">{mtfResults.mtf50.toFixed(1)} cycles/mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nyquist:</span>
                <span className="font-medium">{mtfResults.nyquistFrequency.toFixed(1)} cycles/mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sampling Eff.:</span>
                <span className="font-medium">{(mtfResults.samplingEfficiency * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MTF @ Nyquist:</span>
                <span className="font-medium">
                  {(mtfResults.overallMTF[mtfResults.frequencies.findIndex(f => f >= mtfResults.nyquistFrequency)] * 100 || 0).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="p-2 bg-muted/30 rounded text-xs">
              <div className="font-medium mb-1">Component Performance:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Optics MTF:</span>
                  <span>{(mtfResults.opticsMTF[Math.floor(mtfResults.frequencies.length / 4)] * 100 || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Detector MTF:</span>
                  <span>{(mtfResults.detectorMTF[Math.floor(mtfResults.frequencies.length / 4)] * 100 || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Motion MTF:</span>
                  <span>{(mtfResults.motionMTF[Math.floor(mtfResults.frequencies.length / 4)] * 100 || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Combined Results */}
        {psfResults && mtfResults && activeAnalysis === 'combined' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                <div className="text-muted-foreground">PSF Quality</div>
                <div className="font-semibold">{(psfResults.strehlRatio * 100).toFixed(1)}%</div>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
                <div className="text-muted-foreground">MTF Quality</div>
                <div className="font-semibold">{mtfResults.mtf50.toFixed(1)} cycles/mm</div>
              </div>
            </div>

            <div className="p-2 bg-muted/30 rounded text-xs">
              <div className="font-medium mb-1">System Summary:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PSF FWHM:</span>
                  <span>{psfResults.psfFWHM.toFixed(2)} μm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MTF50:</span>
                  <span>{mtfResults.mtf50.toFixed(1)} cycles/mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overall Quality:</span>
                  <Badge variant="outline" className="text-xs">
                    {(psfResults.strehlRatio > 0.7 && mtfResults.mtf50 > 50) ? "Excellent" :
                     (psfResults.strehlRatio > 0.5 && mtfResults.mtf50 > 30) ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportResults}
            className="flex-1 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={shareResults}
            className="flex-1 text-xs"
          >
            <Share2 className="w-3 h-3 mr-1" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelingResults;