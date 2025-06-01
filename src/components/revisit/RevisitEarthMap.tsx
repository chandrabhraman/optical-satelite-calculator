
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { usePropagator } from '@/hooks/usePropagator';
import { Button } from '@/components/ui/button';
import { RotateCcw, Globe, Map } from 'lucide-react';

interface RevisitEarthMapProps {
  isAnalysisRunning?: boolean;
  isHeatmapActive?: boolean;
  showGroundTracks?: boolean;
  satellites?: Array<{
    id: string;
    name: string;
    altitude: number;
    inclination: number;
    raan: number;
    trueAnomaly: number;
  }>;
  timeSpan?: number;
}

const RevisitEarthMap: React.FC<RevisitEarthMapProps> = ({
  isAnalysisRunning = false,
  isHeatmapActive = false,
  showGroundTracks = true,
  satellites = [],
  timeSpan = 24
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const groundTracksRef = useRef<THREE.Group | null>(null);
  const heatmapRef = useRef<THREE.Mesh | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [is2D, setIs2D] = useState(false);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [maxRevisitCount, setMaxRevisitCount] = useState(0);
  
  const { propagateSatelliteOrbit, calculateRevisits } = usePropagator();

  // Satellite colors for ground tracks
  const satelliteColors = [
    0xff4444, // Red
    0x44ff44, // Green
    0x4444ff, // Blue
    0xffff44, // Yellow
    0xff44ff, // Magenta
    0x44ffff, // Cyan
    0xff8844, // Orange
    0x8844ff, // Purple
    0x44ff88, // Light Green
    0xff4488, // Pink
  ];

  // Clear heatmap data and visualization
  const clearHeatmap = () => {
    setHeatmapData([]);
    setMaxRevisitCount(0);
    
    if (heatmapRef.current && sceneRef.current) {
      sceneRef.current.remove(heatmapRef.current);
      heatmapRef.current = null;
    }
  };

  // Toggle between 3D globe and 2D Mercator projection
  const toggleProjection = () => {
    setIs2D(!is2D);
    
    if (!is2D) {
      // Switch to 2D mode
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 0, 10);
        controlsRef.current.enableRotate = false;
        controlsRef.current.update();
      }
    } else {
      // Switch to 3D mode
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 0, 5);
        controlsRef.current.enableRotate = true;
        controlsRef.current.update();
      }
    }
  };

  // Create 2D Mercator canvas
  const create2DCanvas = () => {
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      canvasRef.current = canvas;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 1024, 512);
    
    // Draw Natural Earth style map (simplified)
    ctx.fillStyle = '#2d4a22';
    // Draw simplified continents
    drawSimplifiedContinents(ctx);
    
    return canvasRef.current;
  };

  const drawSimplifiedContinents = (ctx: CanvasRenderingContext2D) => {
    // Simplified continent shapes for Natural Earth style
    ctx.fillStyle = '#2d4a22'; // Natural green
    
    // North America
    ctx.beginPath();
    ctx.moveTo(150, 100);
    ctx.lineTo(300, 80);
    ctx.lineTo(350, 150);
    ctx.lineTo(320, 200);
    ctx.lineTo(200, 180);
    ctx.closePath();
    ctx.fill();
    
    // South America
    ctx.beginPath();
    ctx.moveTo(250, 220);
    ctx.lineTo(300, 250);
    ctx.lineTo(280, 350);
    ctx.lineTo(260, 380);
    ctx.lineTo(240, 300);
    ctx.closePath();
    ctx.fill();
    
    // Europe
    ctx.beginPath();
    ctx.moveTo(480, 100);
    ctx.lineTo(520, 90);
    ctx.lineTo(540, 120);
    ctx.lineTo(500, 140);
    ctx.closePath();
    ctx.fill();
    
    // Africa
    ctx.beginPath();
    ctx.moveTo(500, 150);
    ctx.lineTo(580, 140);
    ctx.lineTo(590, 250);
    ctx.lineTo(550, 320);
    ctx.lineTo(480, 280);
    ctx.lineTo(490, 200);
    ctx.closePath();
    ctx.fill();
    
    // Asia
    ctx.beginPath();
    ctx.moveTo(550, 80);
    ctx.lineTo(750, 70);
    ctx.lineTo(800, 120);
    ctx.lineTo(780, 180);
    ctx.lineTo(600, 160);
    ctx.closePath();
    ctx.fill();
    
    // Australia
    ctx.beginPath();
    ctx.moveTo(720, 280);
    ctx.lineTo(780, 275);
    ctx.lineTo(785, 300);
    ctx.lineTo(750, 310);
    ctx.closePath();
    ctx.fill();
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
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
    controlsRef.current = controls;
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(1, 1, 1);
    scene.add(light);
    
    // Create Earth with Natural Earth texture
    const earthGeometry = new THREE.SphereGeometry(2, 64, 32);
    
    // Create a canvas for Natural Earth style texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Natural Earth color scheme
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#87CEEB'); // Sky blue (poles)
      gradient.addColorStop(0.3, '#98FB98'); // Pale green
      gradient.addColorStop(0.7, '#F4A460'); // Sandy brown
      gradient.addColorStop(1, '#87CEEB'); // Sky blue (poles)
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 512);
      
      // Add some landmass representation
      ctx.fillStyle = '#228B22';
      drawSimplifiedContinents(ctx);
    }
    
    const earthTexture = new THREE.CanvasTexture(canvas);
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
    
    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Update projection if in 2D mode
      if (is2D && earthRef.current) {
        earthRef.current.rotation.x = 0;
        earthRef.current.rotation.z = 0;
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();
    
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Update ground tracks when satellites change
  useEffect(() => {
    if (!groundTracksRef.current || !sceneRef.current || isAnalysisRunning) return;
    
    // Clear previous ground tracks
    while (groundTracksRef.current.children.length > 0) {
      groundTracksRef.current.remove(groundTracksRef.current.children[0]);
    }
    
    if (showGroundTracks && satellites.length > 0) {
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
  }, [satellites, showGroundTracks, isAnalysisRunning, propagateSatelliteOrbit, timeSpan, is2D]);

  // Update camera and Earth based on projection mode
  useEffect(() => {
    if (!earthRef.current || !cameraRef.current || !controlsRef.current) return;
    
    if (is2D) {
      // Switch to 2D view
      earthRef.current.geometry = new THREE.PlaneGeometry(4, 2);
      
      // Update texture for 2D
      const canvas2D = create2DCanvas();
      if (canvas2D) {
        const texture2D = new THREE.CanvasTexture(canvas2D);
        if (earthRef.current.material instanceof THREE.MeshPhongMaterial) {
          earthRef.current.material.map = texture2D;
          earthRef.current.material.needsUpdate = true;
        }
      }
      
      cameraRef.current.position.set(0, 0, 10);
      controlsRef.current.enableRotate = false;
      controlsRef.current.update();
    } else {
      // Switch to 3D view
      earthRef.current.geometry = new THREE.SphereGeometry(2, 64, 32);
      
      // Restore 3D texture
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#98FB98');
        gradient.addColorStop(0.7, '#F4A460');
        gradient.addColorStop(1, '#87CEEB');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 512);
        
        ctx.fillStyle = '#228B22';
        drawSimplifiedContinents(ctx);
      }
      
      const earthTexture = new THREE.CanvasTexture(canvas);
      if (earthRef.current.material instanceof THREE.MeshPhongMaterial) {
        earthRef.current.material.map = earthTexture;
        earthRef.current.material.needsUpdate = true;
      }
      
      cameraRef.current.position.set(0, 0, 5);
      controlsRef.current.enableRotate = true;
      controlsRef.current.update();
    }
  }, [is2D]);

  // Generate heatmap
  useEffect(() => {
    if (!sceneRef.current || !earthRef.current) return;
    
    if (heatmapRef.current && heatmapRef.current.parent) {
      sceneRef.current.remove(heatmapRef.current);
      heatmapRef.current = null;
    }
    
    if (isHeatmapActive && satellites.length > 0) {
      const revisitData = calculateRevisits({
        satellites: satellites.map(sat => ({
          altitude: sat.altitude,
          inclination: sat.inclination,
          raan: sat.raan,
          trueAnomaly: sat.trueAnomaly
        })),
        timeSpanHours: timeSpan,
        gridResolution: 180
      });
      
      setHeatmapData(revisitData.grid);
      setMaxRevisitCount(revisitData.maxCount);
      
      // Create heatmap geometry based on projection
      const heatmapGeometry = is2D 
        ? new THREE.PlaneGeometry(4.02, 2.02)
        : new THREE.SphereGeometry(2.01, 180, 90);
      
      // Generate texture from revisit data
      const size = 256;
      const data = new Uint8Array(4 * size * size);
      
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const index = (i * size + j) * 4;
          
          const latIndex = Math.floor((i / size) * revisitData.grid.length);
          const lngIndex = Math.floor((j / size) * revisitData.grid[0].length);
          
          const value = revisitData.grid[latIndex][lngIndex];
          const normalizedValue = revisitData.maxCount > 0 ? value / revisitData.maxCount : 0;
          const alpha = 180;
          
          if (normalizedValue > 0.7) {
            data[index] = 255;
            data[index + 1] = Math.max(0, 255 - (normalizedValue - 0.7) * 850);
            data[index + 2] = 0;
          } else if (normalizedValue > 0.3) {
            data[index] = 255;
            data[index + 1] = 255;
            data[index + 2] = 0;
          } else if (normalizedValue > 0) {
            data[index] = normalizedValue * 510;
            data[index + 1] = 255;
            data[index + 2] = 0;
          } else {
            data[index] = 0;
            data[index + 1] = 0;
            data[index + 2] = 0;
          }
          
          data[index + 3] = normalizedValue > 0 ? alpha : 0;
        }
      }
      
      const heatmapTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      heatmapTexture.needsUpdate = true;
      
      const heatmapMaterial = new THREE.MeshBasicMaterial({
        map: heatmapTexture,
        transparent: true,
        opacity: 0.7,
      });
      
      const heatmap = new THREE.Mesh(heatmapGeometry, heatmapMaterial);
      if (is2D) {
        heatmap.position.z = 0.01;
      }
      sceneRef.current.add(heatmap);
      heatmapRef.current = heatmap;
    }
  }, [isHeatmapActive, satellites, calculateRevisits, timeSpan, is2D]);
  
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
          {is2D ? '3D Globe' : '2D Map'}
        </Button>
      </div>

      {/* Legend */}
      {isHeatmapActive && (
        <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm p-2 rounded text-xs">
          <div className="text-white font-medium mb-1">Revisit Count</div>
          <div className="flex items-center gap-1">
            <div className="w-24 h-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded"></div>
          </div>
          <div className="flex justify-between text-[10px] text-white mt-0.5">
            <span>Low</span>
            <span>High</span>
          </div>
          <div className="text-[10px] text-white mt-1">
            Max: {maxRevisitCount} revisits
          </div>
        </div>
      )}

      {/* Satellite legend */}
      {showGroundTracks && satellites.length > 0 && (
        <div className="absolute bottom-16 left-2 bg-background/70 backdrop-blur-sm p-2 rounded text-xs max-w-[200px]">
          <div className="text-white font-medium mb-1">Ground Tracks</div>
          {satellites.slice(0, 6).map((satellite, index) => (
            <div key={satellite.id} className="flex items-center gap-2 text-[10px]">
              <div 
                className="w-3 h-1 rounded"
                style={{ backgroundColor: `#${satelliteColors[index % satelliteColors.length].toString(16).padStart(6, '0')}` }}
              ></div>
              <span className="text-white truncate">{satellite.name}</span>
            </div>
          ))}
          {satellites.length > 6 && (
            <div className="text-[10px] text-white/60 mt-1">
              +{satellites.length - 6} more satellites
            </div>
          )}
        </div>
      )}

      {/* Controls info */}
      <div className="absolute bottom-2 left-2 bg-background/70 backdrop-blur-sm p-2 rounded text-xs text-white">
        <div>{is2D ? 'Click and drag to pan' : 'Click and drag to rotate'}</div>
        <div>Scroll to zoom</div>
      </div>

      {/* Simulation info */}
      <div className="absolute top-16 left-2 bg-background/70 backdrop-blur-sm p-2 rounded text-xs text-white max-w-[200px]">
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
