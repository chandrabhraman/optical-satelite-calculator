/**
 * Orbital calculation utilities for satellite positioning
 */

/**
 * Constants
 */
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const EARTH_RADIUS = 6371; // km
const EARTH_FLATTENING = 1/298.257223563;
const EARTH_ECCENTRICITY_SQ = 2*EARTH_FLATTENING - Math.pow(EARTH_FLATTENING, 2);
const EARTH_MU = 398600.4418; // Earth's gravitational parameter (km³/s²)

/**
 * Conversion between degrees and radians
 */
export const toRadians = (degrees: number): number => degrees * DEG_TO_RAD;
export const toDegrees = (radians: number): number => radians * RAD_TO_DEG;

/**
 * Normalizes an angle in radians to be within [0, 2π]
 */
export const normalizeAngle = (angle: number): number => {
  while (angle < 0) angle += 2 * Math.PI;
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
  return angle;
};

/**
 * Converts geodetic coordinates (latitude, longitude, altitude) to ECEF coordinates
 */
export function geodeticToECEF(
  latDeg: number, 
  lngDeg: number, 
  altitudeKm: number
): [number, number, number] {
  const lat = toRadians(latDeg);
  const lng = toRadians(lngDeg);
  
  const cosLat = Math.cos(lat);
  const sinLat = Math.sin(lat);
  const cosLng = Math.cos(lng);
  const sinLng = Math.sin(lng);
  
  // Calculate N - radius of curvature in prime vertical
  const N = EARTH_RADIUS / Math.sqrt(1 - EARTH_ECCENTRICITY_SQ * sinLat * sinLat);
  
  // Calculate ECEF coordinates
  const x = (N + altitudeKm) * cosLat * cosLng;
  const y = (N + altitudeKm) * cosLat * sinLng;
  const z = ((1 - EARTH_ECCENTRICITY_SQ) * N + altitudeKm) * sinLat;
  
  return [x, y, z];
}

/**
 * Converts ECEF coordinates to geodetic coordinates (latitude, longitude, altitude)
 * Uses an iterative method for precise conversion
 */
export function ecefToGeodetic(
  x: number, 
  y: number, 
  z: number
): { lat: number, lng: number, altitude: number } {
  const p = Math.sqrt(x*x + y*y);
  const theta = Math.atan2(z * EARTH_RADIUS, p * (EARTH_RADIUS * (1 - EARTH_ECCENTRICITY_SQ)));
  
  const latRad = Math.atan2(
    z + EARTH_ECCENTRICITY_SQ * EARTH_RADIUS * Math.pow(Math.sin(theta), 3),
    p - EARTH_ECCENTRICITY_SQ * EARTH_RADIUS * Math.pow(Math.cos(theta), 3)
  );
  
  const lngRad = Math.atan2(y, x);
  
  const N = EARTH_RADIUS / Math.sqrt(1 - EARTH_ECCENTRICITY_SQ * Math.pow(Math.sin(latRad), 2));
  const altitude = p / Math.cos(latRad) - N;
  
  return {
    lat: toDegrees(latRad),
    lng: toDegrees(lngRad),
    altitude: altitude
  };
}

/**
 * Rotate a point around the X axis
 */
export function rotateX(point: [number, number, number], angleRad: number): [number, number, number] {
  const cosAngle = Math.cos(angleRad);
  const sinAngle = Math.sin(angleRad);
  
  return [
    point[0],
    point[1] * cosAngle - point[2] * sinAngle,
    point[1] * sinAngle + point[2] * cosAngle
  ];
}

/**
 * Rotate a point around the Y axis
 */
export function rotateY(point: [number, number, number], angleRad: number): [number, number, number] {
  const cosAngle = Math.cos(angleRad);
  const sinAngle = Math.sin(angleRad);
  
  return [
    point[0] * cosAngle + point[2] * sinAngle,
    point[1],
    -point[0] * sinAngle + point[2] * cosAngle
  ];
}

/**
 * Rotate a point around the Z axis
 */
export function rotateZ(point: [number, number, number], angleRad: number): [number, number, number] {
  const cosAngle = Math.cos(angleRad);
  const sinAngle = Math.sin(angleRad);
  
  return [
    point[0] * cosAngle - point[1] * sinAngle,
    point[0] * sinAngle + point[1] * cosAngle,
    point[2]
  ];
}

/**
 * Calculate satellite position in ECI coordinates based on orbital elements
 * This is a direct calculation using orbital elements, not a frame transformation
 * Updated to apply inclination rotation first, then RAAN rotation
 */
export function calculateSatelliteECIPosition(
  semiMajorAxis: number,
  eccentricity: number = 0, 
  inclinationRad: number,
  raanRad: number,
  argOfPeriapsisRad: number = 0,
  trueAnomalyRad: number
): [number, number, number] {
  // For circular orbits, calculate position in the orbital plane (perifocal frame)
  const r = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomalyRad));
  
  // Position in the orbital plane (perifocal coordinates)
  const x_orbit = r * Math.cos(trueAnomalyRad);
  const y_orbit = r * Math.sin(trueAnomalyRad);
  const z_orbit = 0;
  
  // Apply the transformation from orbital plane to ECI
  // First rotation: Argument of periapsis (around Z)
  let position: [number, number, number] = [x_orbit, y_orbit, z_orbit];
  position = rotateZ(position, argOfPeriapsisRad);
  
  // Changed rotation order: First inclination (around X), then RAAN (around Z)
  // First rotation: Inclination (around X)
  position = rotateX(position, inclinationRad);
  
  // Second rotation: RAAN (around Z)
  position = rotateZ(position, raanRad);
  
  return position;
}

/**
 * Convert ECI coordinates to ECEF coordinates using Greenwich Sidereal Time
 */
export function eciToEcef(
  eciCoords: [number, number, number],
  greenwichSiderealTimeRad: number
): [number, number, number] {
  // Rotate around Z axis by the Greenwich Sidereal Time
  return rotateZ(eciCoords, -greenwichSiderealTimeRad);
}

/**
 * Convert ECEF coordinates to ECI coordinates using Greenwich Sidereal Time
 */
export function ecefToEci(
  ecefCoords: [number, number, number],
  greenwichSiderealTimeRad: number
): [number, number, number] {
  // Rotate around Z axis by the Greenwich Sidereal Time (opposite direction)
  return rotateZ(ecefCoords, greenwichSiderealTimeRad);
}

/**
 * Calculate satellite position in Geodetic coordinates (lat, long, alt)
 * based on orbital elements and Earth rotation
 */
export function calculateSatelliteLatLong(
  altitudeKm: number,
  inclinationDeg: number,
  raanRad: number,
  trueAnomalyRad: number,
  earthRotationAngle: number = 0
): { lat: number, lng: number } {
  // Convert altitude to semi-major axis
  const semiMajorAxis = EARTH_RADIUS + altitudeKm;
  const inclinationRad = toRadians(inclinationDeg);
  
  // Calculate ECI position
  const eciPosition = calculateSatelliteECIPosition(
    semiMajorAxis,
    0, // circular orbit
    inclinationRad,
    raanRad,
    0, // argument of perigee
    trueAnomalyRad
  );
  
  // Convert to ECEF, accounting for Earth's rotation but NOT for RAAN
  // RAAN is already accounted for in the ECI calculation
  const ecefPosition = eciToEcef(eciPosition, earthRotationAngle);
  
  // Convert ECEF to lat/long
  const geodetic = ecefToGeodetic(ecefPosition[0], ecefPosition[1], ecefPosition[2]);
  
  return { lat: geodetic.lat, lng: geodetic.lng };
}

/**
 * Calculates the Euclidean distance between two points in 3D space
 */
export function calculateDistance(p1: [number, number, number], p2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(p2[0] - p1[0], 2) + 
    Math.pow(p2[1] - p1[1], 2) + 
    Math.pow(p2[2] - p1[2], 2)
  );
}

/**
 * Calculates the great circle distance between two points on Earth's surface
 * @param lat1 Latitude of first point in degrees
 * @param lng1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lng2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateGreatCircleDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const lat1Rad = toRadians(lat1);
  const lng1Rad = toRadians(lng1);
  const lat2Rad = toRadians(lat2);
  const lng2Rad = toRadians(lng2);
  
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

/**
 * Validates if a location with given latitude can be overflown by a satellite with given inclination
 */
export function isLocationReachableByInclination(latDeg: number, inclinationDeg: number): boolean {
  // The absolute latitude must be less than or equal to the inclination
  return Math.abs(latDeg) <= inclinationDeg;
}

/**
 * Calculate orbital period in seconds for a given semi-major axis
 */
export function calculateOrbitalPeriod(semiMajorAxisKm: number): number {
  return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisKm, 3) / EARTH_MU);
}

/**
 * Finds optimal RAAN and True Anomaly values to position a satellite over a target lat/long
 */
export function findOptimalOrbitalParameters(
  targetLatDeg: number, 
  targetLngDeg: number, 
  inclinationDeg: number, 
  altitudeKm: number,
  earthRotationAngle: number = 0
): { raan: number, trueAnomaly: number, error: number } {
  if (!isLocationReachableByInclination(targetLatDeg, inclinationDeg)) {
    throw new Error("Location latitude exceeds satellite inclination");
  }

  let bestRaan = 0;
  let bestTrueAnomaly = 0;
  let minError = Number.MAX_VALUE;

  const targetECEF = geodeticToECEF(targetLatDeg, targetLngDeg, 0);
  
  // Step 1: Coarse grid search to get in the right neighborhood
  const raanSteps = 36;
  const taSteps = 36;
  
  for (let raanStep = 0; raanStep < raanSteps; raanStep++) {
    const raan = (raanStep / raanSteps) * 2 * Math.PI;
    
    for (let taStep = 0; taStep < taSteps; taStep++) {
      const trueAnomaly = (taStep / taSteps) * 2 * Math.PI;
      
      // Calculate satellite position using orbital elements
      const satGeodetic = calculateSatelliteLatLong(
        altitudeKm,
        inclinationDeg,
        raan,
        trueAnomaly,
        earthRotationAngle
      );
      
      // Calculate the great circle distance between the satellite ground point and target
      const error = calculateGreatCircleDistance(
        targetLatDeg,
        targetLngDeg,
        satGeodetic.lat,
        satGeodetic.lng
      );
      
      if (error < minError) {
        minError = error;
        bestRaan = raan;
        bestTrueAnomaly = trueAnomaly;
      }
    }
  }
  
  // Step 2: Refine the search with a finer grid around the best point found
  const refinementRadius = Math.PI / 18; // 10 degrees
  const refinementSteps = 10;
  
  for (let raanOffset = -refinementRadius; raanOffset <= refinementRadius; raanOffset += (2 * refinementRadius) / refinementSteps) {
    const raan = normalizeAngle(bestRaan + raanOffset);
    
    for (let taOffset = -refinementRadius; taOffset <= refinementRadius; taOffset += (2 * refinementRadius) / refinementSteps) {
      const trueAnomaly = normalizeAngle(bestTrueAnomaly + taOffset);
      
      const satGeodetic = calculateSatelliteLatLong(
        altitudeKm,
        inclinationDeg,
        raan,
        trueAnomaly,
        earthRotationAngle
      );
      
      const error = calculateGreatCircleDistance(
        targetLatDeg,
        targetLngDeg,
        satGeodetic.lat,
        satGeodetic.lng
      );
      
      if (error < minError) {
        minError = error;
        bestRaan = raan;
        bestTrueAnomaly = trueAnomaly;
      }
    }
  }
  
  return {
    raan: bestRaan,
    trueAnomaly: bestTrueAnomaly,
    error: minError
  };
}
