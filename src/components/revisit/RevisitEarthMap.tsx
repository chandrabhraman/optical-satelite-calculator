
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { usePropagator } from '@/hooks/usePropagator';

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
  timeSpan?: number; // in hours
}

const RevisitEarthMap: React.FC<RevisitEarthMapProps> = ({
  isAnalysisRunning = false,
  isHeatmapActive = false,
  showGroundTracks = true,
  satellites = [],
  timeSpan = 24 // default 24 hours
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const groundTracksRef = useRef<THREE.Group | null>(null);
  const heatmapRef = useRef<THREE.Mesh | null>(null);
  
  // Use our propagator hook
  const { propagateSatelliteOrbit, calculateRevisits } = usePropagator();
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [maxRevisitCount, setMaxRevisitCount] = useState(0);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x111827); // Dark background
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Add directional light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(light);
    
    // Create Earth
    const earthGeometry = new THREE.SphereGeometry(2, 32, 32);
    const earthTexture = new THREE.TextureLoader().load('/earth_map.jpg');
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      specular: 0x333333,
      shininess: 5,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    earthRef.current = earth;
    
    // Create empty group for ground tracks
    const groundTracks = new THREE.Group();
    scene.add(groundTracks);
    groundTracksRef.current = groundTracks;
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);
  
  // Update ground tracks when satellites configuration changes
  useEffect(() => {
    if (!groundTracksRef.current || !sceneRef.current || isAnalysisRunning) return;
    
    // Clear previous ground tracks
    while (groundTracksRef.current.children.length > 0) {
      groundTracksRef.current.remove(groundTracksRef.current.children[0]);
    }
    
    if (showGroundTracks && satellites.length > 0) {
      // For each satellite, generate real ground track using SGP4 propagator
      satellites.forEach((satellite, index) => {
        // Propagate satellite orbit for the specified timespan
        const groundTrackPoints = propagateSatelliteOrbit({
          altitude: satellite.altitude,
          inclination: satellite.inclination,
          raan: satellite.raan,
          trueAnomaly: satellite.trueAnomaly,
          timeSpanHours: timeSpan
        });
        
        // Create visual representation of the ground track
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        const lineColor = colors[index % colors.length];
        
        const trackPoints = [];
        for (const point of groundTrackPoints) {
          // Convert lat/long to 3D coordinates on Earth's surface
          const phi = (90 - point.lat) * Math.PI / 180;
          const theta = (point.lng + 180) * Math.PI / 180;
          
          const x = -2 * Math.sin(phi) * Math.cos(theta);
          const y = 2 * Math.cos(phi);
          const z = 2 * Math.sin(phi) * Math.sin(theta);
          
          trackPoints.push(new THREE.Vector3(x, y, z));
        }
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(trackPoints);
        const lineMaterial = new THREE.LineBasicMaterial({ color: lineColor });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        groundTracksRef.current.add(line);
      });
    }
  }, [satellites, showGroundTracks, isAnalysisRunning, propagateSatelliteOrbit, timeSpan]);
  
  // Generate heatmap based on satellite revisit data
  useEffect(() => {
    if (!sceneRef.current || !earthRef.current) return;
    
    // Remove existing heatmap
    if (heatmapRef.current && heatmapRef.current.parent) {
      sceneRef.current.remove(heatmapRef.current);
      heatmapRef.current = null;
    }
    
    if (isHeatmapActive) {
      if (satellites.length > 0) {
        // Calculate real revisit data for all satellites
        const revisitData = calculateRevisits({
          satellites: satellites.map(sat => ({
            altitude: sat.altitude,
            inclination: sat.inclination,
            raan: sat.raan,
            trueAnomaly: sat.trueAnomaly
          })),
          timeSpanHours: timeSpan,
          gridResolution: 180 // Number of cells in latitude direction
        });
        
        setHeatmapData(revisitData.grid);
        setMaxRevisitCount(revisitData.maxCount);
        
        // Create a UV-mapped sphere slightly larger than Earth for the heatmap
        const heatmapGeometry = new THREE.SphereGeometry(2.01, 180, 90);
        
        // Generate texture from revisit data
        const size = 256;
        const data = new Uint8Array(4 * size * size);
        
        // Map revisit data to colors
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            const index = (i * size + j) * 4;
            
            // Sample from our revisit grid (scale coordinates to match grid resolution)
            const latIndex = Math.floor((i / size) * revisitData.grid.length);
            const lngIndex = Math.floor((j / size) * revisitData.grid[0].length);
            
            const value = revisitData.grid[latIndex][lngIndex];
            const normalizedValue = revisitData.maxCount > 0 ? value / revisitData.maxCount : 0;
            const alpha = 180; // Semi-transparent
            
            // Apply color based on normalized value (red for high revisit, green for low)
            if (normalizedValue > 0.7) {
              // Red - high revisit count
              data[index] = 255;
              data[index + 1] = Math.max(0, 255 - (normalizedValue - 0.7) * 850);
              data[index + 2] = 0;
            } else if (normalizedValue > 0.3) {
              // Yellow - medium revisit count
              data[index] = 255;
              data[index + 1] = 255;
              data[index + 2] = 0;
            } else if (normalizedValue > 0) {
              // Green - low revisit count
              data[index] = normalizedValue * 510;
              data[index + 1] = 255;
              data[index + 2] = 0;
            } else {
              // No revisits
              data[index] = 0;
              data[index + 1] = 0;
              data[index + 2] = 0;
            }
            
            data[index + 3] = normalizedValue > 0 ? alpha : 0; // Make zero revisit areas transparent
          }
        }
        
        // Create texture from data
        const heatmapTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        heatmapTexture.needsUpdate = true;
        
        const heatmapMaterial = new THREE.MeshBasicMaterial({
          map: heatmapTexture,
          transparent: true,
          opacity: 0.7,
        });
        
        const heatmap = new THREE.Mesh(heatmapGeometry, heatmapMaterial);
        sceneRef.current.add(heatmap);
        heatmapRef.current = heatmap;
      }
    }
  }, [isHeatmapActive, satellites, calculateRevisits, timeSpan]);
  
  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden relative">
      {isHeatmapActive && (
        <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm p-2 rounded text-xs">
          <div className="text-white font-medium mb-1">Revisit Count Legend</div>
          <div className="flex items-center gap-1">
            <div className="w-full h-6 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded"></div>
          </div>
          <div className="flex justify-between text-[10px] text-white mt-0.5">
            <span>Low (1-2)</span>
            <span>Medium (3-5)</span>
            <span>High (6+)</span>
          </div>
          <div className="text-[10px] text-white mt-1">
            Max observed: {maxRevisitCount} revisits
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-background/70 backdrop-blur-sm p-2 rounded text-xs text-white">
        <div>Click and drag to rotate</div>
        <div>Scroll to zoom</div>
      </div>
      {/* Simulation information label */}
      <div className="absolute top-2 left-2 bg-background/70 backdrop-blur-sm p-2 rounded text-xs text-white max-w-[200px]">
        <div className="font-medium mb-1">Simulation Info</div>
        <div className="text-[10px]">Using SGP4 propagator via Orekit.js for orbit calculations</div>
        <div className="text-[10px] mt-1">
          {satellites.length} satellite{satellites.length !== 1 ? 's' : ''} simulated over {timeSpan} hours
        </div>
      </div>
    </div>
  );
};

export default RevisitEarthMap;
