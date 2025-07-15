import { MTFInputs, MTFResults, MTFCurveData } from './modelingTypes';

const PI = Math.PI;

export const calculateMTF = (inputs: MTFInputs): MTFResults => {
  const {
    pixelSize,
    aperture,
    focalLength,
    wavelength,
    spatialFrequencyRange,
    platformVelocity,
    integrationTime,
    detectorQE,
    electronicNoise
  } = inputs;

  // Generate frequency array
  const frequencies = generateFrequencyArray(spatialFrequencyRange[0], spatialFrequencyRange[1], 100);

  // Calculate individual MTF components
  const opticsMTF = calculateOpticsMTF(frequencies, inputs);
  const detectorMTF = calculateDetectorMTF(frequencies, inputs);
  const motionMTF = calculateMotionMTF(frequencies, inputs);

  // Combine all MTF components (multiply them)
  const overallMTF = frequencies.map((_, i) => 
    opticsMTF[i] * detectorMTF[i] * motionMTF[i]
  );

  // Find MTF50 (frequency where MTF = 0.5)
  const mtf50 = findMTF50(frequencies, overallMTF);

  // Calculate Nyquist frequency
  const nyquistFrequency = 1000 / (2 * pixelSize); // cycles/mm

  // Calculate sampling efficiency
  const samplingEfficiency = calculateSamplingEfficiency(overallMTF, frequencies, nyquistFrequency);

  // Generate MTF curve data for visualization
  const mtfCurve = generateMTFCurveData(frequencies, overallMTF, inputs);

  return {
    mtfCurve,
    mtf50,
    nyquistFrequency,
    samplingEfficiency,
    overallMTF,
    opticsMTF,
    detectorMTF,
    motionMTF,
    frequencies
  };
};

const generateFrequencyArray = (min: number, max: number, points: number): number[] => {
  const frequencies: number[] = [];
  const step = (max - min) / (points - 1);
  
  for (let i = 0; i < points; i++) {
    frequencies.push(min + i * step);
  }
  
  return frequencies;
};

const calculateOpticsMTF = (frequencies: number[], inputs: MTFInputs): number[] => {
  const { aperture, focalLength, wavelength, offNadirAngle, defocusAmount } = inputs;
  
  // Convert units
  const apertureM = aperture * 1e-3;
  const focalLengthM = focalLength * 1e-3;
  const wavelengthM = wavelength * 1e-9;
  const defocusM = Math.abs(defocusAmount) * 1e-6;

  // Diffraction-limited cutoff frequency
  const cutoffFreq = apertureM / (wavelengthM * focalLengthM) / 1000; // cycles/mm

  return frequencies.map(freq => {
    if (freq === 0) return 1.0;
    
    // Diffraction MTF (assuming circular aperture)
    const normalizedFreq = freq / cutoffFreq;
    let diffractionMTF = 0;
    
    if (normalizedFreq <= 1) {
      const angle = Math.acos(normalizedFreq);
      diffractionMTF = (2 / PI) * (angle - normalizedFreq * Math.sqrt(1 - normalizedFreq * normalizedFreq));
    }

    // Defocus MTF
    const defocusMTF = calculateDefocusMTF(freq, defocusM, wavelengthM, focalLengthM, apertureM);

    // Atmospheric MTF (simplified)
    const atmosphericMTF = calculateAtmosphericMTF(freq, inputs.atmosphericCondition, offNadirAngle);

    // Combine MTFs
    return diffractionMTF * defocusMTF * atmosphericMTF;
  });
};

const calculateDefocusMTF = (
  freq: number, 
  defocus: number, 
  wavelength: number, 
  focalLength: number, 
  aperture: number
): number => {
  if (defocus === 0) return 1.0;

  const fNumber = focalLength / aperture;
  const defocusParameter = (PI * defocus * freq) / (wavelength * fNumber * fNumber * 1000);
  
  if (Math.abs(defocusParameter) < 0.001) return 1.0;
  
  return Math.abs(Math.sin(defocusParameter) / defocusParameter);
};

const calculateAtmosphericMTF = (freq: number, condition: string, offNadirAngle: number): number => {
  const seeing = {
    clear: 1.5, // arcseconds
    hazy: 2.5,
    cloudy: 4.0
  };

  const seeingValue = seeing[condition as keyof typeof seeing] || seeing.clear;
  
  // Convert seeing to coherence length and then to MTF
  const airmass = 1 / Math.cos(offNadirAngle * PI / 180);
  const effectiveSeeing = seeingValue * Math.pow(airmass, 0.6);
  
  // Simplified atmospheric MTF model
  const r0 = 0.98 / (effectiveSeeing * 4.85e-6); // Fried parameter in meters
  const freqBreak = r0 / (2 * PI) * 1000; // cycles/mm
  
  if (freq === 0) return 1.0;
  return Math.exp(-Math.pow(freq / freqBreak, 5/3));
};

const calculateDetectorMTF = (frequencies: number[], inputs: MTFInputs): number[] => {
  const { pixelSize, detectorQE } = inputs;
  
  // Pixel aperture MTF (sinc function)
  const pixelFreq = 1000 / pixelSize; // cycles/mm for pixel pitch
  
  return frequencies.map(freq => {
    if (freq === 0) return detectorQE;
    
    const normalizedFreq = freq / pixelFreq;
    const pixelMTF = Math.abs(Math.sin(PI * normalizedFreq) / (PI * normalizedFreq));
    
    // Apply quantum efficiency
    return pixelMTF * detectorQE;
  });
};

const calculateMotionMTF = (frequencies: number[], inputs: MTFInputs): number[] => {
  const { platformVelocity, integrationTime, focalLength, pixelSize, altitude } = inputs;
  
  // Calculate ground velocity
  const groundVelocity = platformVelocity * (altitude / (altitude + focalLength * 1e-3));
  
  // Calculate Ground Sample Distance (GSD) in meters
  const gsd = (altitude * pixelSize * 1e-6) / (focalLength * 1e-3);
  
  // Motion blur distance in meters
  const motionBlurDistance = groundVelocity * integrationTime;
  
  // Motion blur in pixels
  const motionBlurPixels = motionBlurDistance / gsd;
  
  return frequencies.map(freq => {
    if (freq === 0 || motionBlurPixels === 0) return 1.0;
    
    // Motion MTF (sinc function)
    const pixelFreq = 1000 / pixelSize;
    const motionParam = PI * freq * motionBlurPixels / pixelFreq;
    
    if (Math.abs(motionParam) < 0.001) return 1.0;
    
    return Math.abs(Math.sin(motionParam) / motionParam);
  });
};

const findMTF50 = (frequencies: number[], mtfValues: number[]): number => {
  for (let i = 0; i < mtfValues.length - 1; i++) {
    if (mtfValues[i] >= 0.5 && mtfValues[i + 1] < 0.5) {
      // Linear interpolation
      const fraction = (0.5 - mtfValues[i]) / (mtfValues[i + 1] - mtfValues[i]);
      return frequencies[i] + fraction * (frequencies[i + 1] - frequencies[i]);
    }
  }
  return 0; // MTF never reaches 0.5
};

const calculateSamplingEfficiency = (
  mtfValues: number[], 
  frequencies: number[], 
  nyquistFreq: number
): number => {
  // Find MTF at Nyquist frequency
  const nyquistIndex = frequencies.findIndex(f => f >= nyquistFreq);
  if (nyquistIndex === -1) return 0;
  
  const mtfAtNyquist = mtfValues[nyquistIndex];
  return Math.max(0, Math.min(1, mtfAtNyquist));
};

const generateMTFCurveData = (
  frequencies: number[], 
  overallMTF: number[], 
  inputs: MTFInputs
): MTFCurveData => {
  // For simplicity, assume sagittal and tangential MTF are the same as overall MTF
  // In a real implementation, these would be calculated separately for off-axis points
  
  return {
    frequencies,
    mtfValues: overallMTF,
    sagittal: overallMTF.map(v => v * 0.95), // Slightly lower for realism
    tangential: overallMTF.map(v => v * 0.98)
  };
};

export const optimizeMTFParameters = (inputs: MTFInputs, targetMTF50: number): Partial<MTFInputs> => {
  const suggestions: Partial<MTFInputs> = {};
  
  // Calculate current MTF
  const results = calculateMTF(inputs);
  
  if (results.mtf50 < targetMTF50) {
    // Suggest improvements
    
    // Reduce pixel size for better sampling
    if (inputs.pixelSize > 3) {
      suggestions.pixelSize = Math.max(3, inputs.pixelSize * 0.8);
    }
    
    // Reduce integration time to minimize motion blur
    if (inputs.integrationTime > 0.0005) {
      suggestions.integrationTime = Math.max(0.0005, inputs.integrationTime * 0.8);
    }
    
    // Increase aperture for better diffraction limit
    suggestions.aperture = inputs.aperture * 1.2;
    
    // Reduce defocus
    if (inputs.defocusAmount > 1) {
      suggestions.defocusAmount = Math.max(0, inputs.defocusAmount * 0.5);
    }
  }
  
  return suggestions;
};