export interface PSFInputs {
  pixelSize: number; // micrometers
  aperture: number; // millimeters
  focalLength: number; // millimeters
  wavelength: number; // nanometers
  atmosphericCondition: 'clear' | 'hazy' | 'cloudy';
  offNadirAngle: number; // degrees
  defocusAmount: number; // micrometers
  aberrationCoefficients?: AberrationData;
}

export interface MTFInputs extends PSFInputs {
  spatialFrequencyRange: [number, number]; // cycles/mm
  detectorQE: number; // quantum efficiency (0-1)
  electronicNoise: number; // electrons RMS
  platformVelocity: number; // m/s
  integrationTime: number; // seconds
}

export interface AberrationData {
  spherical: number;
  coma: number;
  astigmatism: number;
  fieldCurvature: number;
  distortion: number;
}

export interface PSFResults {
  airyDiskDiameter: number; // micrometers
  psfFWHM: number; // micrometers
  encircledEnergy: EncircledEnergyData;
  strehlRatio: number; // 0-1
  rmsSpotSize: number; // micrometers
  psfData: number[][]; // 2D array for visualization
  psfProfile: number[]; // radial profile
  wavelengthRange: number[]; // for multi-spectral analysis
}

export interface MTFResults {
  mtfCurve: MTFCurveData;
  mtf50: number; // cycles/mm
  nyquistFrequency: number; // cycles/mm
  samplingEfficiency: number; // 0-1
  overallMTF: number[]; // combined system MTF
  opticsMTF: number[]; // optics-only MTF
  detectorMTF: number[]; // detector-only MTF
  motionMTF: number[]; // motion blur MTF
  frequencies: number[]; // spatial frequencies
}

export interface EncircledEnergyData {
  radii: number[]; // micrometers
  energy: number[]; // cumulative energy percentage
  ee50: number; // radius containing 50% energy
  ee80: number; // radius containing 80% energy
  ee95: number; // radius containing 95% energy
}

export interface MTFCurveData {
  frequencies: number[]; // cycles/mm
  mtfValues: number[]; // MTF values (0-1)
  sagittal: number[]; // sagittal MTF
  tangential: number[]; // tangential MTF
}

export interface ModelingPreset {
  name: string;
  description: string;
  category: 'earth-observation' | 'surveillance' | 'astronomy' | 'commercial';
  psfInputs: Partial<PSFInputs>;
  mtfInputs: Partial<MTFInputs>;
}

export interface OpticalQualityMetrics {
  imageQuality: 'excellent' | 'good' | 'acceptable' | 'poor';
  limitingFactor: 'diffraction' | 'aberrations' | 'defocus' | 'atmosphere' | 'detector' | 'motion';
  recommendations: string[];
  performanceScore: number; // 0-100
}

export interface SensitivityAnalysis {
  parameter: keyof (PSFInputs | MTFInputs);
  impact: number; // relative sensitivity
  optimumRange: [number, number];
  currentValue: number;
}

export interface ModelingExportData {
  timestamp: string;
  inputs: PSFInputs | MTFInputs;
  results: PSFResults | MTFResults;
  charts: {
    psfHeatmap?: string; // base64 image
    mtfCurve?: string; // base64 image
    encircledEnergy?: string; // base64 image
  };
  summary: string;
}