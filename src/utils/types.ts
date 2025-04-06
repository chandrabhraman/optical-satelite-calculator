
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
  edgePixelSize: number;
  horizontalFootprint: number;
  verticalFootprint: number;
  [key: string]: number;
}

export interface WorstCaseResults {
  centerPixelSize: number;
  rollEdgeChange: number;
  pitchEdgeChange: number;
  yawEdgeChange: number;
  rssError: number;
  horizontalFootprint: number;
  verticalFootprint: number;
  [key: string]: number;
}

export interface CalculationResults {
  nominal: NominalResults;
  worstCase: WorstCaseResults;
}

export interface VisualizationSettings {
  earthRadius: number; // km
  coneColor: string;
  footprintColor: string;
  showFootprint: boolean;
  showSensorField: boolean;
}
