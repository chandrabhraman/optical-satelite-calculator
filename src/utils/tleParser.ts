/**
 * TLE (Two-Line Element) parser for extracting orbital elements
 */
import { calculateSatelliteECIPosition, eciToEcef, ecefToGeodetic, toRadians } from './orbitalUtils';

export interface TLEData {
  satelliteName: string;
  line1: string;
  line2: string;
  parsed: {
    inclination: number;
    raan: number;
    eccentricity: number;
    argOfPerigee: number;
    meanAnomaly: number;
    meanMotion: number;
    epochYear: number;
    epochDay: number;
    altitude: number;
    semiMajorAxis: number;
  };
}

const EARTH_MU = 398600.4418; // Earth's gravitational parameter (km³/s²)
const EARTH_RADIUS = 6371; // Earth's radius (km)

/**
 * Parse TLE string into orbital elements
 */
export function parseTLE(tleString: string): TLEData | null {
  const lines = tleString.trim().split('\n').map(line => line.trim());
  
  if (lines.length < 3) {
    throw new Error('TLE must contain satellite name and two data lines');
  }

  const satelliteName = lines[0];
  const line1 = lines[1];
  const line2 = lines[2];

  // Validate line format
  if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
    throw new Error('Invalid TLE format - lines must start with "1 " and "2 "');
  }

  try {
    // Parse Line 1
    const epochYear = parseInt(line1.substring(18, 20));
    const epochDay = parseFloat(line1.substring(20, 32));
    
    // Parse Line 2
    const inclinationStr = line2.substring(8, 16).trim();
    const raanStr = line2.substring(17, 25).trim();
    const eccentricityStr = '0.' + line2.substring(26, 33).trim();
    const argOfPerigeeStr = line2.substring(34, 42).trim();
    const meanAnomalyStr = line2.substring(43, 51).trim();
    const meanMotionStr = line2.substring(52, 63).trim();
    
    console.log('TLE Line 2:', line2);
    console.log('RAAN substring (17-25):', `"${raanStr}"`);
    console.log('RAAN parsed:', parseFloat(raanStr));
    
    const inclination = parseFloat(inclinationStr);
    const raan = parseFloat(raanStr);
    const eccentricity = parseFloat(eccentricityStr);
    const argOfPerigee = parseFloat(argOfPerigeeStr);
    const meanAnomaly = parseFloat(meanAnomalyStr);
    const meanMotion = parseFloat(meanMotionStr); // revolutions per day

    // Calculate semi-major axis and altitude
    const meanMotionRadPerSec = (meanMotion * 2 * Math.PI) / (24 * 3600); // rad/s
    const semiMajorAxis = Math.pow(EARTH_MU / (meanMotionRadPerSec * meanMotionRadPerSec), 1/3);
    const altitude = semiMajorAxis - EARTH_RADIUS;

    return {
      satelliteName,
      line1,
      line2,
      parsed: {
        inclination,
        raan,
        eccentricity,
        argOfPerigee,
        meanAnomaly,
        meanMotion,
        epochYear: epochYear < 57 ? 2000 + epochYear : 1900 + epochYear,
        epochDay,
        altitude,
        semiMajorAxis
      }
    };
  } catch (error) {
    throw new Error(`Failed to parse TLE: ${error.message}`);
  }
}

/**
 * Calculate LTAN from orbital elements
 */
export function calculateLTAN(raan: number, epochYear: number, epochDay: number): string {
  // Simplified LTAN calculation for SSO satellites
  // Convert RAAN to local solar time approximation
  const ltanHours = ((raan + 180) % 360) / 15;
  const hours = Math.floor(ltanHours);
  const minutes = Math.floor((ltanHours - hours) * 60);
  
  // Map to available LTAN options in the form
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Return closest available option
  const availableOptions = ["06:00", "09:30", "10:30", "13:30"];
  const targetTime = hours + minutes / 60;
  const availableTimes = [6.0, 9.5, 10.5, 13.5];
  
  let closestIndex = 0;
  let minDiff = Math.abs(targetTime - availableTimes[0]);
  
  for (let i = 1; i < availableTimes.length; i++) {
    const diff = Math.abs(targetTime - availableTimes[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }
  
  return availableOptions[closestIndex];
}

/**
 * Calculate sub-satellite point longitude for GEO orbit
 * This calculates the actual longitude where the satellite appears above Earth's surface
 * by using proper coordinate transformations from ECI to ECEF to geodetic coordinates
 */
export function calculateGEOLongitude(raan: number, argOfPerigee: number, meanAnomaly: number, altitude: number = 35786, epochYear?: number, epochDay?: number): number {
  // Constants for GEO orbit
  const EARTH_RADIUS = 6371; // km
  const semiMajorAxis = EARTH_RADIUS + altitude;
  
  // Convert orbital elements to radians
  const inclinationRad = toRadians(0); // GEO satellites are typically equatorial
  const raanRad = toRadians(raan);
  const argOfPerigeeRad = toRadians(argOfPerigee);
  const meanAnomalyRad = toRadians(meanAnomaly);
  
  // Calculate satellite position in ECI coordinates using proper orbital mechanics
  const eciPosition = calculateSatelliteECIPosition(
    semiMajorAxis,
    0, // eccentricity (circular orbit for GEO)
    inclinationRad,
    raanRad,
    argOfPerigeeRad,
    meanAnomalyRad // For circular orbits, mean anomaly ≈ true anomaly
  );
  
  // Convert ECI to ECEF with proper Earth rotation for actual TLE epoch
  // Parse TLE epoch time and calculate GMST referenced to J2000
  const j2000Epoch = new Date('2000-01-01T12:00:00.000Z');
  
  // Convert TLE epoch to actual date (use default current time if epoch not provided)
  let tleEpochDate: Date;
  if (epochYear && epochDay) {
    tleEpochDate = new Date(epochYear, 0, 1); // Start of year
    tleEpochDate.setTime(tleEpochDate.getTime() + (epochDay - 1) * 24 * 60 * 60 * 1000); // Add days
  } else {
    tleEpochDate = new Date(); // Fallback to current time
  }
  
  const minutesSinceJ2000 = (tleEpochDate.getTime() - j2000Epoch.getTime()) / (1000 * 60);
  const earthRotationRate = 360 / (24 * 60); // degrees per minute (sidereal day ≈ solar day for approximation)
  const earthRotationRateRadPerMin = toRadians(earthRotationRate);
  const earthRotationAngle = earthRotationRateRadPerMin * minutesSinceJ2000;
  const ecefPosition = eciToEcef(eciPosition, earthRotationAngle);
  
  // Convert ECEF to geodetic coordinates to get the sub-satellite point
  const geodetic = ecefToGeodetic(ecefPosition[0], ecefPosition[1], ecefPosition[2]);
  
  console.log('GEO sub-satellite point calculation:', {
    inputOrbitElements: { raan, argOfPerigee, meanAnomaly, altitude },
    eciPosition,
    ecefPosition,
    geodeticResult: geodetic,
    subSatelliteLongitude: geodetic.lng
  });
  
  return geodetic.lng;
}