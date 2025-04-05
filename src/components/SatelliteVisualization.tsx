
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
    sensorFootprint: THREE.Mesh | null;
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
    
    // Create default sensor field (will be updated when inputs change)
    // Default cone with apex at origin (satellite) pointing downward and expanding toward Earth
    const defaultSensorAngle = Math.PI / 12; // 15 degrees
    const sensorFieldGeometry = new THREE.ConeGeometry(
      Math.tan(defaultSensorAngle) * 600, // Base radius based on height and angle
      600, // Height
      32 // Segments
    );
    const sensorFieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const sensorField = new THREE.Mesh(sensorFieldGeometry, sensorFieldMaterial);
    
    // Correctly orient the cone to expand outward toward Earth (point down)
    // In Three.js, default cone has its apex at (0,h/2,0) and base at (0,-h/2,0), pointing along -Y axis
    sensorField.rotation.x = Math.PI; // Rotate 180 degrees to point down
    sensorField.position.y = -50; // Position slightly below satellite center
    satellite.add(sensorField);
    
    // Create default sensor footprint on Earth (will be updated when inputs change)
    const sensorFootprint = null; // Will be created when inputs are provided
    
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
      sensorFootprint,
      earth,
      stars,
      animationId: 0
    };
    
    // Update visualization function
    function updateVisualization(inputs: SensorInputs) {
      if (!sceneRef.current) return;
      
      // Calculate sensor field dimensions
      const earthRadius = 6371; // Earth radius in km
      const altitude = inputs.altitudeMax / 1000; // Convert to km
      
      // Calculate FOV based on inputs
      const sensorWidthH = inputs.pixelSize * inputs.pixelCountH / 1000; // in mm
      const fovH = 2 * Math.atan(sensorWidthH / (2 * inputs.focalLength));
      
      // Update satellite position
      sceneRef.current.satellite.position.y = earthRadius + altitude;
      
      // Remove existing sensor field and footprint if they exist
      if (sceneRef.current.sensorField) {
        sceneRef.current.satellite.remove(sceneRef.current.sensorField);
      }
      
      if (sceneRef.current.sensorFootprint) {
        sceneRef.current.scene.remove(sceneRef.current.sensorFootprint);
      }
      
      // Calculate off-nadir angle in radians
      const offNadirRad = (inputs.nominalOffNadirAngle * Math.PI) / 180;
      
      // Calculate the height of the sensor field cone
      const coneHeight = altitude;
      
      // Calculate sensor field cone base radius based on FOV and altitude
      const coneRadius = altitude * Math.tan(fovH / 2);
      
      // Create sensor field cone geometry
      // In Three.js, the ConeGeometry constructor creates a cone with its base 
      // at the origin and its apex pointing up along the positive y-axis
      const sensorFieldGeometry = new THREE.ConeGeometry(
        coneRadius, // Base radius 
        coneHeight, // Height
        32 // Segments
      );
      
      const sensorFieldMaterial = new THREE.MeshBasicMaterial({
        color: 0x4CAF50,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      
      const newSensorField = new THREE.Mesh(sensorFieldGeometry, sensorFieldMaterial);
      
      // We need to position and rotate the cone so that:
      // 1. The apex is at the satellite
      // 2. The cone points toward Earth
      // 3. The cone expands outward from the satellite
      
      // First, rotate the cone so it points down (along -Y axis)
      newSensorField.rotation.x = Math.PI;
      
      // Now position it so the apex is at the satellite's center
      // Shift it down by half the cone height
      newSensorField.position.y = -coneHeight / 2;
      
      // Apply off-nadir rotation if specified
      if (offNadirRad > 0) {
        newSensorField.rotation.z = offNadirRad;
      }
      
      sceneRef.current.satellite.add(newSensorField);
      sceneRef.current.sensorField = newSensorField;
      
      // Create sensor footprint on Earth
      // Calculate footprint size based on FOV and altitude
      let footprintRadius = earthRadius * Math.sin(Math.atan(coneRadius / altitude));
      if (footprintRadius > earthRadius) footprintRadius = earthRadius * 0.5; // Limit size for visualization
      
      // Create footprint geometry
      const footprintGeometry = new THREE.CircleGeometry(footprintRadius, 32);
      const footprintMaterial = new THREE.MeshBasicMaterial({
        color: 0x4CAF50,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      
      const footprint = new THREE.Mesh(footprintGeometry, footprintMaterial);
      
      // Position footprint on Earth's surface
      // Calculate the direction from Earth center to below satellite
      const directionToNadir = new THREE.Vector3(0, -1, 0).normalize();
      
      // If there's off-nadir angle, adjust the footprint position
      if (offNadirRad > 0) {
        // Rotate the direction by off-nadir angle
        const rotationAxis = new THREE.Vector3(0, 0, 1); // Z-axis for rotation
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(rotationAxis, offNadirRad);
        directionToNadir.applyMatrix4(rotationMatrix);
      }
      
      // Position the footprint at the calculated point on Earth's surface
      footprint.position.copy(directionToNadir.multiplyScalar(earthRadius));
      
      // Rotate footprint to face outward from Earth center
      footprint.lookAt(new THREE.Vector3(0, 0, 0));
      footprint.rotateX(Math.PI / 2);
      
      // If off-nadir angle is present, the footprint becomes more elliptical
      if (offNadirRad > 0) {
        // Stretch the footprint in the direction of off-nadir
        footprint.scale.z = 1 / Math.cos(offNadirRad);
      }
      
      scene.add(footprint);
      sceneRef.current.sensorFootprint = footprint;
      
      // Update camera to focus on satellite
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
      
      // Update satellite position
      sceneRef.current.satellite.position.y = earthRadius + altitude;
      
      // Remove existing sensor field and footprint if they exist
      if (sceneRef.current.sensorField) {
        sceneRef.current.satellite.remove(sceneRef.current.sensorField);
      }
      
      if (sceneRef.current.sensorFootprint) {
        sceneRef.current.scene.remove(sceneRef.current.sensorFootprint);
      }
      
      // Calculate off-nadir angle in radians
      const offNadirRad = (inputs.nominalOffNadirAngle * Math.PI) / 180;
      
      // Calculate the height of the sensor field cone
      const coneHeight = altitude;
      
      // Calculate sensor field cone base radius based on FOV and altitude
      const coneRadius = altitude * Math.tan(fovH / 2);
      
      // Create sensor field cone
      const sensorFieldGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 32);
      const sensorFieldMaterial = new THREE.MeshBasicMaterial({
        color: 0x4CAF50,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      
      const newSensorField = new THREE.Mesh(sensorFieldGeometry, sensorFieldMaterial);
      
      // Position the cone so its apex is at the satellite and it points down
      // While expanding outward toward Earth
      newSensorField.rotation.x = Math.PI;
      newSensorField.position.y = -coneHeight / 2;
      
      // Apply off-nadir rotation if specified
      if (offNadirRad > 0) {
        newSensorField.rotation.z = offNadirRad;
      }
      
      sceneRef.current.satellite.add(newSensorField);
      sceneRef.current.sensorField = newSensorField;
      
      // Create sensor footprint on Earth
      // Calculate footprint size based on FOV and altitude
      let footprintRadius = earthRadius * Math.sin(Math.atan(coneRadius / altitude));
      if (footprintRadius > earthRadius) footprintRadius = earthRadius * 0.5; // Limit size for visualization
      
      // Create footprint geometry
      const footprintGeometry = new THREE.CircleGeometry(footprintRadius, 32);
      const footprintMaterial = new THREE.MeshBasicMaterial({
        color: 0x4CAF50,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      
      const footprint = new THREE.Mesh(footprintGeometry, footprintMaterial);
      
      // Position footprint on Earth's surface
      // Calculate the direction from Earth center to below satellite
      const directionToNadir = new THREE.Vector3(0, -1, 0).normalize();
      
      // If there's off-nadir angle, adjust the footprint position
      if (offNadirRad > 0) {
        // Rotate the direction by off-nadir angle
        const rotationAxis = new THREE.Vector3(0, 0, 1); // Z-axis for rotation
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(rotationAxis, offNadirRad);
        directionToNadir.applyMatrix4(rotationMatrix);
      }
      
      // Position the footprint at the calculated point on Earth's surface
      footprint.position.copy(directionToNadir.multiplyScalar(earthRadius));
      
      // Rotate footprint to face outward from Earth center
      footprint.lookAt(new THREE.Vector3(0, 0, 0));
      footprint.rotateX(Math.PI / 2);
      
      // If off-nadir angle is present, the footprint becomes more elliptical
      if (offNadirRad > 0) {
        // Stretch the footprint in the direction of off-nadir
        footprint.scale.z = 1 / Math.cos(offNadirRad);
      }
      
      sceneRef.current.scene.add(footprint);
      sceneRef.current.sensorFootprint = footprint;
      
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
