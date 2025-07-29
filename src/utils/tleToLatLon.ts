/**
 * TLE to Latitude/Longitude conversion following the exact Python script logic
 * This implementation matches the reference Python script for accurate orbital calculations
 */

// Constants
const MU = 398600.4418; // km^3/s^2, Earth's gravitational parameter
const A_EARTH = 6378.137; // km, Earth's equatorial radius (WGS-84)
const F = 1/298.257223563; // WGS-84 flattening
const E_EARTH_SQ = F * (2 - F); // Earth eccentricity squared

interface TLEElements {
  epoch_year: number;
  epoch_day: number;
  i: number; // inclination [deg]
  raan: number; // right ascension of ascending node [deg]
  e: number; // eccentricity
  argp: number; // argument of perigee [deg]
  m_anomaly: number; // mean anomaly [deg]
  n: number; // mean motion [rev/day]
}

/**
 * Convert mean motion to semi-major axis
 */
function meanMotionToSMA(n: number): number {
  const n_rad = n * 2 * Math.PI / 86400; // rev/day -> rad/s
  const a = Math.pow(MU / (n_rad * n_rad), 1/3);
  console.log(`Semi-major axis (a): ${a.toFixed(3)} km`);
  return a;
}

/**
 * Solve Kepler's equation using Newton-Raphson method
 */
function solveKepler(M: number, e: number, tol: number = 1e-8): number {
  // Initial guess
  let E = e < 0.8 ? M : Math.PI;
  
  for (let i = 0; i < 100; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tol) break;
  }
  
  console.log(`Eccentric anomaly (E): ${(E * 180 / Math.PI).toFixed(6)} deg`);
  return E;
}

/**
 * Convert eccentric anomaly to true anomaly
 */
function eccentricToTrue(E: number, e: number): number {
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E/2),
    Math.sqrt(1 - e) * Math.cos(E/2)
  );
  console.log(`True anomaly (nu): ${(nu * 180 / Math.PI).toFixed(6)} deg`);
  return nu;
}

/**
 * Calculate Julian Date from year and day
 */
function julianDate(year: number, day: number): number {
  const date = new Date(year, 0, 1); // Start of year
  date.setTime(date.getTime() + (day - 1) * 24 * 60 * 60 * 1000); // Add days
  
  const Y = date.getFullYear();
  let M = date.getMonth() + 1;
  const D = date.getDate() + (date.getHours() + (date.getMinutes() + date.getSeconds()/60)/60)/24;
  
  let year_adj = Y;
  if (M <= 2) {
    year_adj -= 1;
    M += 12;
  }
  
  const A = Math.floor(year_adj / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (year_adj + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
  
  return JD;
}

/**
 * Calculate GMST from Julian Date
 */
function gmstFromJD(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  let GMST = 280.46061837 + 360.98564736629 * (jd - 2451545) + 
             0.000387933 * T * T - T * T * T / 38710000.0;
  GMST = GMST % 360.0;
  if (GMST < 0) GMST += 360.0;
  
  console.log(`GMST: ${GMST.toFixed(6)} deg`);
  return GMST * Math.PI / 180; // Convert to radians
}

/**
 * Transform perifocal to ECI coordinates
 */
function perifocalToECI(r: number[], omega: number, i: number, RAAN: number): number[] {
  const cosO = Math.cos(RAAN);
  const sinO = Math.sin(RAAN);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);
  const cosw = Math.cos(omega);
  const sinw = Math.sin(omega);
  
  // Rotation matrix: perifocal to ECI
  const R = [
    [cosO*cosw - sinO*sinw*cosi, -cosO*sinw - sinO*cosw*cosi, sinO*sini],
    [sinO*cosw + cosO*sinw*cosi, -sinO*sinw + cosO*cosw*cosi, -cosO*sini],
    [sinw*sini, cosw*sini, cosi]
  ];
  
  const r_eci = [
    R[0][0]*r[0] + R[0][1]*r[1] + R[0][2]*r[2],
    R[1][0]*r[0] + R[1][1]*r[1] + R[1][2]*r[2],
    R[2][0]*r[0] + R[2][1]*r[1] + R[2][2]*r[2]
  ];
  
  console.log(`ECI position (km): [${r_eci.map(v => v.toFixed(3)).join(', ')}]`);
  return r_eci;
}

/**
 * Rotate vector around Z-axis
 */
function rotateZ(vec: number[], theta: number): number[] {
  const cos_t = Math.cos(theta);
  const sin_t = Math.sin(theta);
  
  return [
    cos_t * vec[0] - sin_t * vec[1],
    sin_t * vec[0] + cos_t * vec[1],
    vec[2]
  ];
}

/**
 * Convert ECEF to geodetic latitude, longitude, height
 */
function ecefToLLH(r_ecef: number[]): { lat: number, lon: number, h: number } {
  const [x, y, z] = r_ecef;
  const p = Math.sqrt(x*x + y*y);
  let lon = Math.atan2(y, x);
  let lat = Math.atan2(z, p * (1 - E_EARTH_SQ)); // first approximation
  
  // Iterate to improve latitude calculation
  for (let i = 0; i < 5; i++) {
    const N = A_EARTH / Math.sqrt(1 - E_EARTH_SQ * Math.sin(lat) * Math.sin(lat));
    const h = p / Math.cos(lat) - N;
    lat = Math.atan2(z, p * (1 - E_EARTH_SQ * N / (N + h)));
  }
  
  const N = A_EARTH / Math.sqrt(1 - E_EARTH_SQ * Math.sin(lat) * Math.sin(lat));
  const h = p / Math.cos(lat) - N;
  
  const lat_deg = lat * 180 / Math.PI;
  const lon_deg = lon * 180 / Math.PI;
  
  console.log(`Longitude (deg): ${lon_deg.toFixed(6)}`);
  console.log(`Latitude (deg): ${lat_deg.toFixed(6)}`);
  console.log(`Altitude (km): ${h.toFixed(6)}`);
  
  return { lat: lat_deg, lon: lon_deg, h };
}

/**
 * Convert TLE to latitude, longitude, height at TLE epoch
 * Following the exact Python script logic
 */
export function tleToLatLon(elements: TLEElements): { lat: number, lon: number, h: number } {
  console.log("=== Parsing TLE ===");
  console.log(elements);
  
  console.log("\n=== Orbital Elements ===");
  const a = meanMotionToSMA(elements.n);
  const e = elements.e;
  const i = elements.i * Math.PI / 180; // Convert to radians
  const RAAN = elements.raan * Math.PI / 180;
  const argp = elements.argp * Math.PI / 180;
  const M = elements.m_anomaly * Math.PI / 180;
  
  console.log(`Inclination (i): ${elements.i} deg = ${i} rad`);
  console.log(`RAAN (Omega): ${elements.raan} deg = ${RAAN} rad`);
  console.log(`Argument of perigee (omega): ${elements.argp} deg = ${argp} rad`);
  console.log(`Eccentricity (e): ${e}`);
  console.log(`Mean anomaly (M): ${elements.m_anomaly} deg = ${M} rad`);

  console.log("\n=== Solve Kepler's Equation ===");
  const E = solveKepler(M, e);
  
  console.log("\n=== Compute True Anomaly ===");
  const nu = eccentricToTrue(E, e);

  console.log("\n=== Compute Position in Orbital Plane ===");
  const r_orbit = [
    a * (Math.cos(E) - e),
    a * Math.sqrt(1 - e*e) * Math.sin(E),
    0
  ];
  console.log(`Perifocal position vector (km): [${r_orbit.map(v => v.toFixed(3)).join(', ')}]`);

  console.log("\n=== Orbital Plane to ECI ===");
  const r_eci = perifocalToECI(r_orbit, argp, i, RAAN);

  console.log("\n=== GMST Calculation ===");
  const jd = julianDate(elements.epoch_year, elements.epoch_day);
  console.log(`Julian Date: ${jd}`);
  const gmst = gmstFromJD(jd);

  console.log("\n=== ECI to ECEF ===");
  const r_ecef = rotateZ(r_eci, -gmst);
  console.log(`ECEF position (km): [${r_ecef.map(v => v.toFixed(3)).join(', ')}]`);

  console.log("\n=== ECEF to Geodetic Latitude/Longitude/Altitude ===");
  const result = ecefToLLH(r_ecef);
  
  console.log("\n=== Final Output ===");
  console.log(`Latitude:  ${result.lat.toFixed(6)} deg`);
  console.log(`Longitude: ${result.lon.toFixed(6)} deg`);
  console.log(`Altitude:  ${result.h.toFixed(3)} km`);
  
  return result;
}