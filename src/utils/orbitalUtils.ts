
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
 * Converts ECEF coordinates to ECI coordinates at a specific Earth rotation angle
 * @param ecefCoords ECEF coordinates [x, y, z]
 * @param earthRotationAngle Earth rotation angle in radians
 * @returns ECI coordinates [x, y, z]
 */
export function ecefToECI(
  ecefCoords: [number, number, number], 
  earthRotationAngle: number
): [number, number, number] {
  const [x, y, z] = ecefCoords;
  const cosTheta = Math.cos(earthRotationAngle);
  const sinTheta = Math.sin(earthRotationAngle);
  
  // Rotation around z-axis
  const xECI = x * cosTheta + y * sinTheta;
  const yECI = -x * sinTheta + y * cosTheta;
  const zECI = z;
  
  return [xECI, yECI, zECI];
}

/**
 * Converts ECI coordinates to ECEF coordinates at a specific Earth rotation angle
 * @param eciCoords ECI coordinates [x, y, z]
 * @param earthRotationAngle Earth rotation angle in radians
 * @returns ECEF coordinates [x, y, z]
 */
export function eciToECEF(
  eciCoords: [number, number, number], 
  earthRotationAngle: number
): [number, number, number] {
  const [x, y, z] = eciCoords;
  const cosTheta = Math.cos(earthRotationAngle);
  const sinTheta = Math.sin(earthRotationAngle);
  
  // Inverse rotation around z-axis
  const xECEF = x * cosTheta - y * sinTheta;
  const yECEF = x * sinTheta + y * cosTheta;
  const zECEF = z;
  
  return [xECEF, yECEF, zECEF];
}

/**
 * Calculates the satellite position in ECI coordinates based on orbital parameters
 */
export function calculateSatellitePositionECI(
  altitudeKm: number,
  inclinationDeg: number,
  raanRad: number,
  trueAnomalyRad: number
): [number, number, number] {
  const inclination = toRadians(inclinationDeg);
  const orbitRadius = EARTH_RADIUS + altitudeKm;
  
  // Position in orbital plane
  const xOrbit = orbitRadius * Math.cos(trueAnomalyRad);
  const yOrbit = orbitRadius * Math.sin(trueAnomalyRad);
  const zOrbit = 0;
  
  // Apply rotation for inclination and RAAN
  const cosInc = Math.cos(inclination);
  const sinInc = Math.sin(inclination);
  const cosRaan = Math.cos(raanRad);
  const sinRaan = Math.sin(raanRad);
  
  // Apply the orbital plane orientation (inclination and RAAN)
  const x = xOrbit * cosRaan - yOrbit * cosInc * sinRaan;
  const y = xOrbit * sinRaan + yOrbit * cosInc * cosRaan;
  const z = yOrbit * sinInc;
  
  return [x, y, z];
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
 * Finds optimal RAAN and True Anomaly values to position a satellite over a target lat/long
 * Uses a simple grid search followed by refinement
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
      
      // Calculate satellite position in ECI
      const satECI = calculateSatellitePositionECI(
        altitudeKm,
        inclinationDeg,
        raan,
        trueAnomaly
      );
      
      // Convert to ECEF
      const satECEF = eciToECEF(satECI, earthRotationAngle);
      
      // Convert ECEF to geodetic
      const satGeodetic = ecefToGeodetic(satECEF[0], satECEF[1], satECEF[2]);
      
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
      
      const satECI = calculateSatellitePositionECI(
        altitudeKm,
        inclinationDeg,
        raan,
        trueAnomaly
      );
      
      const satECEF = eciToECEF(satECI, earthRotationAngle);
      const satGeodetic = ecefToGeodetic(satECEF[0], satECEF[1], satECEF[2]);
      
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
