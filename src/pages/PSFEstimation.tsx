import React, { useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { estimatePSF, deconvolveImage, PSFType, DeconvolutionMethod } from '@/utils/psfImageProcessing';

const PSFEstimation: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [deconvolvedImage, setDeconvolvedImage] = useState<string>('');
  const [psfVisualization, setPsfVisualization] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  
  // PSF parameters
  const [psfType, setPsfType] = useState<PSFType>('motion');
  const [motionLength, setMotionLength] = useState(15);
  const [motionAngle, setMotionAngle] = useState(0);
  const [kernelSize, setKernelSize] = useState(15);
  const [iterations, setIterations] = useState(10);
  
  // Deconvolution parameters
  const [deconvMethod, setDeconvMethod] = useState<DeconvolutionMethod>('richardsonLucy');
  const [regularization, setRegularization] = useState(0.01);
  const [noiseVariance, setNoiseVariance] = useState(0.001);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setOriginalImageUrl(e.target?.result as string);
        toast.success('Image uploaded successfully');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!originalImage) {
      toast.error('Please upload an image first');
      return;
    }

    setProcessing(true);
    toast.info('Processing image...');

    try {
      // Estimate PSF
      const psf = estimatePSF(psfType, {
        length: motionLength,
        angle: motionAngle,
        size: kernelSize
      });

      // Visualize PSF
      const psfCanvas = document.createElement('canvas');
      psfCanvas.width = kernelSize;
      psfCanvas.height = kernelSize;
      const psfCtx = psfCanvas.getContext('2d');
      if (psfCtx) {
        const imageData = psfCtx.createImageData(kernelSize, kernelSize);
        for (let i = 0; i < psf.length; i++) {
          for (let j = 0; j < psf[i].length; j++) {
            const idx = (i * kernelSize + j) * 4;
            const val = Math.min(255, Math.max(0, psf[i][j] * 255));
            imageData.data[idx] = val;
            imageData.data[idx + 1] = val;
            imageData.data[idx + 2] = val;
            imageData.data[idx + 3] = 255;
          }
        }
        psfCtx.putImageData(imageData, 0, 0);
        setPsfVisualization(psfCanvas.toDataURL());
      }

      // Deconvolve image
      const deconvolved = await deconvolveImage(
        originalImage, 
        psf, 
        iterations,
        deconvMethod,
        regularization,
        noiseVariance
      );
      setDeconvolvedImage(deconvolved);
      
      toast.success('Image processed successfully');
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process image');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.click();
  };

  return (
    <>
      <SEOHead 
        title="PSF Estimation & Deconvolution"
        description="Upload blurred images and perform Point Spread Function estimation and deconvolution to restore image quality"
        keywords={['PSF', 'deconvolution', 'image restoration', 'deblurring', 'point spread function']}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              PSF Estimation & Image Deconvolution
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload a blurred image, configure PSF parameters, and restore image quality through deconvolution
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload & Parameters */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Image Upload & PSF Configuration</CardTitle>
                <CardDescription>Configure deconvolution parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-3">
                  <Label>Upload Image</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click or drag to upload
                      </p>
                    </label>
                  </div>
                </div>

                {/* PSF Type */}
                <div className="space-y-3">
                  <Label>PSF Type</Label>
                  <Select value={psfType} onValueChange={(v: string) => setPsfType(v as PSFType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motion">Motion Blur</SelectItem>
                      <SelectItem value="gaussian">Gaussian</SelectItem>
                      <SelectItem value="defocus">Defocus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Motion Parameters */}
                {psfType === 'motion' && (
                  <>
                    <div className="space-y-3">
                      <Label>Motion Length: {motionLength}px</Label>
                      <Slider
                        value={[motionLength]}
                        onValueChange={(v) => setMotionLength(v[0])}
                        min={5}
                        max={50}
                        step={1}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Motion Angle: {motionAngle}°</Label>
                      <Slider
                        value={[motionAngle]}
                        onValueChange={(v) => setMotionAngle(v[0])}
                        min={0}
                        max={360}
                        step={1}
                      />
                    </div>
                  </>
                )}

                {/* Kernel Size */}
                <div className="space-y-3">
                  <Label>Kernel Size: {kernelSize}px</Label>
                  <Slider
                    value={[kernelSize]}
                    onValueChange={(v) => setKernelSize(v[0])}
                    min={5}
                    max={31}
                    step={2}
                  />
                </div>

                {/* Deconvolution Method */}
                <div className="space-y-3">
                  <Label>Deconvolution Method</Label>
                  <Select value={deconvMethod} onValueChange={(v: string) => setDeconvMethod(v as DeconvolutionMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="richardsonLucy">Richardson-Lucy</SelectItem>
                      <SelectItem value="richardsonLucyTV">Richardson-Lucy + TV</SelectItem>
                      <SelectItem value="wiener">Wiener Filter</SelectItem>
                      <SelectItem value="blindDeconvolution">Blind Deconvolution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Iterations */}
                <div className="space-y-3">
                  <Label>Iterations: {iterations}</Label>
                  <Slider
                    value={[iterations]}
                    onValueChange={(v) => setIterations(v[0])}
                    min={1}
                    max={50}
                    step={1}
                  />
                </div>

                {/* Regularization (for TV and Wiener) */}
                {(deconvMethod === 'richardsonLucyTV' || deconvMethod === 'wiener') && (
                  <div className="space-y-3">
                    <Label>
                      {deconvMethod === 'wiener' ? 'Noise Variance' : 'Regularization'}: {
                        deconvMethod === 'wiener' ? noiseVariance.toFixed(4) : regularization.toFixed(3)
                      }
                    </Label>
                    <Slider
                      value={deconvMethod === 'wiener' ? [noiseVariance * 1000] : [regularization * 100]}
                      onValueChange={(v) => {
                        if (deconvMethod === 'wiener') {
                          setNoiseVariance(v[0] / 1000);
                        } else {
                          setRegularization(v[0] / 100);
                        }
                      }}
                      min={1}
                      max={deconvMethod === 'wiener' ? 100 : 10}
                      step={1}
                    />
                  </div>
                )}

                <Button
                  className="w-full" 
                  onClick={handleProcess}
                  disabled={!originalImage || processing}
                >
                  {processing ? 'Processing...' : 'Process Image'}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>View original, PSF, and deconvolved images</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="comparison" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="comparison">Comparison</TabsTrigger>
                    <TabsTrigger value="original">Original</TabsTrigger>
                    <TabsTrigger value="psf">PSF Kernel</TabsTrigger>
                  </TabsList>

                  <TabsContent value="comparison" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Original Image</Label>
                          {originalImageUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(originalImageUrl, 'original.png')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="border rounded-lg overflow-hidden bg-muted/20 aspect-square flex items-center justify-center">
                          {originalImageUrl ? (
                            <img src={originalImageUrl} alt="Original" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-16 h-16 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Deconvolved Image</Label>
                          {deconvolvedImage && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(deconvolvedImage, 'deconvolved.png')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="border rounded-lg overflow-hidden bg-muted/20 aspect-square flex items-center justify-center">
                          {deconvolvedImage ? (
                            <img src={deconvolvedImage} alt="Deconvolved" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-16 h-16 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="original" className="mt-4">
                    <div className="border rounded-lg overflow-hidden bg-muted/20 aspect-video flex items-center justify-center">
                      {originalImageUrl ? (
                        <img src={originalImageUrl} alt="Original" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <ImageIcon className="w-16 h-16 text-muted-foreground" />
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="psf" className="mt-4">
                    <div className="border rounded-lg overflow-hidden bg-muted/20 p-8 flex items-center justify-center">
                      {psfVisualization ? (
                        <img 
                          src={psfVisualization} 
                          alt="PSF Kernel" 
                          className="w-64 h-64 object-contain" 
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ) : (
                        <ImageIcon className="w-16 h-16 text-muted-foreground" />
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default PSFEstimation;
