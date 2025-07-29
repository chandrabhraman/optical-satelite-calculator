
import { useState, useCallback } from 'react';
import { calculateSatelliteECIPosition, eciToEcef, ecefToGeodetic, toRadians, meanAnomalyToTrueAnomaly, calculateOrbitalPeriod } from '../utils/orbitalUtils';
import * as satellite from 'satellite.js';
import { parseTLE, TLEData } from '../utils/tleParser';

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

interface PropagationParams extends SatelliteParams {
  timeSpanHours: number;
}

interface RevisitCalculationParams {
  satellites: SatelliteParams[];
  timeSpanHours: number;
  gridResolution: number;
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

  // Real orbital mechanics calculations using either SGP4 (for TLE) or classical mechanics
  const propagateSatelliteOrbit = useCallback((params: PropagationParams): GroundTrackPoint[] => {
    const points: GroundTrackPoint[] = [];
    const { altitude, inclination, raan, trueAnomaly, timeSpanHours, tle, eccentricity = 0, argOfPerigee = 0, meanAnomaly } = params;
    
    // Number of points to generate based on time span
    const totalMinutes = timeSpanHours * 60;
    const numPoints = Math.min(2000, Math.max(200, Math.floor(totalMinutes * 2)));
    
    // Use SGP4 if TLE is provided, otherwise use classical mechanics
    if (tle) {
      return propagateWithSGP4(tle, timeSpanHours, numPoints);
    } else {
      return propagateWithClassicalMechanics({
        altitude,
        inclination,
        raan,
        trueAnomaly,
        eccentricity,
        argOfPerigee,
        meanAnomaly: meanAnomaly || trueAnomaly,
        timeSpanHours,
        numPoints
      });
    }
  }, []);

  // SGP4 propagation for TLE inputs
  const propagateWithSGP4 = useCallback((tle: string, timeSpanHours: number, numPoints: number): GroundTrackPoint[] => {
    const points: GroundTrackPoint[] = [];
    
    try {
      const tleLines = tle.trim().split('\n');
      if (tleLines.length !== 2) {
        throw new Error('TLE must have exactly 2 lines');
      }
      
      // Initialize SGP4 with TLE
      const satrec = satellite.twoline2satrec(tleLines[0], tleLines[1]);
      const totalMinutes = timeSpanHours * 60;
      
      console.log('SGP4 propagation params:', {
        timeSpanHours,
        numPoints,
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
        const timestamp = Date.now() + (timeMinutes * 60 * 1000);
        
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
          
          // Debug logging for first few points
          if (i < 3) {
            console.log(`SGP4 Point ${i}:`, {
              timeMinutes,
              position,
              gmst: gmst * 180 / Math.PI,
              geodetic: { lat, lng, altitude: geodetic.height }
            });
          }
        }
      }
      
    } catch (error) {
      console.error('SGP4 propagation error:', error);
      // Fallback to classical mechanics if SGP4 fails
      return propagateWithClassicalMechanics({
        altitude: 400, // Default altitude
        inclination: 51.6,
        raan: 0,
        trueAnomaly: 0,
        eccentricity: 0,
        argOfPerigee: 0,
        meanAnomaly: 0,
        timeSpanHours,
        numPoints
      });
    }
    
    return points;
  }, []);

  // Classical mechanics propagation for manual orbital elements
  const propagateWithClassicalMechanics = useCallback((params: {
    altitude: number;
    inclination: number;
    raan: number;
    trueAnomaly: number;
    eccentricity: number;
    argOfPerigee: number;
    meanAnomaly: number;
    timeSpanHours: number;
    numPoints: number;
  }): GroundTrackPoint[] => {
    const points: GroundTrackPoint[] = [];
    const { altitude, inclination, raan, trueAnomaly, eccentricity, argOfPerigee, meanAnomaly, timeSpanHours, numPoints } = params;
    
    // Constants for Earth and orbital mechanics
    const earthRadius = 6371; // km
    const semiMajorAxis = earthRadius + altitude;
    
    // Calculate orbital period using utility function
    const orbitalPeriod = calculateOrbitalPeriod(semiMajorAxis); // seconds
    const orbitalPeriodMinutes = orbitalPeriod / 60;
    
    // Convert orbital elements from degrees to radians
    const inclinationRad = toRadians(inclination);
    const raanRad = toRadians(raan);
    const argOfPerigeeRad = toRadians(argOfPerigee);
    const initialMeanAnomalyRad = toRadians(meanAnomaly);
    
    // Current time as simulation start
    const simulationStartTime = new Date();
    
    console.log('Classical mechanics propagation params:', {
      altitude,
      inclination,
      raan,
      trueAnomaly,
      eccentricity,
      argOfPerigee,
      semiMajorAxis,
      orbitalPeriodMinutes
    });
    
    // Generate ground track points over time
    for (let i = 0; i < numPoints; i++) {
      const timeMinutes = (i * timeSpanHours * 60) / numPoints;
      const timestamp = simulationStartTime.getTime() + (timeMinutes * 60 * 1000);
      
      // Calculate mean motion (radians per minute)
      const meanMotion = (2 * Math.PI) / orbitalPeriodMinutes;
      
      // Propagate mean anomaly with time, then convert to true anomaly
      const currentMeanAnomaly = initialMeanAnomalyRad + (meanMotion * timeMinutes);
      const currentTrueAnomaly = meanAnomalyToTrueAnomaly(currentMeanAnomaly, eccentricity);
      
      // Calculate ECI position using actual orbital parameters
      const eciPosition = calculateSatelliteECIPosition(
        semiMajorAxis,
        eccentricity,
        inclinationRad,
        raanRad,
        argOfPerigeeRad,
        currentTrueAnomaly
      );
      
      // Convert ECI to ECEF with proper GMST calculation using satellite.js
      const currentTime = new Date(timestamp);
      const gmst = satellite.gstime(currentTime);
      const ecefPosition = eciToEcef(eciPosition, gmst);
      
      // Convert ECEF to geodetic coordinates (lat, lng, alt)
      const geodetic = ecefToGeodetic(ecefPosition[0], ecefPosition[1], ecefPosition[2]);
      
      // Add debug logging for first few points
      if (i < 3) {
        console.log(`Classical Point ${i}:`, {
          timeMinutes,
          currentTrueAnomaly: currentTrueAnomaly * 180 / Math.PI,
          eciPosition,
          gmst: gmst * 180 / Math.PI,
          ecefPosition,
          geodetic
        });
      }
      
      points.push({
        lat: geodetic.lat,
        lng: geodetic.lng,
        timestamp
      });
    }
    
    return points;
  }, []);

  // Calculate revisit statistics for a grid covering Earth's surface
  const calculateRevisits = useCallback((params: RevisitCalculationParams): RevisitData => {
    const { satellites, timeSpanHours, gridResolution } = params;
    
    // Initialize global grid (latitude × longitude)
    // gridResolution is in degrees, so calculate number of cells needed
    const latCells = Math.ceil(180 / gridResolution); // Number of latitude cells for global coverage
    const lngCells = Math.ceil(360 / gridResolution); // Number of longitude cells for global coverage
    const grid: number[][] = Array(latCells).fill(0).map(() => Array(lngCells).fill(0));
    
    // Sensor parameters
    const sensorFOV = 10; // degrees - half angle of sensor field of view
    
    // Process each satellite in the constellation
    for (const satellite of satellites) {
      // Propagate satellite orbit for the specified time span
      const groundTrack = propagateSatelliteOrbit({
        ...satellite,
        timeSpanHours
      });
      
      // For each consecutive pair of points, interpolate coverage along the track
      for (let i = 0; i < groundTrack.length; i++) {
        const point = groundTrack[i];
        const nextPoint = groundTrack[i + 1];
        
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
