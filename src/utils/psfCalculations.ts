import { PSFInputs, PSFResults, EncircledEnergyData, OpticalQualityMetrics } from './modelingTypes';

// Physical constants
const SPEED_OF_LIGHT = 299792458; // m/s
const PI = Math.PI;

export const calculatePSF = (inputs: PSFInputs): PSFResults => {
  const {
    pixelSize,
    aperture,
    focalLength,
    wavelength,
    atmosphericCondition,
    offNadirAngle,
    defocusAmount
  } = inputs;

  // Convert units
  const pixelSizeM = pixelSize * 1e-6; // to meters
  const apertureM = aperture * 1e-3; // to meters
  const focalLengthM = focalLength * 1e-3; // to meters
  const wavelengthM = wavelength * 1e-9; // to meters
  const defocusM = defocusAmount * 1e-6; // to meters

  // Calculate Airy disk diameter (first zero)
  const airyDiskDiameter = (2.44 * wavelengthM * focalLengthM / apertureM) * 1e6; // in micrometers

  // Calculate diffraction-limited FWHM
  const diffractionFWHM = (1.22 * wavelengthM * focalLengthM / apertureM) * 1e6; // in micrometers

  // Atmospheric seeing effects
  const atmosphericFWHM = getAtmosphericSeeing(atmosphericCondition, offNadirAngle);

  // Defocus contribution
  const defocusFWHM = Math.abs(defocusAmount) * 0.5; // simplified model

  // Combined FWHM (quadrature sum for independent sources)
  const psfFWHM = Math.sqrt(
    diffractionFWHM ** 2 + 
    atmosphericFWHM ** 2 + 
    defocusFWHM ** 2
  );

  // Calculate Strehl ratio (simplified)
  const wavefrontError = calculateWavefrontError(inputs);
  const strehlRatio = Math.exp(-((2 * PI * wavefrontError / wavelengthM) ** 2));

  // RMS spot size
  const rmsSpotSize = psfFWHM / (2 * Math.sqrt(2 * Math.log(2))); // Convert FWHM to RMS

  // Generate PSF data for visualization
  const psfData = generatePSFData(inputs, psfFWHM);
  const psfProfile = generatePSFProfile(inputs, psfFWHM);

  // Calculate encircled energy
  const encircledEnergy = calculateEncircledEnergy(psfFWHM, rmsSpotSize);

  return {
    airyDiskDiameter,
    psfFWHM,
    encircledEnergy,
    strehlRatio,
    rmsSpotSize,
    psfData,
    psfProfile,
    wavelengthRange: [wavelength - 50, wavelength + 50] // ±50nm around central wavelength
  };
};

const getAtmosphericSeeing = (condition: string, offNadirAngle: number): number => {
  // Base seeing in micrometers (at focal plane)
  const baseSeeing = {
    clear: 15,
    hazy: 25,
    cloudy: 40
  };

  const seeing = baseSeeing[condition as keyof typeof baseSeeing] || baseSeeing.clear;
  
  // Increase with off-nadir angle (airmass effect)
  const airmass = 1 / Math.cos(offNadirAngle * PI / 180);
  return seeing * Math.pow(airmass, 0.6);
};

const calculateWavefrontError = (inputs: PSFInputs): number => {
  // Simplified wavefront error calculation
  const { defocusAmount, offNadirAngle } = inputs;
  
  // Defocus contribution
  const defocusError = Math.abs(defocusAmount) * 1e-6 / 4; // quarter wave for significant degradation
  
  // Off-axis aberrations (simplified)
  const offAxisError = (offNadirAngle * PI / 180) ** 2 * 100e-9; // quadratic with angle
  
  return Math.sqrt(defocusError ** 2 + offAxisError ** 2);
};

const generatePSFData = (inputs: PSFInputs, fwhm: number): number[][] => {
  const size = 64; // 64x64 grid
  const extent = fwhm * 4; // 4 FWHM extent
  const step = extent / size;
  
  const data: number[][] = [];
  const center = size / 2;
  const sigma = fwhm / (2 * Math.sqrt(2 * Math.log(2))); // Convert FWHM to sigma
  
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      const x = (j - center) * step;
      const y = (i - center) * step;
      const r = Math.sqrt(x * x + y * y);
      
      // Gaussian approximation of PSF
      const intensity = Math.exp(-(r * r) / (2 * sigma * sigma));
      row.push(intensity);
    }
    data.push(row);
  }
  
  return data;
};

const generatePSFProfile = (inputs: PSFInputs, fwhm: number): number[] => {
  const points = 100;
  const maxRadius = fwhm * 3;
  const step = maxRadius / points;
  
  const profile: number[] = [];
  const sigma = fwhm / (2 * Math.sqrt(2 * Math.log(2)));
  
  for (let i = 0; i <= points; i++) {
    const r = i * step;
    const intensity = Math.exp(-(r * r) / (2 * sigma * sigma));
    profile.push(intensity);
  }
  
  return profile;
};

const calculateEncircledEnergy = (fwhm: number, rmsSpotSize: number): EncircledEnergyData => {
  const maxRadius = fwhm * 3;
  const points = 50;
  const step = maxRadius / points;
  
  const radii: number[] = [];
  const energy: number[] = [];
  
  const sigma = rmsSpotSize;
  
  for (let i = 0; i <= points; i++) {
    const r = i * step;
    radii.push(r);
    
    // Cumulative energy for Gaussian profile
    const cumulativeEnergy = 1 - Math.exp(-(r * r) / (2 * sigma * sigma));
    energy.push(cumulativeEnergy * 100); // Convert to percentage
  }
  
  // Find specific energy containment radii
  const ee50 = findRadiusForEnergy(radii, energy, 50);
  const ee80 = findRadiusForEnergy(radii, energy, 80);
  const ee95 = findRadiusForEnergy(radii, energy, 95);
  
  return {
    radii,
    energy,
    ee50,
    ee80,
    ee95
  };
};

const findRadiusForEnergy = (radii: number[], energy: number[], targetEnergy: number): number => {
  for (let i = 0; i < energy.length - 1; i++) {
    if (energy[i] <= targetEnergy && energy[i + 1] > targetEnergy) {
      // Linear interpolation
      const fraction = (targetEnergy - energy[i]) / (energy[i + 1] - energy[i]);
      return radii[i] + fraction * (radii[i + 1] - radii[i]);
    }
  }
  return radii[radii.length - 1]; // Return max radius if not found
};

export const analyzeOpticalQuality = (results: PSFResults, inputs: PSFInputs): OpticalQualityMetrics => {
  const { strehlRatio, psfFWHM } = results;
  const { wavelength, aperture, focalLength } = inputs;
  
  // Diffraction limit
  const diffractionLimit = (1.22 * wavelength * 1e-9 * focalLength * 1e-3 / (aperture * 1e-3)) * 1e6;
  
  // Determine image quality
  let imageQuality: 'excellent' | 'good' | 'acceptable' | 'poor';
  if (strehlRatio > 0.8) imageQuality = 'excellent';
  else if (strehlRatio > 0.6) imageQuality = 'good';
  else if (strehlRatio > 0.3) imageQuality = 'acceptable';
  else imageQuality = 'poor';
  
  // Determine limiting factor
  let limitingFactor: OpticalQualityMetrics['limitingFactor'];
  const fwhmRatio = psfFWHM / diffractionLimit;
  
  if (fwhmRatio < 1.2) limitingFactor = 'diffraction';
  else if (inputs.defocusAmount > 5) limitingFactor = 'defocus';
  else if (inputs.atmosphericCondition !== 'clear') limitingFactor = 'atmosphere';
  else limitingFactor = 'aberrations';
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (strehlRatio < 0.8) {
    recommendations.push("Consider reducing optical aberrations");
  }
  if (inputs.defocusAmount > 2) {
    recommendations.push("Improve focus accuracy");
  }
  if (fwhmRatio > 2) {
    recommendations.push("Check for optical misalignment");
  }
  
  const performanceScore = Math.round(strehlRatio * 100);
  
  return {
    imageQuality,
    limitingFactor,
    recommendations,
    performanceScore
  };
};