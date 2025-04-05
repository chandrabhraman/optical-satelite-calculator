
import { SensorInputs, CalculationResults } from "./types";

export const calculateResults = (inputs: SensorInputs): CalculationResults => {
  // Constants
  const EARTH_RADIUS = 6371000; // meters
  
  // Helper functions for calculations
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const toDegrees = (radians: number) => radians * (180 / Math.PI);
  
  // Calculate field of view
  const sensorWidthH = inputs.pixelSize * inputs.pixelCountH / 1000; // in mm
  const sensorWidthV = inputs.pixelSize * inputs.pixelCountV / 1000; // in mm
  const fovH = 2 * Math.atan(sensorWidthH / (2 * inputs.focalLength));
  const fovV = 2 * Math.atan(sensorWidthV / (2 * inputs.focalLength));
  
  // Nominal calculations (nadir facing at max altitude)
  const nominalCenterPixelSize = inputs.pixelSize * inputs.altitudeMax / inputs.focalLength;
  const nominalEdgePixelAngle = Math.atan((sensorWidthH / 2) / inputs.focalLength);
  const nominalEarthCenterAngle = Math.asin(inputs.altitudeMax * Math.sin(nominalEdgePixelAngle) / (EARTH_RADIUS + inputs.altitudeMax));
  const nominalEdgePixelSize = nominalCenterPixelSize / Math.cos(nominalEdgePixelAngle);
  const nominalAttitudeControlChange = inputs.altitudeMax * Math.tan(toRadians(inputs.attitudeAccuracy));
  const nominalAttitudeMeasurementChange = inputs.altitudeMax * Math.tan(toRadians(inputs.attitudeAccuracy));
  const nominalGpsPositionChange = inputs.gpsAccuracy;
  
  // Worst case calculations (off nadir at max altitude)
  const offNadirAngle = toRadians(inputs.maxOffNadirAngle);
  const worstCaseEdgePixelAngle = nominalEdgePixelAngle + offNadirAngle;
  const worstCaseEarthCenterAngle = Math.asin(inputs.altitudeMax * Math.sin(worstCaseEdgePixelAngle) / (EARTH_RADIUS + inputs.altitudeMax));
  const worstCaseCenterPixelSize = nominalCenterPixelSize / Math.cos(offNadirAngle);
  const worstCaseEdgePixelSize = worstCaseCenterPixelSize / Math.cos(nominalEdgePixelAngle);
  const worstCaseAttitudeControlChange = inputs.altitudeMax * Math.tan(toRadians(inputs.attitudeAccuracy) + offNadirAngle);
  const worstCaseAttitudeMeasurementChange = inputs.altitudeMax * Math.tan(toRadians(inputs.attitudeAccuracy) + offNadirAngle);
  const worstCaseGpsPositionChange = inputs.gpsAccuracy;
  
  // Error calculations
  const rollEdgeChange = inputs.altitudeMax * Math.tan(toRadians(inputs.attitudeAccuracy));
  const pitchEdgeChange = inputs.altitudeMax * Math.tan(toRadians(inputs.attitudeAccuracy));
  const yawEdgeChange = inputs.altitudeMax * Math.sin(nominalEdgePixelAngle) * toRadians(inputs.attitudeAccuracy);
  const rssError = Math.sqrt(Math.pow(rollEdgeChange, 2) + Math.pow(pitchEdgeChange, 2) + Math.pow(yawEdgeChange, 2));
  
  return {
    nominal: {
      centerPixelSize: nominalCenterPixelSize,
      edgePixelAngle: toDegrees(nominalEdgePixelAngle),
      earthCenterAngle: toDegrees(nominalEarthCenterAngle),
      edgePixelSize: nominalEdgePixelSize,
      attitudeControlChange: nominalAttitudeControlChange,
      attitudeMeasurementChange: nominalAttitudeMeasurementChange,
      gpsPositionChange: nominalGpsPositionChange
    },
    worstCase: {
      edgePixelAngle: toDegrees(worstCaseEdgePixelAngle),
      earthCenterAngle: toDegrees(worstCaseEarthCenterAngle),
      edgePixelSize: worstCaseEdgePixelSize,
      centerPixelSize: worstCaseCenterPixelSize,
      attitudeControlChange: worstCaseAttitudeControlChange,
      attitudeMeasurementChange: worstCaseAttitudeMeasurementChange,
      gpsPositionChange: worstCaseGpsPositionChange,
      rollEdgeChange: rollEdgeChange,
      pitchEdgeChange: pitchEdgeChange,
      yawEdgeChange: yawEdgeChange,
      rssError: rssError
    }
  };
};
