
import { SensorInputs, CalculationResults } from "./types";
import { 
  toRadians, 
  toDegrees, 
  calculateIFOV, 
  calculateCenterPixelSize,
  calculateEarthCenterAngle
} from "./sensorCalculations";

export const calculateResults = (inputs: SensorInputs): CalculationResults => {
  // Constants
  const EARTH_RADIUS = 6371000; // meters
  
  // Calculate IFOV (Instantaneous Field of View)
  const ifov = calculateIFOV(inputs.pixelSize, inputs.focalLength);
  
  // Calculate field of view
  const sensorWidthH = inputs.pixelSize * inputs.pixelCountH / 1000; // in mm
  const sensorWidthV = inputs.pixelSize * inputs.pixelCountV / 1000; // in mm
  const fovH = 2 * Math.atan(sensorWidthH / (2 * inputs.focalLength));
  const fovV = 2 * Math.atan(sensorWidthV / (2 * inputs.focalLength));
  
  // Nominal calculations (nadir facing at max altitude)
  // Fix: Don't divide by 1000 as inputs.altitudeMax is already in km
  const nominalCenterPixelSize = calculateCenterPixelSize(ifov, inputs.altitudeMax, 0);
  const nominalEdgePixelSize = nominalCenterPixelSize / Math.cos(Math.atan((sensorWidthH / 2) / inputs.focalLength));
  
  // Worst case calculations (off nadir at max altitude)
  // Fix: Don't divide by 1000 as inputs.altitudeMax is already in km
  const offNadirAngle = toRadians(inputs.maxOffNadirAngle);
  const worstCaseCenterPixelSize = calculateCenterPixelSize(ifov, inputs.altitudeMax, inputs.maxOffNadirAngle);
  
  // Updated error calculations based on corrected formulas
  const secOffNadir = 1 / Math.cos(offNadirAngle);
  
  // Fixed formula: altitudeMax (km) * 1000 * SEC(maxOffNadirAngle*PI()/180) * SEC(maxOffNadirAngle*PI()/180) * attitudeAccuracy * PI()/180
  const rollEdgeChange = inputs.altitudeMax * 1000 * secOffNadir * secOffNadir * toRadians(inputs.attitudeAccuracy);
  
  // Fixed formula: altitudeMax (km) * 1000 * SEC(maxOffNadirAngle*PI()/180) * attitudeAccuracy * PI()/180
  const pitchEdgeChange = inputs.altitudeMax * 1000 * secOffNadir * toRadians(inputs.attitudeAccuracy);
  
  // Fixed formula: altitudeMax (km) * 1000 * SEC(maxOffNadirAngle*PI()/180) * attitudeAccuracy * PI()/180
  const yawEdgeChange = inputs.altitudeMax * 1000 * secOffNadir * toRadians(inputs.attitudeAccuracy);
  
  // Calculate the RSS error
  const rssError = Math.sqrt(Math.pow(rollEdgeChange, 2) + Math.pow(pitchEdgeChange, 2) + Math.pow(yawEdgeChange, 2));
  
  return {
    nominal: {
      centerPixelSize: nominalCenterPixelSize,
      edgePixelSize: nominalEdgePixelSize
    },
    worstCase: {
      centerPixelSize: worstCaseCenterPixelSize,
      rollEdgeChange: rollEdgeChange,
      pitchEdgeChange: pitchEdgeChange,
      yawEdgeChange: yawEdgeChange,
      rssError: rssError
    }
  };
};
