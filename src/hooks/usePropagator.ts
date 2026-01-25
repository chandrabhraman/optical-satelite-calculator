
import { useState, useCallback } from 'react';
import { calculateSatelliteECIPosition, eciToEcef, ecefToGeodetic, toRadians, meanAnomalyToTrueAnomaly, calculateOrbitalPeriod } from '../utils/orbitalUtils';
import * as satellite from 'satellite.js';
import { parseTLE, TLEData } from '../utils/tleParser';
import { tleToLatLon } from '../utils/tleToLatLon';

// Define interfaces for our propagator
interface SatelliteParams {
  altitude: number;
  inclination: number;
  raan: number;
  trueAnomaly: number;
  eccentricity?: number;
  argOfPerigee?: number;
  meanAnomaly?: number;
  tle?: string;
  tleData?: TLEData;
}

interface PropagationParams {
  tle: string;
  timeSpanHours: number;
  startDate?: Date;
  endDate?: Date;
}

interface RevisitCalculationParams {
  satellites: SatelliteParams[];
  timeSpanHours: number;
  gridResolution: number;
  startDate?: Date;
  endDate?: Date;
  onlyDaytimeRevisit?: boolean;
  localDaytimeStart?: number; // 24h format e.g. 1000 for 10:00 AM
  localDaytimeEnd?: number;   // 24h format e.g. 1700 for 5:00 PM
}

interface GroundTrackPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

interface RevisitData {
  grid: number[][];
  maxCount: number;
  statistics: {
    totalCells: number;
    coveredCells: number;
    coverage: number;
    minRevisits: number;
    maxRevisits: number;
    averageRevisits: number;
    averageRevisitTime: number;
    maxGap: number;
    minRevisitTime: number;
  };
}

/**
 * Hook for satellite orbit propagation using real orbital mechanics
 * This implementation uses classical orbital mechanics calculations
 * based on Kepler's laws for accurate orbit propagation
 */
export function usePropagator() {
  const [isInitialized, setIsInitialized] = useState(true);

  // Real orbital mechanics calculations using SGP4 only for revisit analysis
  const propagateSatelliteOrbit = useCallback((params: PropagationParams): GroundTrackPoint[] => {
    const { timeSpanHours, tle, startDate, endDate } = params;
    
    // Number of points to generate based on time span
    const totalMinutes = timeSpanHours * 60;
    const numPoints = Math.min(2000, Math.max(200, Math.floor(totalMinutes * 2)));
    
    // Only use SGP4 for revisit analysis - TLE is required
    if (!tle) {
      console.error('TLE is required for revisit analysis. Classical mechanics propagation has been removed.');
      return [];
    }
    
    return propagateWithSGP4(tle, timeSpanHours, numPoints, startDate, endDate);
  }, []);

  // SGP4 propagation for TLE inputs
  const propagateWithSGP4 = useCallback((tle: string, timeSpanHours: number, numPoints: number, startDate?: Date, endDate?: Date): GroundTrackPoint[] => {
    const points: GroundTrackPoint[] = [];
    
    try {
  const tleLines = tle.trim().split('\n');
  if (tleLines.length === 3) {
    // 3-line TLE format: satellite name + 2 data lines
    tleLines.splice(0, 1); // Remove satellite name, keep only the 2 data lines
  }
  if (tleLines.length !== 2) {
    throw new Error('TLE must have exactly 2 or 3 lines (satellite name optional)');
  }
      
      // Initialize SGP4 with TLE
      const satrec = satellite.twoline2satrec(tleLines[0], tleLines[1]);
      const totalMinutes = timeSpanHours * 60;
      
      // Determine simulation start time
      const simulationStartTime = startDate ? startDate.getTime() : Date.now();
      
      // Parse TLE to get reference position at epoch using tleToLatLon utility
      let tleEpochReference = null;
      try {
        const tleData = parseTLE(tle);
        if (tleData) {
          tleEpochReference = tleToLatLon({
            epoch_year: tleData.parsed.epochYear,
            epoch_day: tleData.parsed.epochDay,
            i: tleData.parsed.inclination,
            raan: tleData.parsed.raan,
            e: tleData.parsed.eccentricity,
            argp: tleData.parsed.argOfPerigee,
            m_anomaly: tleData.parsed.meanAnomaly,
            n: tleData.parsed.meanMotion
          });
        }
      } catch (error) {
        console.warn('Could not calculate TLE epoch reference:', error);
      }

      // Calculate TLE epoch date for reference
      const tleEpochYear = satrec.epochyr < 57 ? 2000 + satrec.epochyr : 1900 + satrec.epochyr;
      const tleEpochMs = new Date(tleEpochYear, 0, 1).getTime() + (satrec.epochdays - 1) * 24 * 60 * 60 * 1000;
      const tleEpochDate = new Date(tleEpochMs);

      console.log('SGP4 propagation params:', {
        timeSpanHours,
        numPoints,
        startDate,
        endDate,
        simulationStartTime: new Date(simulationStartTime),
        tleEpochDate,
        tleEpochReference,
        timeDiffFromEpoch: (simulationStartTime - tleEpochMs) / (1000 * 60 * 60 * 24), // days
        satrec: {
          epochyr: satrec.epochyr,
          epochdays: satrec.epochdays,
          inclo: satrec.inclo * 180 / Math.PI,
          nodeo: satrec.nodeo * 180 / Math.PI,
          ecco: satrec.ecco
        }
      });
      
      // Generate ground track points over time
      for (let i = 0; i < numPoints; i++) {
        const timeMinutes = (i * totalMinutes) / numPoints;
        const timestamp = simulationStartTime + (timeMinutes * 60 * 1000);
        
        // Propagate satellite position using SGP4
        const positionAndVelocity = satellite.propagate(satrec, new Date(timestamp));
        
        if (positionAndVelocity.position && typeof positionAndVelocity.position === 'object') {
          const position = positionAndVelocity.position as { x: number; y: number; z: number };
          
          // Convert ECI position to geodetic coordinates
          const gmst = satellite.gstime(new Date(timestamp));
          const geodetic = satellite.eciToGeodetic(position, gmst);
          
          // Convert from radians to degrees and normalize longitude
          let lng = satellite.degreesLong(geodetic.longitude);
          let lat = satellite.degreesLat(geodetic.latitude);
          
          // Normalize longitude to [-180, 180] range
          while (lng > 180) lng -= 360;
          while (lng < -180) lng += 360;
          
          points.push({
            lat,
            lng,
            timestamp
          });
          
          // Debug logging for first few points and special cases
          if (i < 10 || Math.abs(lng - 122) < 50) {
            console.log(`SGP4 Point ${i}:`, {
              timeMinutes,
              timestamp: new Date(timestamp),
              position,
              gmst: gmst * 180 / Math.PI,
              rawLng: satellite.degreesLong(geodetic.longitude),
              rawLat: satellite.degreesLat(geodetic.latitude),
              geodetic: { lat, lng, altitude: geodetic.height }
            });
          }
        }
      }
      
    } catch (error) {
      console.error('SGP4 propagation error:', error);
      return [];
    }
    
    return points;
  }, []);


  // Calculate revisit statistics for a grid covering Earth's surface
  const calculateRevisits = useCallback((params: RevisitCalculationParams): RevisitData => {
    const { satellites, timeSpanHours, gridResolution, onlyDaytimeRevisit, localDaytimeStart, localDaytimeEnd } = params;
    
    // Initialize global grid (latitude × longitude)
    // gridResolution is in degrees, so calculate number of cells needed
    const latCells = Math.ceil(180 / gridResolution); // Number of latitude cells for global coverage
    const lngCells = Math.ceil(360 / gridResolution); // Number of longitude cells for global coverage
    const grid: number[][] = Array(latCells).fill(0).map(() => Array(lngCells).fill(0));
    
    // Sensor parameters
    const sensorFOV = 10; // degrees - half angle of sensor field of view
    
    // Helper function to check if a timestamp is within local daytime at a given longitude
    const isLocalDaytime = (timestamp: number, longitude: number): boolean => {
      if (!onlyDaytimeRevisit) return true;
      
      const startTime = localDaytimeStart ?? 1000;
      const endTime = localDaytimeEnd ?? 1700;
      
      // Convert timestamp to Date and get UTC hours/minutes
      const date = new Date(timestamp);
      const utcHours = date.getUTCHours();
      const utcMinutes = date.getUTCMinutes();
      
      // Calculate local time offset from longitude (15 degrees = 1 hour)
      const localOffsetHours = longitude / 15;
      
      // Calculate local time in decimal hours
      let localDecimalHours = utcHours + utcMinutes / 60 + localOffsetHours;
      
      // Normalize to 0-24 range
      while (localDecimalHours < 0) localDecimalHours += 24;
      while (localDecimalHours >= 24) localDecimalHours -= 24;
      
      // Convert to 24h format (e.g., 1030 for 10:30)
      const localTimeFormatted = Math.floor(localDecimalHours) * 100 + Math.round((localDecimalHours % 1) * 60);
      
      // Check if within daytime range
      return localTimeFormatted >= startTime && localTimeFormatted <= endTime;
    };
    
    // Process each satellite in the constellation
    for (const satellite of satellites) {
      if (!satellite.tle) {
        console.error(`TLE is required for satellite propagation. Classical mechanics removed.`);
        continue;
      }
      
      // Propagate satellite orbit using SGP4 for the specified time span
      const groundTrack = propagateSatelliteOrbit({
        tle: satellite.tle,
        timeSpanHours,
        startDate: params.startDate,
        endDate: params.endDate
      });
      
      // For each consecutive pair of points, interpolate coverage along the track
      for (let i = 0; i < groundTrack.length; i++) {
        const point = groundTrack[i];
        const nextPoint = groundTrack[i + 1];
        
        // Skip this point if daytime filter is enabled and it's not daytime at this location
        if (onlyDaytimeRevisit && !isLocalDaytime(point.timestamp, point.lng)) {
          continue;
        }
        
        // Calculate sensor swath width based on altitude and FOV (120 km total swath width)
        const swathHalfWidth = 60 / 111; // 60 km = half of 120 km swath, converted to degrees
        
        // Generate coverage points along the ground track segment
        const segmentPoints = nextPoint ? 
          interpolateGroundTrackSegment(point, nextPoint, swathHalfWidth) : 
          [{ lat: point.lat, lng: point.lng, swathHalfWidth }];
        
        // Apply coverage for each interpolated point
        for (const coveragePoint of segmentPoints) {
          // Determine geographic bounds of sensor coverage
          const minLat = Math.max(-90, coveragePoint.lat - coveragePoint.swathHalfWidth);
          const maxLat = Math.min(90, coveragePoint.lat + coveragePoint.swathHalfWidth);
          const latCosine = Math.cos(coveragePoint.lat * Math.PI / 180);
          const minLng = coveragePoint.lng - coveragePoint.swathHalfWidth / Math.max(0.1, latCosine);
          const maxLng = coveragePoint.lng + coveragePoint.swathHalfWidth / Math.max(0.1, latCosine);
          
          // Convert geographic bounds to grid cell indices
          const minLatIndex = Math.max(0, Math.floor((90 - maxLat) * (latCells / 180)));
          const maxLatIndex = Math.min(latCells - 1, Math.floor((90 - minLat) * (latCells / 180)));
          
          // Handle longitude wrapping around 180/-180 boundary
          let minLngIndex = Math.floor((minLng + 180) * (lngCells / 360));
          let maxLngIndex = Math.floor((maxLng + 180) * (lngCells / 360));
          
          // Increment revisit count for all grid cells within sensor swath
          for (let latIdx = minLatIndex; latIdx <= maxLatIndex; latIdx++) {
            if (minLngIndex <= maxLngIndex) {
              // Normal case: no longitude wrapping
              for (let lngIdx = Math.max(0, minLngIndex); lngIdx <= Math.min(lngCells - 1, maxLngIndex); lngIdx++) {
                grid[latIdx][lngIdx]++;
              }
            } else {
              // Handle longitude wrapping around the date line
              for (let lngIdx = Math.max(0, minLngIndex); lngIdx < lngCells; lngIdx++) {
                grid[latIdx][lngIdx]++;
              }
              for (let lngIdx = 0; lngIdx <= Math.min(lngCells - 1, maxLngIndex); lngIdx++) {
                grid[latIdx][lngIdx]++;
              }
            }
          }
        }
      }
    }
    
    // Calculate comprehensive statistics from the grid
    let maxCount = 0;
    let minCount = Number.MAX_SAFE_INTEGER;
    let totalRevisits = 0;
    let coveredCells = 0;
    const totalCells = latCells * lngCells;
    
    for (let i = 0; i < latCells; i++) {
      for (let j = 0; j < lngCells; j++) {
        const cellCount = grid[i][j];
        if (cellCount > 0) {
          coveredCells++;
          totalRevisits += cellCount;
          if (cellCount > maxCount) {
            maxCount = cellCount;
          }
          if (cellCount < minCount) {
            minCount = cellCount;
          }
        }
      }
    }
    
    // If no cells covered, set minCount to 0
    if (coveredCells === 0) {
      minCount = 0;
    }
    
    // Calculate time-based statistics
    const coverage = (coveredCells / totalCells) * 100;
    const averageRevisits = coveredCells > 0 ? totalRevisits / coveredCells : 0;
    
    console.log('Debug stats:', { timeSpanHours, averageRevisits, maxCount, minCount, totalRevisits, coveredCells, totalCells, latCells, lngCells, gridResolution });
    
    // Calculate time statistics based on revisit counts and time span
    // Collect revisit times for all cells with more than 1 revisit
    const revisitTimes: number[] = [];
    
    for (let i = 0; i < latCells; i++) {
      for (let j = 0; j < lngCells; j++) {
        const cellCount = grid[i][j];
        if (cellCount > 1) {
          // Time between revisits for this cell
          const timeBetweenRevisits = timeSpanHours / (cellCount - 1);
          revisitTimes.push(timeBetweenRevisits);
        }
      }
    }
    
    // Calculate statistics from revisit times
    const averageRevisitTime = averageRevisits > 0 ? timeSpanHours / averageRevisits : timeSpanHours;
    
    const minRevisitTime = revisitTimes.length > 0 ? 
      Math.min(...revisitTimes) : 
      timeSpanHours;
      
    const maxGap = revisitTimes.length > 0 ? 
      Math.max(...revisitTimes) : 
      timeSpanHours;
    
     console.log('Calculated times:', { averageRevisitTime, minRevisitTime, maxGap });
     
     // Debug the formatting issue
     console.log('Before formatting:', { 
       averageRevisitTime, 
       formatted: parseFloat(averageRevisitTime.toFixed(2)),
       minRevisitTime,
       minFormatted: parseFloat(minRevisitTime.toFixed(2)),
       maxGap,
       maxFormatted: parseFloat(maxGap.toFixed(2))
     });
     
     const statistics = {
       totalCells,
       coveredCells,
       coverage: parseFloat(coverage.toFixed(1)),
       minRevisits: minCount,
       maxRevisits: maxCount,
       averageRevisits: parseFloat(averageRevisits.toFixed(1)),
       averageRevisitTime, // Use raw value instead of formatted
       maxGap, // Use raw value instead of formatted
       minRevisitTime, // Use raw value instead of formatted
       timeSpanHours
     };
    
    return { grid, maxCount, statistics };
  }, [propagateSatelliteOrbit]);

  // Helper function to interpolate coverage points between ground track points
  const interpolateGroundTrackSegment = useCallback((
    point1: GroundTrackPoint, 
    point2: GroundTrackPoint, 
    swathHalfWidth: number
  ) => {
    const points = [];
    const steps = 5; // Interpolate 5 points between each ground track point for continuous coverage
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = point1.lat + t * (point2.lat - point1.lat);
      let lng = point1.lng + t * (point2.lng - point1.lng);
      
      // Handle longitude wrapping around 180/-180 boundary
      if (Math.abs(point2.lng - point1.lng) > 180) {
        if (point2.lng > point1.lng) {
          lng = point1.lng + t * (point2.lng - 360 - point1.lng);
        } else {
          lng = point1.lng + t * (point2.lng + 360 - point1.lng);
        }
      }
      
      // Normalize longitude to [-180, 180] range
      while (lng > 180) lng -= 360;
      while (lng < -180) lng += 360;
      
      points.push({ lat, lng, swathHalfWidth });
    }
    
    return points;
  }, []);

  return {
    propagateSatelliteOrbit,
    calculateRevisits,
    isOrekitInitialized: isInitialized // Keep this for compatibility
  };
}
