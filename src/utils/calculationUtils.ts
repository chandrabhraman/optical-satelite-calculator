
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
  // inputs.altitudeMax is in km
  const nominalCenterPixelSize = calculateCenterPixelSize(ifov, inputs.altitudeMax, 0);
  const nominalEdgePixelSize = nominalCenterPixelSize / Math.cos(Math.atan((sensorWidthH / 2) / inputs.focalLength));
  
  // Worst case calculations (off nadir at max altitude)
  const offNadirAngle = toRadians(inputs.maxOffNadirAngle);
  const worstCaseCenterPixelSize = calculateCenterPixelSize(ifov, inputs.altitudeMax, inputs.maxOffNadirAngle);
  
  // Updated error calculations based on corrected formulas
  const secOffNadir = 1 / Math.cos(offNadirAngle);
  
  // Fix: Remove the *1000 since calculateCenterPixelSize already handles the km to m conversion
  // Fixed formula: altitudeMax (km) * SEC(maxOffNadirAngle*PI()/180) * SEC(maxOffNadirAngle*PI()/180) * attitudeAccuracy * PI()/180
  const rollEdgeChange = inputs.altitudeMax * secOffNadir * secOffNadir * toRadians(inputs.attitudeAccuracy);
  
  // Fixed formula: altitudeMax (km) * SEC(maxOffNadirAngle*PI()/180) * attitudeAccuracy * PI()/180
  const pitchEdgeChange = inputs.altitudeMax * secOffNadir * toRadians(inputs.attitudeAccuracy);
  
  // Fixed formula: altitudeMax (km) * SEC(maxOffNadirAngle*PI()/180) * attitudeAccuracy * PI()/180
  const yawEdgeChange = inputs.altitudeMax * secOffNadir * toRadians(inputs.attitudeAccuracy);
  
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
