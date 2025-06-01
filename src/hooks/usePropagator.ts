
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
}

/**
 * Hook for satellite orbit propagation using real orbital mechanics
 */
export function usePropagator() {
  const [isInitialized, setIsInitialized] = useState(true); // For now, mark as initialized

  // Real orbital mechanics calculations using Kepler's laws
  const propagateSatelliteOrbit = useCallback((params: PropagationParams): GroundTrackPoint[] => {
    const points: GroundTrackPoint[] = [];
    const { altitude, inclination, raan, trueAnomaly, timeSpanHours } = params;
    
    // Constants
    const earthRadius = 6371; // km
    const mu = 398600.4418; // km³/s² - Earth's gravitational parameter
    const semiMajorAxis = earthRadius + altitude;
    
    // Calculate orbital period using Kepler's third law
    const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu); // seconds
    const orbitalPeriodMinutes = orbitalPeriod / 60;
    
    // Earth's rotation rate (degrees per minute)
    const earthRotationRate = 360 / (24 * 60);
    
    // Number of points to generate based on time span
    const totalMinutes = timeSpanHours * 60;
    const numPoints = Math.min(500, Math.max(100, Math.floor(totalMinutes / 2))); // 1 point every 2 minutes, limited to 500 points
    
    // Convert angles to radians
    const inclinationRad = inclination * Math.PI / 180;
    const raanRad = raan * Math.PI / 180;
    const initialTrueAnomalyRad = trueAnomaly * Math.PI / 180;
    
    // Generate points over time
    for (let i = 0; i < numPoints; i++) {
      const timeMinutes = (i * totalMinutes) / numPoints;
      const timestamp = Date.now() + (timeMinutes * 60 * 1000);
      
      // Calculate mean motion (radians per minute)
      const meanMotion = (2 * Math.PI) / orbitalPeriodMinutes;
      
      // Current true anomaly (assuming circular orbit for simplicity)
      const currentTrueAnomaly = initialTrueAnomalyRad + (meanMotion * timeMinutes);
      
      // Calculate position in orbital plane using orbital mechanics
      // For a circular orbit, the satellite's position can be calculated using:
      
      // Position in orbital coordinate system
      const orbitalX = Math.cos(currentTrueAnomaly);
      const orbitalY = Math.sin(currentTrueAnomaly);
      const orbitalZ = 0; // For circular orbit in orbital plane
      
      // Transform to Earth-centered inertial coordinates
      // Apply inclination rotation
      const inclinedX = orbitalX;
      const inclinedY = orbitalY * Math.cos(inclinationRad) - orbitalZ * Math.sin(inclinationRad);
      const inclinedZ = orbitalY * Math.sin(inclinationRad) + orbitalZ * Math.cos(inclinationRad);
      
      // Apply RAAN rotation
      const eciX = inclinedX * Math.cos(raanRad) - inclinedY * Math.sin(raanRad);
      const eciY = inclinedX * Math.sin(raanRad) + inclinedY * Math.cos(raanRad);
      const eciZ = inclinedZ;
      
      // Convert to latitude and longitude
      const latitude = Math.asin(eciZ) * 180 / Math.PI;
      
      // Calculate longitude, accounting for Earth's rotation
      let longitude = Math.atan2(eciY, eciX) * 180 / Math.PI;
      
      // Apply Earth rotation correction
      const earthRotationDegrees = earthRotationRate * timeMinutes;
      longitude = longitude - earthRotationDegrees;
      
      // Normalize longitude to [-180, 180]
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

  // Calculate revisits for a grid of points on Earth
  const calculateRevisits = useCallback((params: RevisitCalculationParams): RevisitData => {
    const { satellites, timeSpanHours, gridResolution } = params;
    
    // Initialize the grid
    const latCells = gridResolution;
    const lngCells = gridResolution * 2;
    const grid: number[][] = Array(latCells).fill(0).map(() => Array(lngCells).fill(0));
    
    // Define sensor field of view (simplified)
    const sensorFOV = 10; // degrees - half angle of sensor swath
    
    // Process each satellite
    for (const satellite of satellites) {
      // Propagate the satellite orbit
      const groundTrack = propagateSatelliteOrbit({
        ...satellite,
        timeSpanHours
      });
      
      // For each point in the ground track, calculate which grid cells are visible
      for (const point of groundTrack) {
        // Calculate swath width based on altitude and sensor FOV
        const swathHalfWidth = Math.atan(Math.tan(sensorFOV * Math.PI / 180)) * satellite.altitude / 111; // approximate degrees
        
        // Mark grid cells within the sensor swath as visited
        const minLat = point.lat - swathHalfWidth;
        const maxLat = point.lat + swathHalfWidth;
        const minLng = point.lng - swathHalfWidth / Math.cos(point.lat * Math.PI / 180);
        const maxLng = point.lng + swathHalfWidth / Math.cos(point.lat * Math.PI / 180);
        
        // Convert lat/lng bounds to grid indices
        const minLatIndex = Math.max(0, Math.floor((90 - maxLat) * (latCells / 180)));
        const maxLatIndex = Math.min(latCells - 1, Math.floor((90 - minLat) * (latCells / 180)));
        const minLngIndex = Math.max(0, Math.floor((minLng + 180) * (lngCells / 360)));
        const maxLngIndex = Math.min(lngCells - 1, Math.floor((maxLng + 180) * (lngCells / 360)));
        
        // Increment revisit count for all grid cells in the swath
        for (let latIdx = minLatIndex; latIdx <= maxLatIndex; latIdx++) {
          for (let lngIdx = minLngIndex; lngIdx <= maxLngIndex; lngIdx++) {
            grid[latIdx][lngIdx]++;
          }
        }
      }
    }
    
    // Find the maximum revisit count
    let maxCount = 0;
    for (let i = 0; i < latCells; i++) {
      for (let j = 0; j < lngCells; j++) {
        if (grid[i][j] > maxCount) {
          maxCount = grid[i][j];
        }
      }
    }
    
    return { grid, maxCount };
  }, [propagateSatelliteOrbit]);

  return {
    propagateSatelliteOrbit,
    calculateRevisits,
    isOrekitInitialized: isInitialized
  };
}
