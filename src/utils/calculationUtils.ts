
import { SensorInputs, CalculationResults } from "./types";
import { 
  toRadians, 
  toDegrees, 
  calculateIFOV, 
  calculateCenterPixelSize,
  calculateEarthCenterAngle,
  calculateHorizontalFootprint,
  calculateVerticalFootprint
} from "./sensorCalculations";

export const calculateResults = (inputs: SensorInputs): CalculationResults => {
  // Constants
  const EARTH_RADIUS = 6371; // meters
  
  // Calculate IFOV (Instantaneous Field of View)
  const ifov = calculateIFOV(inputs.pixelSize, inputs.focalLength);
  
  // Calculate field of view
  const sensorWidthH = inputs.pixelSize * inputs.pixelCountH / 1000; // in mm
  const sensorWidthV = inputs.pixelSize * inputs.pixelCountV / 1000; // in mm
  const fovH = 2 * Math.atan(sensorWidthH / (2 * inputs.focalLength));
  const fovV = 2 * Math.atan(sensorWidthV / (2 * inputs.focalLength));
  
  // Convert fov from radians to degrees
  const fovHDeg = toDegrees(fovH);
  const fovVDeg = toDegrees(fovV);
  
  // Convert altitude from meters to kilometers for our calculations
  // inputs.altitudeMax is already in meters
  const altitudeMaxKm = inputs.altitudeMax / 1000;
  
  // Calculate Earth radius in kilometers
  const earthRadiusKm = EARTH_RADIUS / 1000;
  
  // Nominal calculations (nadir facing at max altitude)
  const nominalCenterPixelSize = calculateCenterPixelSize(ifov, altitudeMaxKm, 0);
  // Updated: Use calculateCenterPixelSize with fovH/2 in degrees
  const nominalEdgePixelSize = calculateCenterPixelSize(ifov, altitudeMaxKm, toDegrees(fovH * 0.5));
  
  // Calculate footprints for nominal case
  const nominalHorizontalFootprint = calculateHorizontalFootprint(
    earthRadiusKm,
    altitudeMaxKm,
    fovHDeg,
    0 // nadir facing
  );
  
  const nominalVerticalFootprint = calculateVerticalFootprint(
    earthRadiusKm,
    altitudeMaxKm,
    fovVDeg,
    0 // nadir facing
  );
  
  // Worst case calculations (off nadir at max altitude)
  const offNadirAngle = toRadians(inputs.maxOffNadirAngle);
  const worstCaseCenterPixelSize = calculateCenterPixelSize(ifov, altitudeMaxKm, inputs.maxOffNadirAngle);
  
  // Calculate footprints for off-nadir case
  const worstCaseHorizontalFootprint = calculateHorizontalFootprint(
    earthRadiusKm,
    altitudeMaxKm,
    fovHDeg,
    inputs.maxOffNadirAngle
  );
  
  const worstCaseVerticalFootprint = calculateVerticalFootprint(
    earthRadiusKm,
    altitudeMaxKm,
    fovVDeg,
    inputs.maxOffNadirAngle
  );
  
  // Updated error calculations based on corrected formulas
  const secOffNadir = 1 / Math.cos(offNadirAngle);
  
  // Formulas use altitude in meters
  const rollEdgeChange = altitudeMaxKm * 1000 * secOffNadir * secOffNadir * toRadians(inputs.attitudeAccuracy);
  const pitchEdgeChange = altitudeMaxKm * 1000 * secOffNadir * toRadians(inputs.attitudeAccuracy);
  const yawEdgeChange = altitudeMaxKm * 1000 * secOffNadir * toRadians(inputs.attitudeAccuracy);
  
  // Calculate the RSS error
  const rssError = Math.sqrt(Math.pow(rollEdgeChange, 2) + Math.pow(pitchEdgeChange, 2) + Math.pow(yawEdgeChange, 2));
  
  return {
    nominal: {
      centerPixelSize: nominalCenterPixelSize,
      edgePixelSize: nominalEdgePixelSize,
      horizontalFootprint: nominalHorizontalFootprint,
      verticalFootprint: nominalVerticalFootprint
    },
    worstCase: {
      centerPixelSize: worstCaseCenterPixelSize,
      rollEdgeChange: rollEdgeChange,
      pitchEdgeChange: pitchEdgeChange,
      yawEdgeChange: yawEdgeChange,
      rssError: rssError,
      horizontalFootprint: worstCaseHorizontalFootprint,
      verticalFootprint: worstCaseVerticalFootprint
    }
  };
};
