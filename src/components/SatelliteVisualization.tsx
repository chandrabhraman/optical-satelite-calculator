
import { useEffect, useRef } from 'react';
import { SensorInputs } from '@/utils/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface SatelliteVisualizationProps {
  inputs: SensorInputs | null;
}

const SatelliteVisualization = ({ inputs }: SatelliteVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    satellite: THREE.Group;
    sensorField: THREE.Mesh;
    earth: THREE.Mesh;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initialize the scene or clean up existing scene
    if (sceneRef.current) {
      sceneRef.current.renderer.dispose();
      sceneRef.current.scene.clear();
      cancelAnimationFrame(sceneRef.current.animationId);
    }

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A0F1A);
    
    // Add subtle fog for depth
    scene.fog = new THREE.FogExp2(0x0A0F1A, 0.00025);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100000
    );
    camera.position.set(0, 5000, 10000);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    // Add directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(5000, 3000, 5000);
    scene.add(directionalLight);
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Create Earth
    const earthRadius = 6371; // Earth radius in km
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2233FF,
      emissive: 0x112244,
      specular: 0x223344,
      shininess: 25
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    
    // Create Satellite Group
    const satellite = new THREE.Group();
    scene.add(satellite);
    
    // Satellite Body
    const satelliteGeometry = new THREE.BoxGeometry(300, 100, 200);
    const satelliteMaterial = new THREE.MeshPhongMaterial({
      color: 0xCCCCCC,
      emissive: 0x333333,
      specular: 0x111111,
      shininess: 50
    });
    const satelliteBody = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
    satellite.add(satelliteBody);
    
    // Solar Panels
    const panelGeometry = new THREE.BoxGeometry(500, 5, 200);
    const panelMaterial = new THREE.MeshPhongMaterial({
      color: 0x2244AA,
      emissive: 0x112233,
      specular: 0x111122,
      shininess: 80
    });
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.x = -400;
    satellite.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.x = 400;
    satellite.add(rightPanel);
    
    // Create default sensor field
    const sensorFieldGeometry = new THREE.ConeGeometry(2000, 4000, 32);
    const sensorFieldMaterial = new THREE.MeshBasicMaterial({
      color: 0xF2FCE2,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const sensorField = new THREE.Mesh(sensorFieldGeometry, sensorFieldMaterial);
    sensorField.rotation.x = Math.PI; // Point down toward Earth
    sensorField.position.y = -100;
    satellite.add(sensorField);
    
    // Position satellite
    satellite.position.y = 6371 + 600; // Earth radius + altitude in km
    
    // Update visualization if inputs are provided
    if (inputs) {
      updateVisualization(inputs);
    }
    
    // Handle window resize
    const handleResize = () => {
      if (containerRef.current) {
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }
    };
    
    animate();
    
    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      satellite,
      sensorField,
      earth,
      animationId: 0
    };
    
    // Update visualization function
    function updateVisualization(inputs: SensorInputs) {
      if (!sceneRef.current) return;
      
      // Calculate sensor field dimensions
      const altitude = inputs.altitudeMax / 1000; // Convert to km
      
      // Calculate FOV based on inputs
      const sensorWidthH = inputs.pixelSize * inputs.pixelCountH / 1000; // in mm
      const fovH = 2 * Math.atan(sensorWidthH / (2 * inputs.focalLength));
      
      const fieldRadius = altitude * Math.tan(fovH / 2);
      
      // Update satellite position
      sceneRef.current.satellite.position.y = 6371 + altitude;
      
      // Update sensor field
      sceneRef.current.satellite.remove(sceneRef.current.sensorField);
      
      const newSensorFieldGeometry = new THREE.ConeGeometry(fieldRadius, altitude, 32);
      const sensorFieldMaterial = new THREE.MeshBasicMaterial({
        color: 0xF2FCE2,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const newSensorField = new THREE.Mesh(newSensorFieldGeometry, sensorFieldMaterial);
      newSensorField.rotation.x = Math.PI;
      newSensorField.position.y = -100;
      
      // If off-nadir angle is present, rotate the sensor field
      if (inputs.nominalOffNadirAngle > 0) {
        const offNadirRad = (inputs.nominalOffNadirAngle * Math.PI) / 180;
        newSensorField.rotation.z = offNadirRad;
      }
      
      sceneRef.current.satellite.add(newSensorField);
      sceneRef.current.sensorField = newSensorField;
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        if (containerRef.current) {
          containerRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current.renderer.dispose();
      }
    };
  }, []);

  // Update visualization when inputs change
  useEffect(() => {
    if (sceneRef.current && inputs) {
      // Calculate sensor field dimensions
      const altitude = inputs.altitudeMax / 1000; // Convert to km
      
      // Calculate FOV based on inputs
      const sensorWidthH = inputs.pixelSize * inputs.pixelCountH / 1000; // in mm
      const fovH = 2 * Math.atan(sensorWidthH / (2 * inputs.focalLength));
      
      const fieldRadius = altitude * Math.tan(fovH / 2);
      
      // Update satellite position
      sceneRef.current.satellite.position.y = 6371 + altitude;
      
      // Update sensor field
      sceneRef.current.satellite.remove(sceneRef.current.sensorField);
      
      const newSensorFieldGeometry = new THREE.ConeGeometry(fieldRadius, altitude, 32);
      const sensorFieldMaterial = new THREE.MeshBasicMaterial({
        color: 0xF2FCE2,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const newSensorField = new THREE.Mesh(newSensorFieldGeometry, sensorFieldMaterial);
      newSensorField.rotation.x = Math.PI;
      newSensorField.position.y = -100;
      
      // If off-nadir angle is present, rotate the sensor field
      if (inputs.maxOffNadirAngle > 0) {
        const offNadirRad = (inputs.maxOffNadirAngle * Math.PI) / 180;
        newSensorField.rotation.z = offNadirRad;
      }
      
      sceneRef.current.satellite.add(newSensorField);
      sceneRef.current.sensorField = newSensorField;
    }
  }, [inputs]);

  return (
    <Card className="glassmorphism w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">Satellite Sensor Field Visualization</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0 relative">
        <div ref={containerRef} className="w-full h-full min-h-[400px]" />
        <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
          <p>Click and drag to rotate. Scroll to zoom.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SatelliteVisualization;
