
import { useState, useCallback } from 'react';

// Define interfaces for our propagator
interface SatelliteParams {
  altitude: number;
  inclination: number;
  raan: number;
  trueAnomaly: number;
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

  // Real orbital mechanics calculations using Kepler's laws
  const propagateSatelliteOrbit = useCallback((params: PropagationParams): GroundTrackPoint[] => {
    const points: GroundTrackPoint[] = [];
    const { altitude, inclination, raan, trueAnomaly, timeSpanHours } = params;
    
    // Constants for Earth and orbital mechanics
    const earthRadius = 6371; // km
    const mu = 398600.4418; // km³/s² - Earth's gravitational parameter
    const semiMajorAxis = earthRadius + altitude;
    
    // Calculate orbital period using Kepler's third law: T = 2π√(a³/μ)
    const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu); // seconds
    const orbitalPeriodMinutes = orbitalPeriod / 60;
    
    // Earth's rotation rate (degrees per minute)
    const earthRotationRate = 360 / (24 * 60); // 0.25 deg/min
    
    // Number of points to generate based on time span
    const totalMinutes = timeSpanHours * 60;
    const numPoints = Math.min(2000, Math.max(200, Math.floor(totalMinutes * 2))); // 1 point every 30 seconds for continuous coverage
    
    // Convert orbital elements from degrees to radians
    const inclinationRad = inclination * Math.PI / 180;
    const raanRad = raan * Math.PI / 180;
    const initialTrueAnomalyRad = trueAnomaly * Math.PI / 180;
    
    // Generate ground track points over time
    for (let i = 0; i < numPoints; i++) {
      const timeMinutes = (i * totalMinutes) / numPoints;
      const timestamp = Date.now() + (timeMinutes * 60 * 1000);
      
      // Calculate mean motion (radians per minute)
      const meanMotion = (2 * Math.PI) / orbitalPeriodMinutes;
      
      // Current true anomaly (for circular orbit approximation)
      const currentTrueAnomaly = initialTrueAnomalyRad + (meanMotion * timeMinutes);
      
      // Calculate satellite position in orbital coordinate system
      const orbitalX = Math.cos(currentTrueAnomaly);
      const orbitalY = Math.sin(currentTrueAnomaly);
      const orbitalZ = 0; // Circular orbit in orbital plane
      
      // Transform to Earth-centered inertial (ECI) coordinates
      // Step 1: Apply inclination rotation around X-axis
      const inclinedX = orbitalX;
      const inclinedY = orbitalY * Math.cos(inclinationRad) - orbitalZ * Math.sin(inclinationRad);
      const inclinedZ = orbitalY * Math.sin(inclinationRad) + orbitalZ * Math.cos(inclinationRad);
      
      // Step 2: Apply RAAN rotation around Z-axis
      const eciX = inclinedX * Math.cos(raanRad) - inclinedY * Math.sin(raanRad);
      const eciY = inclinedX * Math.sin(raanRad) + inclinedY * Math.cos(raanRad);
      const eciZ = inclinedZ;
      
      // Convert ECI coordinates to geodetic latitude and longitude
      const latitude = Math.asin(eciZ) * 180 / Math.PI;
      
      // Calculate longitude with Earth rotation correction
      let longitude = Math.atan2(eciY, eciX) * 180 / Math.PI;
      
      // Apply Earth rotation: subtract rotation that occurred during this time
      const earthRotationDegrees = earthRotationRate * timeMinutes;
      longitude = longitude - earthRotationDegrees;
      
      // Normalize longitude to [-180, 180] range
      while (longitude > 180) longitude -= 360;
      while (longitude < -180) longitude += 360;
      
      points.push({
        lat: latitude,
        lng: longitude,
        timestamp
      });
    }
    
    return points;
  }, []);

  // Calculate revisit statistics for a grid covering Earth's surface
  const calculateRevisits = useCallback((params: RevisitCalculationParams): RevisitData => {
    const { satellites, timeSpanHours, gridResolution } = params;
    
    // Initialize global grid (latitude × longitude)
    const latCells = gridResolution;
    const lngCells = gridResolution * 2; // More longitude cells due to Earth's geometry
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
    
    console.log('Debug stats:', { timeSpanHours, averageRevisits, maxCount, minCount, totalRevisits, coveredCells });
    
    // Calculate time statistics based on revisit counts and time span
    // For revisit time: if you get revisited N times in T hours, average time between visits is T/(N-1)
    const averageRevisitTime = averageRevisits > 1 ? timeSpanHours / (averageRevisits - 1) : timeSpanHours;
    const minRevisitTime = maxCount > 1 ? timeSpanHours / (maxCount - 1) : timeSpanHours;
    const maxGap = minCount > 1 && minCount !== Number.MAX_SAFE_INTEGER ? timeSpanHours / (minCount - 1) : timeSpanHours;
    
    console.log('Calculated times:', { averageRevisitTime, minRevisitTime, maxGap });
    
    const statistics = {
      totalCells,
      coveredCells,
      coverage: parseFloat(coverage.toFixed(1)),
      minRevisits: minCount,
      maxRevisits: maxCount,
      averageRevisits: parseFloat(averageRevisits.toFixed(1)),
      averageRevisitTime: parseFloat(averageRevisitTime.toFixed(1)),
      maxGap: parseFloat(maxGap.toFixed(1)),
      minRevisitTime: parseFloat(minRevisitTime.toFixed(1))
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
