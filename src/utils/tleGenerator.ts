/**
 * TLE (Two-Line Element) Generator
 * Generates TLE strings from orbital parameters for use with SGP4 propagation
 */

interface OrbitalElements {
  altitude: number;      // km
  inclination: number;   // degrees
  raan: number;         // degrees (Right Ascension of Ascending Node)
  trueAnomaly: number;  // degrees
  eccentricity?: number; // default 0.0
  argOfPerigee?: number; // degrees, default 0.0
  epochYear?: number;    // default current year
  epochDay?: number;     // default current day of year
  satelliteNumber?: number; // default random
  classification?: string;  // default 'U' (unclassified)
  intlDesignator?: string;  // default '99999A'
  bstar?: number;          // default 0.0
  ephemerisType?: number;  // default 0
  elementNumber?: number;  // default 999
}

/**
 * Calculate checksum for TLE line
 */
function calculateChecksum(line: string): number {
  let sum = 0;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char >= '0' && char <= '9') {
      sum += parseInt(char);
    } else if (char === '-') {
      sum += 1;
    }
  }
  return sum % 10;
}

/**
 * Format number to fixed width with leading zeros
 */
function formatFixed(value: number, width: number, decimals: number = 0): string {
  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toString();
  return formatted.padStart(width, '0');
}

/**
 * Format angle to ensure it's in [0, 360) range
 */
function normalizeAngle(angle: number): number {
  while (angle < 0) angle += 360;
  while (angle >= 360) angle -= 360;
  return angle;
}

/**
 * Calculate mean motion from semi-major axis
 */
function calculateMeanMotion(altitude: number): number {
  const earthRadius = 6378.137; // km
  const mu = 398600.4418; // km³/s² - Earth's gravitational parameter
  const semiMajorAxis = earthRadius + altitude;
  const meanMotion = Math.sqrt(mu / Math.pow(semiMajorAxis, 3)) * 86400 / (2 * Math.PI); // revolutions per day
  return meanMotion;
}

/**
 * Convert true anomaly to mean anomaly (assuming circular orbit)
 */
function trueToMeanAnomaly(trueAnomaly: number, eccentricity: number = 0): number {
  if (eccentricity === 0) {
    return trueAnomaly; // For circular orbits, true anomaly = mean anomaly
  }
  
  // For elliptical orbits, convert through eccentric anomaly
  const trueAnomalyRad = trueAnomaly * Math.PI / 180;
  const eccentricAnomaly = 2 * Math.atan(Math.sqrt((1 - eccentricity) / (1 + eccentricity)) * Math.tan(trueAnomalyRad / 2));
  const meanAnomaly = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly);
  return (meanAnomaly * 180 / Math.PI) % 360;
}

/**
 * Get current epoch year and day
 */
function getCurrentEpoch(): { year: number, day: number } {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const dayFraction = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
  return { year: year % 100, day: dayOfYear + dayFraction };
}

/**
 * Generate TLE from orbital elements
 */
export function generateTLE(elements: OrbitalElements): string {
  const {
    altitude,
    inclination,
    raan,
    trueAnomaly,
    eccentricity = 0.0,
    argOfPerigee = 0.0,
    satelliteNumber = Math.floor(Math.random() * 90000) + 10000,
    classification = 'U',
    intlDesignator = '99999A',
    bstar = 0.0,
    ephemerisType = 0,
    elementNumber = 999
  } = elements;

  const epoch = getCurrentEpoch();
  const epochYear = elements.epochYear ?? epoch.year;
  const epochDay = elements.epochDay ?? epoch.day;

  // Calculate derived parameters
  const meanMotion = calculateMeanMotion(altitude);
  const meanAnomaly = trueToMeanAnomaly(trueAnomaly, eccentricity);

  // Normalize angles
  const normInclination = normalizeAngle(inclination);
  const normRaan = normalizeAngle(raan);
  const normArgPerigee = normalizeAngle(argOfPerigee);
  const normMeanAnomaly = normalizeAngle(meanAnomaly);

  // Build Line 1
  let line1 = '1 ';
  line1 += formatFixed(satelliteNumber, 5);
  line1 += classification;
  line1 += ' ';
  line1 += intlDesignator.padEnd(8);
  line1 += ' ';
  line1 += formatFixed(epochYear, 2);
  line1 += formatFixed(epochDay, 12, 8);
  line1 += ' ';
  line1 += ' .00000000'; // First derivative of mean motion (assuming 0)
  line1 += '  00000-0'; // Second derivative of mean motion (assuming 0)
  line1 += ' ';
  line1 += bstar.toExponential(4).replace('e', '').replace('+', '').replace('-', '-').padStart(8, '0');
  line1 += ' ';
  line1 += ephemerisType.toString();
  line1 += ' ';
  line1 += formatFixed(elementNumber, 4);

  // Calculate and append checksum
  const checksum1 = calculateChecksum(line1);
  line1 += checksum1.toString();

  // Build Line 2
  let line2 = '2 ';
  line2 += formatFixed(satelliteNumber, 5);
  line2 += ' ';
  line2 += formatFixed(normInclination, 8, 4);
  line2 += ' ';
  line2 += formatFixed(normRaan, 8, 4);
  line2 += ' ';
  line2 += formatFixed(eccentricity, 7, 7).replace('0.', '');
  line2 += ' ';
  line2 += formatFixed(normArgPerigee, 8, 4);
  line2 += ' ';
  line2 += formatFixed(normMeanAnomaly, 8, 4);
  line2 += ' ';
  line2 += formatFixed(meanMotion, 11, 8);

  // Calculate revolution number (assuming 0 for new satellite)
  line2 += formatFixed(0, 5);

  // Calculate and append checksum
  const checksum2 = calculateChecksum(line2);
  line2 += checksum2.toString();

  // Generate satellite name
  const satelliteName = `Generated Sat ${satelliteNumber}`;

  return `${satelliteName}\n${line1}\n${line2}`;
}