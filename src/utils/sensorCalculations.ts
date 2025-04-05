
/**
 * Utility functions for sensor calculations
 */

// Convert degrees to radians
export const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Convert radians to degrees
export const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

// Calculate focal length based on altitude, pixel size, and GSD requirements
export const calculateFocalLength = (
  altitudeMin: number, // in km
  pixelSize: number,   // in μm
  gsdRequirements: number // in m/px
): number => {
  // Formula: focal length (mm) = Altitude minimum (km) * 10^6 * Pixel size (μm) * 10^(-6) / GSD Requirements (m/px)
  // Simplified: focal length (mm) = Altitude minimum (km) * 1000 * Pixel size (μm) / GSD Requirements (m/px)
  return (altitudeMin * 1000 * pixelSize) / gsdRequirements;
};

// Calculate F-number based on focal length and aperture
export const calculateFNumber = (
  focalLength: number, // in mm
  aperture: number     // in mm
): number => {
  return focalLength / aperture;
};

// Calculate Instantaneous Field of View (IFOV)
export const calculateIFOV = (
  pixelSize: number,   // in μm
  focalLength: number  // in mm
): number => {
  // Formula: IFOV = 10^-3 * Pixel size (μm) / focal length (mm)
  // Returns IFOV in radians
  return 0.001 * pixelSize / focalLength;
};

// Calculate Horizontal Field of View (HFOV) in degrees
export const calculateHFOV = (
  pixelCountH: number,
  ifov: number         // in radians
): number => {
  // Formula: HFOV (deg) = Pixel count (H) * IFOV * 180/pi
  return pixelCountH * ifov * (180 / Math.PI);
};

// Calculate Vertical Field of View (VFOV) in degrees
export const calculateVFOV = (
  pixelCountV: number,
  ifov: number         // in radians
): number => {
  // Formula: VFOV (deg) = Pixel count (V) * IFOV * 180/pi
  return pixelCountV * ifov * (180 / Math.PI);
};

// Calculate Center Pixel Size for nadir facing geometry at max altitude
export const calculateCenterPixelSize = (
  ifov: number,        // in radians
  altitudeMax: number, // in km
  offNadirAngle: number = 0 // in degrees
): number => {
  const earthRadius = 6378; // Earth radius in km
  const offNadirRad = toRadians(offNadirAngle);
  
  // Formula: Center pixel size = IFOV * (Altitude maximum (km) * 1000 + 6378000 * (1-COS(0))) * SEC(0) * SEC(0)
  // For nadir pointing (offNadirAngle = 0), this simplifies to:
  // Center pixel size = IFOV * Altitude maximum (km) * 1000
  // For off-nadir, we need to include the secant terms
  
  const secOffNadir = 1 / Math.cos(offNadirRad);
  return ifov * (altitudeMax * 1000 + earthRadius * 1000 * (1 - Math.cos(offNadirRad))) * secOffNadir * secOffNadir;
};

// Calculate Angle subtended at earth center
export const calculateEarthCenterAngle = (
  altitudeMax: number, // in km
  fovHDeg: number      // in degrees
): number => {
  const earthRadius = 6378; // Earth radius in km
  
  // Formula: Angle subtended = ATAN(Altitude maximum*1000*TAN(FOV (H) (deg)*0.5*PI()/180)/6378000)
  return Math.atan(altitudeMax * 1000 * Math.tan(toRadians(fovHDeg * 0.5)) / (earthRadius * 1000));
};

// Comprehensive calculation function that takes sensor inputs and returns calculated values
export const calculateSensorParameters = (inputs: {
  pixelSize?: number,       // in μm
  pixelCountH: number,
  pixelCountV: number,
  gsdRequirements?: number, // in m/px
  altitudeMin: number,      // in km
  altitudeMax: number,      // in km
  focalLength?: number,     // in mm
  aperture?: number,        // in mm
  nominalOffNadirAngle: number // in degrees
}): {
  focalLength: number,
  fNumber?: number,
  ifov: number,
  hfovDeg: number,
  vfovDeg: number,
  centerPixelSize: number,
  earthCenterAngle: number
} => {
  let focalLength = inputs.focalLength || 0;
  let fNumber;
  
  // Calculate focal length if not provided but we have pixel size and GSD requirements
  if (!focalLength && inputs.pixelSize && inputs.gsdRequirements) {
    focalLength = calculateFocalLength(inputs.altitudeMin, inputs.pixelSize, inputs.gsdRequirements);
  }
  
  // Calculate F-number if we have focal length and aperture
  if (focalLength && inputs.aperture) {
    fNumber = calculateFNumber(focalLength, inputs.aperture);
  }
  
  // Calculate IFOV
  let ifov = 0;
  if (inputs.pixelSize && focalLength) {
    ifov = calculateIFOV(inputs.pixelSize, focalLength);
  }
  
  // Calculate FOVs
  const hfovDeg = calculateHFOV(inputs.pixelCountH, ifov);
  const vfovDeg = calculateVFOV(inputs.pixelCountV, ifov);
  
  // Calculate center pixel size
  const centerPixelSize = calculateCenterPixelSize(ifov, inputs.altitudeMax, inputs.nominalOffNadirAngle);
  
  // Calculate Earth center angle
  const earthCenterAngle = calculateEarthCenterAngle(inputs.altitudeMax, hfovDeg);
  
  return {
    focalLength,
    fNumber,
    ifov,
    hfovDeg,
    vfovDeg,
    centerPixelSize,
    earthCenterAngle: toDegrees(earthCenterAngle) // Return in degrees
  };
};
