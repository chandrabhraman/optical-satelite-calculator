
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
    stars: THREE.Points;
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
    scene.fog = new THREE.FogExp2(0x0A0F1A, 0.00005);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      200000
    );
    camera.position.set(0, 2000, 15000);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Add directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(5000, 3000, 5000);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Add hemisphere light for better global illumination
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.5);
    scene.add(hemisphereLight);
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 7000; // Prevent zooming too close
    controls.maxDistance = 25000; // Prevent zooming too far

    // Create stars background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100000;
      positions[i + 1] = (Math.random() - 0.5) * 100000;
      positions[i + 2] = (Math.random() - 0.5) * 100000;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Create Earth
    const earthRadius = 6371; // Earth radius in km
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthTextureLoader = new THREE.TextureLoader();
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2233FF,
      emissive: 0x112244,
      specular: 0x223344,
      shininess: 25
    });
    
    // Load earth texture if available
    earthTextureLoader.load(
      'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
      (texture) => {
        earthMaterial.map = texture;
        earthMaterial.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.log('Error loading Earth texture:', err);
      }
    );
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.receiveShadow = true;
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
    satelliteBody.castShadow = true;
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
    leftPanel.castShadow = true;
    satellite.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.x = 400;
    rightPanel.castShadow = true;
    satellite.add(rightPanel);
    
    // Create default sensor field
    const sensorFieldGeometry = new THREE.ConeGeometry(2000, 4000, 32);
    const sensorFieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const sensorField = new THREE.Mesh(sensorFieldGeometry, sensorFieldMaterial);
    sensorField.rotation.x = Math.PI; // Point down toward Earth
    sensorField.position.y = 0; // Centered on satellite
    satellite.add(sensorField);
    
    // Position satellite
    satellite.position.y = earthRadius + 600; // Earth radius + altitude in km
    
    // Update visualization if inputs are provided
    if (inputs) {
      updateVisualization(inputs);
    }
    
    // Camera positioning helpers
    function focusOnSatellite() {
      const offset = satellite.position.clone().add(new THREE.Vector3(0, 0, 2000));
      camera.position.copy(offset);
      controls.target.copy(satellite.position);
      controls.update();
    }
    
    // Initial camera position
    focusOnSatellite();
    
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
      
      // Slow rotation of Earth
      earth.rotation.y += 0.0005;
      
      // Make stars twinkle slightly
      stars.rotation.y += 0.0001;
      
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
      stars,
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
      
      // Calculate field width at ground level
      const fieldRadius = altitude * Math.tan(fovH / 2);
      
      // Update satellite position
      sceneRef.current.satellite.position.y = earthRadius + altitude;
      
      // Update sensor field
      sceneRef.current.satellite.remove(sceneRef.current.sensorField);
      
      const newSensorFieldGeometry = new THREE.ConeGeometry(fieldRadius, altitude, 32);
      const sensorFieldMaterial = new THREE.MeshBasicMaterial({
        color: 0x4CAF50,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const newSensorField = new THREE.Mesh(newSensorFieldGeometry, sensorFieldMaterial);
      
      // Center the cone's base at the satellite's position
      newSensorField.rotation.x = Math.PI;
      newSensorField.position.y = 0; // Center at satellite position
      
      // If off-nadir angle is present, rotate the sensor field
      if (inputs.nominalOffNadirAngle > 0) {
        const offNadirRad = (inputs.nominalOffNadirAngle * Math.PI) / 180;
        newSensorField.rotation.z = offNadirRad;
      }
      
      sceneRef.current.satellite.add(newSensorField);
      sceneRef.current.sensorField = newSensorField;
      
      // Reposition camera to focus on satellite
      sceneRef.current.controls.target.copy(sceneRef.current.satellite.position);
      sceneRef.current.controls.update();
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
      const earthRadius = 6371; // Earth radius in km
      const altitude = inputs.altitudeMax / 1000; // Convert to km
      
      // Calculate FOV based on inputs
      const sensorWidthH = inputs.pixelSize * inputs.pixelCountH / 1000; // in mm
      const fovH = 2 * Math.atan(sensorWidthH / (2 * inputs.focalLength));
      
      // Calculate field width at ground level
      const fieldRadius = altitude * Math.tan(fovH / 2);
      
      // Update satellite position
      sceneRef.current.satellite.position.y = earthRadius + altitude;
      
      // Update sensor field
      sceneRef.current.satellite.remove(sceneRef.current.sensorField);
      
      const newSensorFieldGeometry = new THREE.ConeGeometry(fieldRadius, altitude, 32);
      const sensorFieldMaterial = new THREE.MeshBasicMaterial({
        color: 0x4CAF50,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false // Helps with transparency sorting
      });
      const newSensorField = new THREE.Mesh(newSensorFieldGeometry, sensorFieldMaterial);
      
      // Center the cone's base at the satellite's position
      newSensorField.rotation.x = Math.PI;
      newSensorField.position.y = 0; // Center at satellite position
      
      // If off-nadir angle is present, rotate the sensor field
      if (inputs.maxOffNadirAngle > 0) {
        const offNadirRad = (inputs.maxOffNadirAngle * Math.PI) / 180;
        newSensorField.rotation.z = offNadirRad;
      }
      
      sceneRef.current.satellite.add(newSensorField);
      sceneRef.current.sensorField = newSensorField;
      
      // Update camera to focus on satellite
      sceneRef.current.controls.target.copy(sceneRef.current.satellite.position);
      sceneRef.current.controls.update();
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
