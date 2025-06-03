
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { usePropagator } from '@/hooks/usePropagator';
import { Button } from '@/components/ui/button';
import { RotateCcw, Globe, Map } from 'lucide-react';

interface RevisitEarthMapProps {
  satellites?: Array<{
    id: string;
    name: string;
    altitude: number;
    inclination: number;
    raan: number;
    trueAnomaly: number;
  }>;
  timeSpan?: number;
  isHeatmapActive?: boolean;
  showGroundTracks?: boolean;
}

const RevisitEarthMap: React.FC<RevisitEarthMapProps> = ({
  satellites = [],
  timeSpan = 24,
  isHeatmapActive = false,
  showGroundTracks = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const groundTracksRef = useRef<THREE.Group | null>(null);
  const heatmapRef = useRef<THREE.Mesh | null>(null);
  
  const [is2D, setIs2D] = useState(false);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [maxRevisitCount, setMaxRevisitCount] = useState(0);
  
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

  // Create Natural Earth texture with realistic colors
  const createNaturalEarthTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    // Natural Earth ocean color
    ctx.fillStyle = '#a6cee3'; // Light blue ocean
    ctx.fillRect(0, 0, 2048, 1024);
    
    // Add detailed continents with Natural Earth colors
    ctx.fillStyle = '#1f7837'; // Forest green for land masses
    
    // More detailed continent outlines based on Natural Earth projection
    const continents = [
      // North America - more accurate shape
      { x: 200, y: 150, w: 300, h: 200, shape: 'complex' },
      // South America - elongated
      { x: 350, y: 350, w: 150, h: 300, shape: 'tapered' },
      // Europe - smaller, detailed
      { x: 550, y: 120, w: 120, h: 100, shape: 'irregular' },
      // Africa - distinctive shape
      { x: 580, y: 200, w: 180, h: 250, shape: 'africa' },
      // Asia - large, complex
      { x: 700, y: 80, w: 400, h: 200, shape: 'asia' },
      // Australia
      { x: 900, y: 400, w: 120, h: 80, shape: 'oval' },
      // Greenland
      { x: 400, y: 80, w: 80, h: 120, shape: 'irregular' }
    ];
    
    continents.forEach(continent => {
      ctx.beginPath();
      switch (continent.shape) {
        case 'africa':
          // Africa-like shape
          ctx.ellipse(continent.x + continent.w/2, continent.y + continent.h/2, 
                     continent.w/2, continent.h/2, 0, 0, 2 * Math.PI);
          break;
        case 'asia':
          // Large irregular mass for Asia
          ctx.rect(continent.x, continent.y, continent.w, continent.h);
          break;
        default:
          ctx.rect(continent.x, continent.y, continent.w, continent.h);
      }
      ctx.fill();
    });
    
    // Add mountain ranges in darker green
    ctx.fillStyle = '#0f5132';
    // Himalayas
    ctx.fillRect(800, 160, 150, 20);
    // Andes
    ctx.fillRect(320, 350, 15, 250);
    // Rockies
    ctx.fillRect(250, 180, 20, 120);
    
    return new THREE.CanvasTexture(canvas);
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
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x0a0a0a);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // Disable animation-related controls to save memory
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0;
    controlsRef.current = controls;
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(1, 1, 1);
    scene.add(light);
    
    // Create Earth with Natural Earth texture
    const earthGeometry = new THREE.SphereGeometry(2, 64, 32);
    const earthTexture = createNaturalEarthTexture();
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      specular: 0x222222,
      shininess: 10,
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    earthRef.current = earth;
    
    const groundTracks = new THREE.Group();
    scene.add(groundTracks);
    groundTracksRef.current = groundTracks;
    
    // Simple render loop without animation
    const render = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      requestAnimationFrame(render);
    };
    render();
    
    return () => {
      // Cleanup to minimize memory usage
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
      // Switch to 2D Mercator view
      earthRef.current.geometry.dispose();
      earthRef.current.geometry = new THREE.PlaneGeometry(4, 2);
      
      cameraRef.current.position.set(0, 0, 10);
      controlsRef.current.enableRotate = false;
      controlsRef.current.update();
    } else {
      // Switch to 3D globe view
      earthRef.current.geometry.dispose();
      earthRef.current.geometry = new THREE.SphereGeometry(2, 64, 32);
      
      cameraRef.current.position.set(0, 0, 5);
      controlsRef.current.enableRotate = true;
      controlsRef.current.update();
    }
  }, [is2D]);

  // Update ground tracks when satellites change
  useEffect(() => {
    if (!groundTracksRef.current || !sceneRef.current || satellites.length === 0) return;
    
    // Clear previous ground tracks to save memory
    while (groundTracksRef.current.children.length > 0) {
      const child = groundTracksRef.current.children[0];
      groundTracksRef.current.remove(child);
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
        child.material.dispose();
      }
    }
    
    if (showGroundTracks) {
      satellites.forEach((satellite, index) => {
        const groundTrackPoints = propagateSatelliteOrbit({
          altitude: satellite.altitude,
          inclination: satellite.inclination,
          raan: satellite.raan,
          trueAnomaly: satellite.trueAnomaly,
          timeSpanHours: timeSpan
        });
        
        const lineColor = satelliteColors[index % satelliteColors.length];
        const trackPoints = [];
        
        for (const point of groundTrackPoints) {
          if (is2D) {
            // 2D Mercator projection
            const x = (point.lng + 180) * (4 / 360) - 2;
            const y = (90 - point.lat) * (2 / 180) - 1;
            trackPoints.push(new THREE.Vector3(x, y, 0.01));
          } else {
            // 3D sphere projection
            const phi = (90 - point.lat) * Math.PI / 180;
            const theta = (point.lng + 180) * Math.PI / 180;
            
            const x = -2.01 * Math.sin(phi) * Math.cos(theta);
            const y = 2.01 * Math.cos(phi);
            const z = 2.01 * Math.sin(phi) * Math.sin(theta);
            
            trackPoints.push(new THREE.Vector3(x, y, z));
          }
        }
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(trackPoints);
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: lineColor,
          linewidth: 2
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        groundTracksRef.current?.add(line);
      });
    }
  }, [satellites, showGroundTracks, propagateSatelliteOrbit, timeSpan, is2D]);

  // Generate heatmap with proper grid resolution and color mapping
  useEffect(() => {
    if (!sceneRef.current || !earthRef.current || satellites.length === 0) return;
    
    // Clear previous heatmap to save memory
    if (heatmapRef.current && heatmapRef.current.parent) {
      sceneRef.current.remove(heatmapRef.current);
      heatmapRef.current.geometry.dispose();
      if (heatmapRef.current.material instanceof THREE.Material) {
        heatmapRef.current.material.dispose();
      }
      heatmapRef.current = null;
    }
    
    if (isHeatmapActive) {
      // Use specified grid resolution (default 180 for global coverage)
      const gridResolution = 180;
      
      const revisitData = calculateRevisits({
        satellites: satellites.map(sat => ({
          altitude: sat.altitude,
          inclination: sat.inclination,
          raan: sat.raan,
          trueAnomaly: sat.trueAnomaly
        })),
        timeSpanHours: timeSpan,
        gridResolution: gridResolution
      });
      
      setHeatmapData(revisitData.grid);
      setMaxRevisitCount(revisitData.maxCount);
      
      // Create heatmap geometry based on projection
      const heatmapGeometry = is2D 
        ? new THREE.PlaneGeometry(4.02, 2.02, gridResolution * 2, gridResolution)
        : new THREE.SphereGeometry(2.01, gridResolution * 2, gridResolution);
      
      // Generate high-resolution texture from revisit data with proper color mapping
      const textureSize = 512;
      const data = new Uint8Array(4 * textureSize * textureSize);
      
      for (let i = 0; i < textureSize; i++) {
        for (let j = 0; j < textureSize; j++) {
          const index = (i * textureSize + j) * 4;
          
          // Map texture coordinates to grid coordinates
          const latIndex = Math.floor((i / textureSize) * revisitData.grid.length);
          const lngIndex = Math.floor((j / textureSize) * revisitData.grid[0].length);
          
          const value = revisitData.grid[latIndex]?.[lngIndex] || 0;
          const normalizedValue = revisitData.maxCount > 0 ? value / revisitData.maxCount : 0;
          
          // Enhanced color mapping for better visualization
          if (normalizedValue > 0.8) {
            // High revisit count - Red
            data[index] = 255;
            data[index + 1] = Math.max(0, 255 - (normalizedValue - 0.8) * 1275);
            data[index + 2] = 0;
          } else if (normalizedValue > 0.6) {
            // Medium-high revisit count - Orange to Red
            data[index] = 255;
            data[index + 1] = Math.floor(255 - (normalizedValue - 0.6) * 1275);
            data[index + 2] = 0;
          } else if (normalizedValue > 0.4) {
            // Medium revisit count - Yellow to Orange
            data[index] = 255;
            data[index + 1] = 255;
            data[index + 2] = Math.floor((0.6 - normalizedValue) * 1275);
          } else if (normalizedValue > 0.2) {
            // Low-medium revisit count - Green to Yellow
            data[index] = Math.floor(255 * (normalizedValue - 0.2) * 5);
            data[index + 1] = 255;
            data[index + 2] = 0;
          } else if (normalizedValue > 0) {
            // Low revisit count - Blue to Green
            data[index] = 0;
            data[index + 1] = Math.floor(255 * normalizedValue * 5);
            data[index + 2] = Math.floor(255 * (0.2 - normalizedValue) * 5);
          } else {
            // No revisit - Transparent
            data[index] = 0;
            data[index + 1] = 0;
            data[index + 2] = 0;
          }
          
          // Set alpha based on revisit count
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
  }, [isHeatmapActive, satellites, calculateRevisits, timeSpan, is2D]);
  
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
      </div>

      {/* Enhanced color bar for heatmap */}
      {isHeatmapActive && maxRevisitCount > 0 && (
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm p-3 rounded text-xs border">
          <div className="text-foreground font-medium mb-2">Revisit Count</div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-6 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 via-orange-500 to-red-500 rounded border"></div>
          </div>
          <div className="flex justify-between text-[10px] text-foreground mt-1">
            <span>0</span>
            <span>{Math.floor(maxRevisitCount/2)}</span>
            <span>{maxRevisitCount}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">
            Grid: {heatmapData.length}×{heatmapData[0]?.length || 0} cells
          </div>
          <div className="text-[10px] text-muted-foreground">
            Time span: {timeSpan}h
          </div>
        </div>
      )}

      {/* Satellite ground tracks legend */}
      {showGroundTracks && satellites.length > 0 && (
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
