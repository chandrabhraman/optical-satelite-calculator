import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface RevisitEarthMapProps {
  isAnalysisRunning?: boolean;
  isHeatmapActive?: boolean;
  showGroundTracks?: boolean;
}

const RevisitEarthMap: React.FC<RevisitEarthMapProps> = ({
  isAnalysisRunning = false,
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
  
  // Add mock ground tracks when analysis is complete
  useEffect(() => {
    if (!groundTracksRef.current || !sceneRef.current || isAnalysisRunning) return;
    
    if (showGroundTracks && groundTracksRef.current.children.length === 0) {
      // Create mock ground tracks for visualization
      const createMockGroundTrack = (offset: number, color: number) => {
        const points = [];
        for (let i = 0; i <= 100; i++) {
          const t = i / 100 * Math.PI * 2;
          const x = 2 * Math.sin(t + offset) * Math.cos(t * 3 + offset);
          const y = 2 * Math.sin(t * 2);
          const z = 2 * Math.cos(t + offset) * Math.cos(t * 3 + offset);
          points.push(new THREE.Vector3(x, y, z));
        }
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        return line;
      };
      
      // Add several tracks with different colors
      const track1 = createMockGroundTrack(0, 0xff0000);  // Red
      const track2 = createMockGroundTrack(Math.PI / 3, 0x00ff00);  // Green
      const track3 = createMockGroundTrack(Math.PI / 1.5, 0x0000ff);  // Blue
      const track4 = createMockGroundTrack(Math.PI, 0xffff00);  // Yellow
      const track5 = createMockGroundTrack(Math.PI * 1.33, 0xff00ff);  // Magenta
      
      groundTracksRef.current.add(track1, track2, track3, track4, track5);
    } else if (!showGroundTracks && groundTracksRef.current.children.length > 0) {
      // Remove all ground tracks
      while (groundTracksRef.current.children.length) {
        groundTracksRef.current.remove(groundTracksRef.current.children[0]);
      }
    }
  }, [showGroundTracks, isAnalysisRunning]);
  
  // Create heatmap overlay
  useEffect(() => {
    if (!sceneRef.current || !earthRef.current) return;
    
    if (isHeatmapActive && !heatmapRef.current) {
      // Create a UV-mapped sphere slightly larger than Earth for the heatmap
      const heatmapGeometry = new THREE.SphereGeometry(2.01, 32, 32);
      
      // Create heatmap texture - this would be generated from actual data
      const size = 256;
      const data = new Uint8Array(4 * size * size);
      
      // Generate mock heatmap data
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const index = (i * size + j) * 4;
          
          // Create patterns of revisit frequency - mock data
          const lat = (i / size - 0.5) * Math.PI;
          const value = Math.pow(Math.cos(lat * 3), 2) * 255;
          const alpha = 180;  // Semi-transparent
          
          data[index] = value > 200 ? 255 : value < 100 ? 0 : (value - 100) * 2.55; // R
          data[index + 1] = value < 100 ? (value) * 2.55 : 255 - (value - 100) * 1.55; // G
          data[index + 2] = 0; // B
          data[index + 3] = alpha; // A
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
    } else if (!isHeatmapActive && heatmapRef.current) {
      // Remove heatmap if it exists but should not be shown
      sceneRef.current.remove(heatmapRef.current);
      heatmapRef.current = null;
    }
  }, [isHeatmapActive]);
  
  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden relative">
      <div className="absolute bottom-2 left-2 bg-background/70 backdrop-blur-sm p-2 rounded text-xs text-white">
        <div>Click and drag to rotate</div>
        <div>Scroll to zoom</div>
      </div>
    </div>
  );
};

export default RevisitEarthMap;
