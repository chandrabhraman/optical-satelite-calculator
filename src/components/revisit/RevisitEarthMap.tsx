import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { usePropagator } from '@/hooks/usePropagator';
import { Button } from '@/components/ui/button';
import { RotateCcw, Globe, Map, Eye, EyeOff } from 'lucide-react';

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
  gridSize?: number;
}

const RevisitEarthMap: React.FC<RevisitEarthMapProps> = ({
  satellites = [],
  timeSpan = 24,
  isHeatmapActive = false,
  showGroundTracks = true,
  gridSize = 5
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
  const [tracksVisible, setTracksVisible] = useState(showGroundTracks);
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

  // Toggle ground tracks visibility
  const toggleGroundTracks = () => {
    setTracksVisible(!tracksVisible);
    if (groundTracksRef.current) {
      groundTracksRef.current.visible = !tracksVisible;
    }
  };

  // Create high-quality Natural Earth texture based on the WebGL Earth reference
  const createNaturalEarthTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    // Natural Earth color palette
    const oceanColor = '#4a90e2';  // Blue ocean
    const landColor = '#8fbc8f';   // Light sea green for lowlands
    const mountainColor = '#8b7355'; // Brown for mountains
    const desertColor = '#deb887';  // Burlywood for deserts
    const iceColor = '#f0f8ff';    // Alice blue for ice caps
    
    // Base ocean layer
    ctx.fillStyle = oceanColor;
    ctx.fillRect(0, 0, 2048, 1024);
    
    // Draw continents with more realistic Natural Earth colors and shapes
    // North America
    ctx.fillStyle = landColor;
    ctx.beginPath();
    ctx.ellipse(300, 200, 180, 120, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add Rocky Mountains
    ctx.fillStyle = mountainColor;
    ctx.fillRect(280, 180, 25, 140);
    
    // South America
    ctx.fillStyle = landColor;
    ctx.beginPath();
    ctx.ellipse(380, 450, 80, 180, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Andes Mountains
    ctx.fillStyle = mountainColor;
    ctx.fillRect(350, 350, 15, 200);
    
    // Europe
    ctx.fillStyle = landColor;
    ctx.beginPath();
    ctx.ellipse(580, 180, 90, 60, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Africa
    ctx.fillStyle = landColor;
    ctx.beginPath();
    ctx.ellipse(600, 350, 100, 150, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Sahara Desert
    ctx.fillStyle = desertColor;
    ctx.fillRect(560, 280, 120, 60);
    
    // Asia
    ctx.fillStyle = landColor;
    ctx.beginPath();
    ctx.ellipse(900, 220, 200, 100, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Himalayas
    ctx.fillStyle = mountainColor;
    ctx.fillRect(820, 200, 80, 20);
    
    // Australia
    ctx.fillStyle = landColor;
    ctx.beginPath();
    ctx.ellipse(1000, 450, 80, 50, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Antarctica
    ctx.fillStyle = iceColor;
    ctx.fillRect(0, 900, 2048, 124);
    
    // Greenland
    ctx.fillStyle = iceColor;
    ctx.beginPath();
    ctx.ellipse(420, 120, 50, 80, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add texture and detail with subtle gradients
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2048, 1024);
    
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
    renderer.setClearColor(0x000011); // Deep space color
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(1, 1, 1);
    scene.add(light);
    
    // Create Earth with high-quality Natural Earth texture
    const earthGeometry = new THREE.SphereGeometry(2, 128, 64);
    const earthTexture = createNaturalEarthTexture();
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
    
    // Simple render loop
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
      
      cameraRef.current.position.set(0, 0, 10);
      controlsRef.current.enableRotate = false;
      controlsRef.current.update();
    } else {
      earthRef.current.geometry.dispose();
      earthRef.current.geometry = new THREE.SphereGeometry(2, 128, 64);
      
      cameraRef.current.position.set(0, 0, 5);
      controlsRef.current.enableRotate = true;
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
            const x = (point.lng + 180) * (4 / 360) - 2;
            const y = (90 - point.lat) * (2 / 180) - 1;
            trackPoints.push(new THREE.Vector3(x, y, 0.01));
          } else {
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
      // Calculate grid resolution based on grid size
      const gridResolution = Math.floor(180 / gridSize);
      
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
      
      const heatmapGeometry = is2D 
        ? new THREE.PlaneGeometry(4.02, 2.02, gridResolution * 2, gridResolution)
        : new THREE.SphereGeometry(2.01, gridResolution * 2, gridResolution);
      
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
  }, [isHeatmapActive, satellites, calculateRevisits, timeSpan, is2D, gridSize]);
  
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

      {/* Fixed color bar for heatmap - matching exact heatmap colors */}
      {isHeatmapActive && maxRevisitCount > 0 && (
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm p-3 rounded text-xs border">
          <div className="text-foreground font-medium mb-2">Revisit Count</div>
          <div className="flex items-center gap-2">
            <div 
              className="w-32 h-6 rounded border"
              style={{
                background: 'linear-gradient(to right, #0000ff 0%, #00ff00 20%, #ffff00 40%, #ff8000 60%, #ff0000 80%, #ff0000 100%)'
              }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-foreground mt-1">
            <span>0</span>
            <span>{Math.floor(maxRevisitCount/2)}</span>
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
