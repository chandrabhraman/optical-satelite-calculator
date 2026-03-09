
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { usePropagator } from '@/hooks/usePropagator';
import { Button } from '@/components/ui/button';
import { RotateCcw, Globe, Map, Eye, EyeOff } from 'lucide-react';

export interface AoiPolygon {
  vertices: Array<{ lat: number; lng: number }>;
}

interface RevisitEarthMapProps {
  satellites?: Array<{
    id: string;
    name: string;
    altitude: number;
    inclination: number;
    raan: number;
    trueAnomaly: number;
    tle?: string;
    eccentricity?: number;
    argOfPerigee?: number;
  }>;
  timeSpan?: number;
  isHeatmapActive?: boolean;
  showGroundTracks?: boolean;
  gridSize?: number;
  aoiMode?: boolean;
  onAoiDefined?: (polygon: AoiPolygon | null) => void;
  aoiPolygon?: AoiPolygon | null;
}

const RevisitEarthMap: React.FC<RevisitEarthMapProps> = ({
  satellites = [],
  timeSpan = 24,
  isHeatmapActive = false,
  showGroundTracks = true,
  gridSize = 5,
  aoiMode = false,
  onAoiDefined,
  aoiPolygon = null
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const groundTracksRef = useRef<THREE.Group | null>(null);
  const heatmapRef = useRef<THREE.Mesh | null>(null);
  const aoiGroupRef = useRef<THREE.Group | null>(null);
  const aoiVerticesRef = useRef<Array<{ lat: number; lng: number }>>([]);
  const isDrawingAoiRef = useRef(false);
  
  const [is2D, setIs2D] = useState(aoiMode ? true : false);
  const [tracksVisible, setTracksVisible] = useState(showGroundTracks);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [maxRevisitCount, setMaxRevisitCount] = useState(0);
  const [aoiDrawing, setAoiDrawing] = useState(false);
  const [aoiVertexCount, setAoiVertexCount] = useState(0);
  
  const { propagateSatelliteOrbit, calculateRevisits } = usePropagator();

  // Satellite colors for ground tracks
  const satelliteColors = [
    '#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff',
    '#44ffff', '#ff8844', '#8844ff', '#44ff88', '#ff4488'
  ];

  // Clear heatmap data and visualization
  const clearHeatmap = () => {
    setHeatmapData([]);
    setMaxRevisitCount(0);
    
    if (heatmapRef.current && sceneRef.current) {
      sceneRef.current.remove(heatmapRef.current);
      heatmapRef.current.geometry.dispose();
      if (heatmapRef.current.material instanceof THREE.Material) {
        heatmapRef.current.material.dispose();
      }
      heatmapRef.current = null;
    }
  };

  // Toggle between 3D globe and 2D Mercator projection
  const toggleProjection = () => {
    setIs2D(!is2D);
  };

  // Toggle ground tracks visibility
  const toggleGroundTracks = () => {
    setTracksVisible(!tracksVisible);
    if (groundTracksRef.current) {
      groundTracksRef.current.visible = !tracksVisible;
    }
  };

  // Load high-quality Natural Earth texture from downloaded file
  const loadNaturalEarthTexture = () => {
    const loader = new THREE.TextureLoader();
    return loader.load('/textures/earth_daymap_2k.jpg', 
      (texture) => {
        console.log('Natural Earth texture loaded successfully');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
      },
      undefined,
      (error) => {
        console.error('Error loading Natural Earth texture:', error);
      }
    );
  };

  // Initialize Three.js scene only when needed
  useEffect(() => {
    if (!containerRef.current || satellites.length === 0) return;
    
    // Cleanup previous scene
    if (rendererRef.current) {
      containerRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
    }
    
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      preserveDrawingBuffer: true 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000011); // Deep space color
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;
    
    // Uniform lighting for analysis (no shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    
    // Create Earth with high-quality Natural Earth texture
    const earthGeometry = new THREE.SphereGeometry(2, 128, 64);
    const earthTexture = loadNaturalEarthTexture();
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      specular: 0x111111,
      shininess: 20,
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    earthRef.current = earth;
    
    const groundTracks = new THREE.Group();
    scene.add(groundTracks);
    groundTracksRef.current = groundTracks;
    
    // AOI group for polygon drawing
    const aoiGroup = new THREE.Group();
    scene.add(aoiGroup);
    aoiGroupRef.current = aoiGroup;
    
    // Render loop with forced render on each frame for snapshot capability
    const render = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Clear and render the scene
        rendererRef.current.clear();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      requestAnimationFrame(render);
    };
    render();
    
    return () => {
      if (earthRef.current) {
        earthRef.current.geometry.dispose();
        if (earthRef.current.material instanceof THREE.Material) {
          earthRef.current.material.dispose();
        }
      }
    };
  }, [satellites.length]);

  // Update projection mode
  useEffect(() => {
    if (!earthRef.current || !cameraRef.current || !controlsRef.current) return;
    
    if (is2D) {
      earthRef.current.geometry.dispose();
      earthRef.current.geometry = new THREE.PlaneGeometry(4, 2);
      
      // Position camera to fit earth exactly in view
      cameraRef.current.position.set(0, 0, 2.2);
      
      // Configure controls for 2D map-like navigation
      controlsRef.current.enableRotate = false;
      controlsRef.current.enablePan = true;
      
      // Set zoom constraints - prevent zooming out beyond initial view
      controlsRef.current.minDistance = 2.2; // Initial view distance
      controlsRef.current.maxDistance = 0.1; // Allow close zoom for detailed view
      
      // Constrain panning to earth bounds
      controlsRef.current.minPolarAngle = Math.PI / 2;
      controlsRef.current.maxPolarAngle = Math.PI / 2;
      
      // Reset camera target to center
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    } else {
      earthRef.current.geometry.dispose();
      earthRef.current.geometry = new THREE.SphereGeometry(2, 128, 64);
      
      cameraRef.current.position.set(0, 0, 5);
      
      // Reset 3D controls
      controlsRef.current.enableRotate = true;
      controlsRef.current.enablePan = true;
      controlsRef.current.minDistance = 2.5;
      controlsRef.current.maxDistance = 50;
      controlsRef.current.minPolarAngle = 0;
      controlsRef.current.maxPolarAngle = Math.PI;
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [is2D]);

  // Update ground tracks when satellites change
  useEffect(() => {
    if (!groundTracksRef.current || !sceneRef.current || satellites.length === 0) return;
    
    // Clear previous ground tracks
    while (groundTracksRef.current.children.length > 0) {
      const child = groundTracksRef.current.children[0];
      groundTracksRef.current.remove(child);
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
        child.material.dispose();
      }
    }
    
    if (tracksVisible) {
      satellites.forEach((satellite, index) => {
        if (!satellite.tle) {
          console.warn(`Satellite ${satellite.id} has no TLE, skipping ground track calculation`);
          return;
        }
        
        const groundTrackPoints = propagateSatelliteOrbit({
          tle: satellite.tle,
          timeSpanHours: timeSpan
        });
        
        const lineColor = satelliteColors[index % satelliteColors.length];
        
        // Only show ground tracks in 2D view
        if (is2D) {
          // Split track at antimeridian crossings to avoid jump artifacts
          const trackSegments = [];
          let currentSegment = [];
          let prevLng = null;
          
          for (const point of groundTrackPoints) {
            if (prevLng !== null) {
              // Check for antimeridian crossing (longitude jump > 180°)
              const lngDiff = Math.abs(point.lng - prevLng);
              if (lngDiff > 180) {
                // Save current segment if it has points
                if (currentSegment.length > 0) {
                  trackSegments.push([...currentSegment]);
                }
                // Start new segment
                currentSegment = [];
              }
            }
            
            const x = (point.lng + 180) * (4 / 360) - 2;
            const y = (90 - point.lat) * (2 / 180) - 1;
            currentSegment.push(new THREE.Vector3(x, y, 0.01));
            prevLng = point.lng;
          }
          
          // Add final segment
          if (currentSegment.length > 0) {
            trackSegments.push(currentSegment);
          }
          
          // Create separate line for each segment
          trackSegments.forEach(segment => {
            if (segment.length > 1) {
              const lineGeometry = new THREE.BufferGeometry().setFromPoints(segment);
              const lineMaterial = new THREE.LineBasicMaterial({ 
                color: lineColor,
                linewidth: 2
              });
              const line = new THREE.Line(lineGeometry, lineMaterial);
              groundTracksRef.current?.add(line);
            }
          });
        }
        // No ground tracks in 3D view for simplicity
      });
    }
    
    // Update visibility
    if (groundTracksRef.current) {
      groundTracksRef.current.visible = tracksVisible;
    }
  }, [satellites, tracksVisible, propagateSatelliteOrbit, timeSpan, is2D]);

  // Generate heatmap with configurable grid size
  useEffect(() => {
    if (!sceneRef.current || !earthRef.current || satellites.length === 0) return;
    
    // Clear previous heatmap
    if (heatmapRef.current && heatmapRef.current.parent) {
      sceneRef.current.remove(heatmapRef.current);
      heatmapRef.current.geometry.dispose();
      if (heatmapRef.current.material instanceof THREE.Material) {
        heatmapRef.current.material.dispose();
      }
      heatmapRef.current = null;
    }
    
    if (isHeatmapActive) {
      // Use grid size directly as the resolution in degrees
      const gridResolution = gridSize;
      
      const revisitData = calculateRevisits({
        satellites: satellites.map(sat => ({
          altitude: sat.altitude,
          inclination: sat.inclination,
          raan: sat.raan,
          trueAnomaly: sat.trueAnomaly,
          tle: sat.tle,
          eccentricity: sat.eccentricity,
          argOfPerigee: sat.argOfPerigee
        })),
        timeSpanHours: timeSpan,
        gridResolution: gridResolution,
        startDate: new Date(), // TODO: Pass actual dates from form
        endDate: new Date(Date.now() + timeSpan * 60 * 60 * 1000) // TODO: Pass actual dates from form
      });
      
      setHeatmapData(revisitData.grid);
      setMaxRevisitCount(revisitData.maxCount);
      
      // Calculate proper segments for geometry based on grid resolution
      const latSegments = Math.ceil(180 / gridResolution); // Number of latitude segments
      const lngSegments = Math.ceil(360 / gridResolution); // Number of longitude segments
      
      const heatmapGeometry = is2D 
        ? new THREE.PlaneGeometry(4.02, 2.02, lngSegments, latSegments)
        : new THREE.SphereGeometry(2.01, lngSegments, latSegments);
      
      // Generate texture from revisit data using the EXACT same color mapping
      const textureSize = 512;
      const data = new Uint8Array(4 * textureSize * textureSize);
      
      for (let i = 0; i < textureSize; i++) {
        for (let j = 0; j < textureSize; j++) {
          const index = (i * textureSize + j) * 4;
          
          const latIndex = Math.floor((i / textureSize) * revisitData.grid.length);
          const lngIndex = Math.floor((j / textureSize) * revisitData.grid[0].length);
          
          const value = revisitData.grid[latIndex]?.[lngIndex] || 0;
          const normalizedValue = revisitData.maxCount > 0 ? value / revisitData.maxCount : 0;
          
          // EXACT same color mapping as used in the color bar
          if (normalizedValue > 0.8) {
            data[index] = 255;       // Red
            data[index + 1] = Math.max(0, 255 - (normalizedValue - 0.8) * 1275);
            data[index + 2] = 0;
          } else if (normalizedValue > 0.6) {
            data[index] = 255;       // Orange
            data[index + 1] = Math.floor(255 - (normalizedValue - 0.6) * 1275);
            data[index + 2] = 0;
          } else if (normalizedValue > 0.4) {
            data[index] = 255;       // Yellow
            data[index + 1] = 255;
            data[index + 2] = Math.floor((0.6 - normalizedValue) * 1275);
          } else if (normalizedValue > 0.2) {
            data[index] = Math.floor(255 * (normalizedValue - 0.2) * 5); // Green
            data[index + 1] = 255;
            data[index + 2] = 0;
          } else if (normalizedValue > 0) {
            data[index] = 0;         // Blue
            data[index + 1] = Math.floor(255 * normalizedValue * 5);
            data[index + 2] = Math.floor(255 * (0.2 - normalizedValue) * 5);
          } else {
            data[index] = 0;         // Transparent for no coverage
            data[index + 1] = 0;
            data[index + 2] = 0;
          }
          
          data[index + 3] = normalizedValue > 0 ? Math.floor(180 * normalizedValue + 75) : 0;
        }
      }
      
      const heatmapTexture = new THREE.DataTexture(data, textureSize, textureSize, THREE.RGBAFormat);
      heatmapTexture.needsUpdate = true;
      
      const heatmapMaterial = new THREE.MeshBasicMaterial({
        map: heatmapTexture,
        transparent: true,
        opacity: 0.8,
      });
      
      const heatmap = new THREE.Mesh(heatmapGeometry, heatmapMaterial);
      if (is2D) {
        heatmap.position.z = 0.01;
      }
      sceneRef.current.add(heatmap);
      heatmapRef.current = heatmap;
    }
  }, [isHeatmapActive, satellites, calculateRevisits, timeSpan, is2D, gridSize, aoiPolygon]);

  // Helper: convert screen click to lat/lng in 2D mode
  const screenToLatLng = (event: MouseEvent): { lat: number; lng: number } | null => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    
    if (earthRef.current) {
      const intersects = raycaster.intersectObject(earthRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        // In 2D mode, earth is a PlaneGeometry(4, 2) centered at origin
        const lng = (point.x + 2) * (360 / 4) - 180;
        const lat = 90 - (point.y + 1) * (180 / 2);
        return { lat: Math.max(-90, Math.min(90, lat)), lng: Math.max(-180, Math.min(180, lng)) };
      }
    }
    return null;
  };

  // Draw AOI polygon on the scene
  const drawAoiPolygon = (vertices: Array<{ lat: number; lng: number }>, closed: boolean) => {
    if (!aoiGroupRef.current) return;
    
    // Clear previous AOI visuals
    while (aoiGroupRef.current.children.length > 0) {
      const child = aoiGroupRef.current.children[0];
      aoiGroupRef.current.remove(child);
      if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) child.material.dispose();
      }
    }
    
    if (vertices.length === 0) return;
    
    // Convert vertices to 2D map coords
    const points = vertices.map(v => {
      const x = (v.lng + 180) * (4 / 360) - 2;
      const y = 1 - (v.lat + 90) * (2 / 180);
      return new THREE.Vector3(x, y, 0.02);
    });
    
    // Draw vertex dots
    vertices.forEach((v) => {
      const x = (v.lng + 180) * (4 / 360) - 2;
      const y = 1 - (v.lat + 90) * (2 / 180);
      const dotGeom = new THREE.CircleGeometry(0.02, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      const dot = new THREE.Mesh(dotGeom, dotMat);
      dot.position.set(x, y, 0.025);
      aoiGroupRef.current?.add(dot);
    });
    
    // Draw lines
    if (points.length > 1) {
      const linePoints = [...points];
      if (closed) linePoints.push(points[0]);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 2 });
      const line = new THREE.Line(lineGeom, lineMat);
      aoiGroupRef.current.add(line);
    }
    
    // Draw filled polygon if closed
    if (closed && points.length >= 3) {
      const shape = new THREE.Shape();
      shape.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].y);
      }
      shape.closePath();
      const shapeGeom = new THREE.ShapeGeometry(shape);
      const shapeMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ff88, 
        transparent: true, 
        opacity: 0.15,
        side: THREE.DoubleSide
      });
      const shapeMesh = new THREE.Mesh(shapeGeom, shapeMat);
      shapeMesh.position.z = 0.015;
      aoiGroupRef.current.add(shapeMesh);
    }
  };

  // AOI click handler for 2D mode
  useEffect(() => {
    if (!aoiMode || !containerRef.current || !rendererRef.current) return;
    
    // Force 2D for AOI mode
    if (!is2D) {
      setIs2D(true);
      return;
    }
    
    const canvas = rendererRef.current.domElement;
    
    const handleClick = (event: MouseEvent) => {
      const latLng = screenToLatLng(event);
      if (!latLng) return;
      
      if (!isDrawingAoiRef.current) {
        // Start drawing
        isDrawingAoiRef.current = true;
        aoiVerticesRef.current = [latLng];
        setAoiDrawing(true);
        setAoiVertexCount(1);
        drawAoiPolygon([latLng], false);
        onAoiDefined?.(null); // Reset previous AOI
      } else {
        // Add vertex
        aoiVerticesRef.current.push(latLng);
        setAoiVertexCount(aoiVerticesRef.current.length);
        drawAoiPolygon(aoiVerticesRef.current, false);
      }
    };
    
    const handleDblClick = (event: MouseEvent) => {
      event.preventDefault();
      if (isDrawingAoiRef.current && aoiVerticesRef.current.length >= 3) {
        // Close polygon
        isDrawingAoiRef.current = false;
        setAoiDrawing(false);
        drawAoiPolygon(aoiVerticesRef.current, true);
        onAoiDefined?.({ vertices: [...aoiVerticesRef.current] });
      }
    };
    
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDblClick);
    
    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('dblclick', handleDblClick);
    };
  }, [aoiMode, is2D, satellites.length]);

  // Draw existing AOI polygon when provided
  useEffect(() => {
    if (aoiPolygon && aoiPolygon.vertices.length >= 3) {
      drawAoiPolygon(aoiPolygon.vertices, true);
    }
  }, [aoiPolygon, is2D]);

  // AOI-filtered heatmap: only show coverage within polygon
  useEffect(() => {
    if (!aoiMode || !aoiPolygon || !sceneRef.current || satellites.length === 0) return;
    
    // Clear existing heatmap first
    if (heatmapRef.current && heatmapRef.current.parent) {
      sceneRef.current.remove(heatmapRef.current);
      heatmapRef.current.geometry.dispose();
      if (heatmapRef.current.material instanceof THREE.Material) {
        heatmapRef.current.material.dispose();
      }
      heatmapRef.current = null;
    }
    
    const gridResolution = gridSize;
    const revisitData = calculateRevisits({
      satellites: satellites.map(sat => ({
        altitude: sat.altitude,
        inclination: sat.inclination,
        raan: sat.raan,
        trueAnomaly: sat.trueAnomaly,
        tle: sat.tle,
        eccentricity: sat.eccentricity,
        argOfPerigee: sat.argOfPerigee
      })),
      timeSpanHours: timeSpan,
      gridResolution,
      startDate: new Date(),
      endDate: new Date(Date.now() + timeSpan * 60 * 60 * 1000)
    });
    
    // Filter grid to only show cells inside AOI polygon
    const filteredGrid = revisitData.grid.map((row, latIdx) => 
      row.map((val, lngIdx) => {
        const lat = 90 - latIdx * gridResolution;
        const lng = -180 + lngIdx * gridResolution;
        return isPointInPolygon(lat, lng, aoiPolygon.vertices) ? val : 0;
      })
    );
    
    const filteredMax = Math.max(...filteredGrid.flat());
    setHeatmapData(filteredGrid);
    setMaxRevisitCount(filteredMax);
    
    // Build heatmap texture
    const textureSize = 512;
    const data = new Uint8Array(4 * textureSize * textureSize);
    
    for (let i = 0; i < textureSize; i++) {
      for (let j = 0; j < textureSize; j++) {
        const index = (i * textureSize + j) * 4;
        const latIndex = Math.floor((i / textureSize) * filteredGrid.length);
        const lngIndex = Math.floor((j / textureSize) * (filteredGrid[0]?.length || 1));
        const value = filteredGrid[latIndex]?.[lngIndex] || 0;
        const normalizedValue = filteredMax > 0 ? value / filteredMax : 0;
        
        if (normalizedValue > 0.8) {
          data[index] = 255; data[index + 1] = Math.max(0, 255 - (normalizedValue - 0.8) * 1275); data[index + 2] = 0;
        } else if (normalizedValue > 0.6) {
          data[index] = 255; data[index + 1] = Math.floor(255 - (normalizedValue - 0.6) * 1275); data[index + 2] = 0;
        } else if (normalizedValue > 0.4) {
          data[index] = 255; data[index + 1] = 255; data[index + 2] = Math.floor((0.6 - normalizedValue) * 1275);
        } else if (normalizedValue > 0.2) {
          data[index] = Math.floor(255 * (normalizedValue - 0.2) * 5); data[index + 1] = 255; data[index + 2] = 0;
        } else if (normalizedValue > 0) {
          data[index] = 0; data[index + 1] = Math.floor(255 * normalizedValue * 5); data[index + 2] = Math.floor(255 * (0.2 - normalizedValue) * 5);
        } else {
          data[index] = 0; data[index + 1] = 0; data[index + 2] = 0;
        }
        data[index + 3] = normalizedValue > 0 ? Math.floor(180 * normalizedValue + 75) : 0;
      }
    }
    
    const heatmapTexture = new THREE.DataTexture(data, textureSize, textureSize, THREE.RGBAFormat);
    heatmapTexture.needsUpdate = true;
    const heatmapGeometry = new THREE.PlaneGeometry(4.02, 2.02, Math.ceil(360 / gridResolution), Math.ceil(180 / gridResolution));
    const heatmapMaterial = new THREE.MeshBasicMaterial({ map: heatmapTexture, transparent: true, opacity: 0.8 });
    const heatmap = new THREE.Mesh(heatmapGeometry, heatmapMaterial);
    heatmap.position.z = 0.01;
    sceneRef.current.add(heatmap);
    heatmapRef.current = heatmap;
  }, [aoiMode, aoiPolygon, satellites, gridSize, timeSpan]);

  // Don't render anything if no satellites
  if (satellites.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Globe className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Run analysis to see satellite visualization</p>
        </div>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden relative">
      {/* Control buttons */}
      <div className="absolute top-2 left-2 flex gap-2 z-10">
        <Button
          size="sm"
          variant="outline"
          onClick={clearHeatmap}
          className="bg-background/70 backdrop-blur-sm"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Clear Heatmap
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={toggleProjection}
          className="bg-background/70 backdrop-blur-sm"
        >
          {is2D ? <Globe className="h-4 w-4 mr-1" /> : <Map className="h-4 w-4 mr-1" />}
          {is2D ? '3D Globe' : '2D Mercator'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={toggleGroundTracks}
          className="bg-background/70 backdrop-blur-sm"
        >
          {tracksVisible ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {tracksVisible ? 'Hide Tracks' : 'Show Tracks'}
        </Button>
      </div>

      {/* Discrete color bar for heatmap with fixed color segments */}
      {isHeatmapActive && maxRevisitCount > 0 && (
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm p-3 rounded text-xs border">
          <div className="text-foreground font-medium mb-2">Revisit Count</div>
          <div className="flex items-center gap-0">
            <div className="w-6 h-6 bg-blue-500 border border-gray-300"></div>
            <div className="w-6 h-6 bg-green-500 border border-gray-300"></div>
            <div className="w-6 h-6 bg-yellow-500 border border-gray-300"></div>
            <div className="w-6 h-6 bg-orange-500 border border-gray-300"></div>
            <div className="w-6 h-6 bg-red-500 border border-gray-300"></div>
            <div className="w-6 h-6 bg-red-600 border border-gray-300"></div>
          </div>
          <div className="flex justify-between text-[10px] text-foreground mt-1 w-36">
            <span>0</span>
            <span>{Math.floor(maxRevisitCount * 0.2)}</span>
            <span>{Math.floor(maxRevisitCount * 0.4)}</span>
            <span>{Math.floor(maxRevisitCount * 0.6)}</span>
            <span>{Math.floor(maxRevisitCount * 0.8)}</span>
            <span>{maxRevisitCount}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">
            Grid: {gridSize}° × {gridSize}° ({heatmapData.length}×{heatmapData[0]?.length || 0} cells)
          </div>
          <div className="text-[10px] text-muted-foreground">
            Time span: {timeSpan}h
          </div>
        </div>
      )}

      {/* Satellite ground tracks legend */}
      {tracksVisible && satellites.length > 0 && (
        <div className="absolute bottom-16 left-2 bg-background/90 backdrop-blur-sm p-3 rounded text-xs max-w-[200px] border">
          <div className="text-foreground font-medium mb-2">Ground Tracks</div>
          {satellites.slice(0, 6).map((satellite, index) => (
            <div key={satellite.id} className="flex items-center gap-2 text-[10px] mb-1">
              <div 
                className="w-4 h-2 rounded"
                style={{ backgroundColor: satelliteColors[index % satelliteColors.length] }}
              ></div>
              <span className="text-foreground truncate">{satellite.name}</span>
            </div>
          ))}
          {satellites.length > 6 && (
            <div className="text-[10px] text-muted-foreground mt-1">
              +{satellites.length - 6} more satellites
            </div>
          )}
        </div>
      )}

      {/* Controls info */}
      <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm p-2 rounded text-xs text-foreground border">
        <div>{is2D ? 'Click and drag to pan' : 'Click and drag to rotate'}</div>
        <div>Scroll to zoom</div>
      </div>

      {/* Simulation info */}
      <div className="absolute top-16 left-2 bg-background/90 backdrop-blur-sm p-2 rounded text-xs text-foreground max-w-[200px] border">
        <div className="font-medium mb-1">Natural Earth View</div>
        <div className="text-[10px]">
          {satellites.length} satellite{satellites.length !== 1 ? 's' : ''} • {timeSpan}h simulation
        </div>
        <div className="text-[10px] mt-1">
          Projection: {is2D ? 'Mercator 2D' : '3D Globe'}
        </div>
      </div>
    </div>
  );
};

export default RevisitEarthMap;
