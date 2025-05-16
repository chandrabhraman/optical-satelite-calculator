
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
 * Calculates satellite position directly in Cartesian coordinates
 * based on orbital parameters, without using ECI/ECEF conversions
 */
export function calculateSatellitePosition(
  altitudeKm: number,
  inclinationDeg: number,
  raanRad: number,
  trueAnomalyRad: number,
  earthRotationAngle: number = 0
): [number, number, number] {
  const orbitRadius = EARTH_RADIUS + altitudeKm;
  const inclination = toRadians(inclinationDeg);
  
  // Position in orbital plane (x-z plane by default)
  const xOrbit = orbitRadius * Math.cos(trueAnomalyRad);
  const yOrbit = 0;
  const zOrbit = orbitRadius * Math.sin(trueAnomalyRad);
  
  // Apply rotation matrices directly
  // 1. Rotate around Y axis by inclination (tilt the orbital plane)
  const cosInc = Math.cos(inclination);
  const sinInc = Math.sin(inclination);
  
  const x1 = xOrbit;
  const y1 = yOrbit * cosInc - zOrbit * sinInc;
  const z1 = yOrbit * sinInc + zOrbit * cosInc;
  
  // 2. Rotate around Z axis by RAAN (orient the orbital plane)
  const cosRaan = Math.cos(raanRad);
  const sinRaan = Math.sin(raanRad);
  
  const x2 = x1 * cosRaan - y1 * sinRaan;
  const y2 = x1 * sinRaan + y1 * cosRaan;
  const z2 = z1;
  
  // 3. Apply Earth rotation (if needed)
  const cosEarth = Math.cos(earthRotationAngle);
  const sinEarth = Math.sin(earthRotationAngle);
  
  const x3 = x2 * cosEarth - y2 * sinEarth;
  const y3 = x2 * sinEarth + y2 * cosEarth;
  const z3 = z2;
  
  return [x3, y3, z3];
}

/**
 * Calculate lat/long coordinates for satellite position
 */
export function calculateSatelliteLatLong(
  altitudeKm: number,
  inclinationDeg: number,
  raanRad: number,
  trueAnomalyRad: number,
  earthRotationAngle: number = 0
): { lat: number, lng: number } {
  // Get position in Cartesian coordinates
  const position = calculateSatellitePosition(
    altitudeKm, 
    inclinationDeg, 
    raanRad, 
    trueAnomalyRad, 
    earthRotationAngle
  );
  
  // Convert to geodetic coordinates
  const geodetic = ecefToGeodetic(position[0], position[1], position[2]);
  
  return {
    lat: geodetic.lat,
    lng: geodetic.lng
  };
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
      
      // Calculate satellite position directly
      const satPosition = calculateSatellitePosition(
        altitudeKm,
        inclinationDeg,
        raan,
        trueAnomaly,
        earthRotationAngle
      );
      
      // Convert to geodetic
      const satGeodetic = ecefToGeodetic(satPosition[0], satPosition[1], satPosition[2]);
      
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
      
      const satPosition = calculateSatellitePosition(
        altitudeKm,
        inclinationDeg,
        raan,
        trueAnomaly,
        earthRotationAngle
      );
      
      const satGeodetic = ecefToGeodetic(satPosition[0], satPosition[1], satPosition[2]);
      
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
