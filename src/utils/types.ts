
export interface SensorInputs {
  pixelSize: number;
  pixelCountH: number;
  pixelCountV: number;
  gsdRequirements: number;
  altitudeMin: number;
  altitudeMax: number;
  focalLength: number;
  aperture: number;
  attitudeAccuracy: number;
  nominalOffNadirAngle: number;
  maxOffNadirAngle: number;
  gpsAccuracy: number;
}

export interface NominalResults {
  centerPixelSize: number;
  edgePixelAngle: number;
  earthCenterAngle: number;
  edgePixelSize: number;
  attitudeControlChange: number;
  attitudeMeasurementChange: number;
  gpsPositionChange: number;
  [key: string]: number;
}

export interface WorstCaseResults {
  edgePixelAngle: number;
  earthCenterAngle: number;
  edgePixelSize: number;
  centerPixelSize: number;
  attitudeControlChange: number;
  attitudeMeasurementChange: number;
  gpsPositionChange: number;
  rollEdgeChange: number;
  pitchEdgeChange: number;
  yawEdgeChange: number;
  rssError: number;
  [key: string]: number;
}

export interface CalculationResults {
  nominal: NominalResults;
  worstCase: WorstCaseResults;
}
