
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
      500000
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
    controls.minDistance = 6500; // Allow closer zooming
    controls.maxDistance = 100000; // Allow zooming out much further

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
    
    // Create Earth with realistic texture
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: null, // Will be set when texture loads
      specularMap: null, // Will be set when texture loads
      bumpMap: null, // Will be set when texture loads
      bumpScale: 10,
      specular: new THREE.Color(0x333333),
      shininess: 25,
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.receiveShadow = true;
    scene.add(earth);
    
    // Load Earth textures
    earthTextureLoader.load(
      'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
      (texture) => {
        earthMaterial.map = texture;
        earthMaterial.needsUpdate = true;
      }
    );
    
    earthTextureLoader.load(
      'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
      (texture) => {
        earthMaterial.specularMap = texture;
        earthMaterial.needsUpdate = true;
      }
    );
    
    earthTextureLoader.load(
      'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
      (texture) => {
        earthMaterial.bumpMap = texture;
        earthMaterial.needsUpdate = true;
      }
    );
    
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
    // Default cone pointing from satellite towards Earth
    const defaultSensorAngle = Math.PI / 12; // 15 degrees
    const sensorHeight = 600; // Height of the cone
    const sensorFieldGeometry = new THREE.ConeGeometry(
      Math.tan(defaultSensorAngle) * sensorHeight, // Base radius based on height and angle
      sensorHeight, // Height
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
    
    // Position cone at satellite with apex at satellite center
    // Properly orient the cone to expand outward toward Earth
    sensorField.rotation.x = Math.PI; // Rotate to point down
    
    // Move sensor field origin to the satellite center
    satellite.add(sensorField);
    
    // Initial default sensor footprint on Earth (placeholder)
    const defaultFootprintGeometry = new THREE.CircleGeometry(500, 32);
    const footprintMaterial = new THREE.MeshBasicMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    
    const sensorFootprint = new THREE.Mesh(defaultFootprintGeometry, footprintMaterial);
    sensorFootprint.position.y = -earthRadius; // Position on Earth's surface
    sensorFootprint.rotation.x = -Math.PI / 2; // Orient flat on the surface
    scene.add(sensorFootprint);
    
    // Position satellite
    const defaultAltitude = 600; // Default altitude in km
    satellite.position.y = earthRadius + defaultAltitude;
    
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
      
      // Create sensor field cone
      // The cone should point from satellite toward Earth with apex at satellite
      const coneHeight = altitude * 0.9; // Make it slightly shorter than the altitude
      const coneRadius = coneHeight * Math.tan(fovH / 2); // Radius at the base of the cone
      
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
      
      // Position and orient the cone correctly:
      // 1. Rotate to point down (toward Earth)
      newSensorField.rotation.x = Math.PI;
      
      // 2. Position so that the apex is at the satellite's center
      newSensorField.position.y = -coneHeight/2; // Move up so apex is at the satellite
      
      // 3. Apply off-nadir angle if specified
      if (offNadirRad > 0) {
        newSensorField.rotation.z = offNadirRad;
      }
      
      // Add sensor field to satellite
      sceneRef.current.satellite.add(newSensorField);
      sceneRef.current.sensorField = newSensorField;
      
      // Calculate sensor footprint on Earth
      // Calculate the nadir point (directly below satellite)
      const directionToNadir = new THREE.Vector3(0, -1, 0).normalize();
      
      // If there's off-nadir angle, adjust the direction
      if (offNadirRad > 0) {
        // Rotate the direction by off-nadir angle
        const rotationAxis = new THREE.Vector3(0, 0, 1); // Z-axis for rotation
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(rotationAxis, offNadirRad);
        directionToNadir.applyMatrix4(rotationMatrix);
      }
      
      // Calculate footprint radius based on FOV and altitude
      let footprintRadius = altitude * Math.tan(fovH / 2); // Radius at Earth's distance
      
      // Adjust for Earth's curvature - convert to arc length on Earth's surface
      footprintRadius = earthRadius * Math.asin(footprintRadius / (earthRadius + altitude));
      
      // Create footprint
      const footprintGeometry = new THREE.CircleGeometry(footprintRadius, 32);
      const footprintMaterial = new THREE.MeshBasicMaterial({
        color: 0x4CAF50,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      
      const footprint = new THREE.Mesh(footprintGeometry, footprintMaterial);
      
      // Position the footprint at the calculated point on Earth's surface
      // Scale by Earth radius to get the position on the surface
      footprint.position.copy(directionToNadir.clone().multiplyScalar(earthRadius));
      
      // Orient the footprint to be tangent to the Earth's surface
      // Make footprint face the center of the Earth
      footprint.lookAt(new THREE.Vector3(0, 0, 0));
      
      // Rotate 90 degrees to lie flat on the surface
      footprint.rotateX(Math.PI / 2);
      
      // If off-nadir angle is present, the footprint becomes elliptical
      if (offNadirRad > 0) {
        // Stretch the footprint in the direction of off-nadir
        footprint.scale.z = 1 / Math.cos(offNadirRad);
      }
      
      // Add footprint to scene
      sceneRef.current.scene.add(footprint);
      sceneRef.current.sensorFootprint = footprint;
      
      // Update camera target
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

  // Update visualization whenever inputs change
  useEffect(() => {
    if (inputs && sceneRef.current) {
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
      
      // Create sensor field cone
      // The cone should start from satellite center and expand toward Earth
      const coneHeight = altitude * 0.9; // Make it slightly shorter than the altitude
      const coneRadius = coneHeight * Math.tan(fovH / 2); // Radius at the base
      
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
      
      // Position and orient the cone correctly:
      // 1. Rotate to point down (toward Earth)
      newSensorField.rotation.x = Math.PI;
      
      // 2. Position so apex is at satellite center
      newSensorField.position.y = -coneHeight/2;
      
      // 3. Apply off-nadir angle if specified
      if (offNadirRad > 0) {
        newSensorField.rotation.z = offNadirRad;
      }
      
      // Add sensor field to satellite
      sceneRef.current.satellite.add(newSensorField);
      sceneRef.current.sensorField = newSensorField;
      
      // Calculate sensor footprint on Earth
      // Calculate the nadir point (directly below satellite)
      const directionToNadir = new THREE.Vector3(0, -1, 0).normalize();
      
      // If there's off-nadir angle, adjust the direction
      if (offNadirRad > 0) {
        // Rotate the direction by off-nadir angle
        const rotationAxis = new THREE.Vector3(0, 0, 1); // Z-axis for rotation
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(rotationAxis, offNadirRad);
        directionToNadir.applyMatrix4(rotationMatrix);
      }
      
      // Calculate footprint radius based on FOV and altitude
      let footprintRadius = altitude * Math.tan(fovH / 2); // Radius at Earth's distance
      
      // Adjust for Earth's curvature - convert to arc length on Earth's surface
      footprintRadius = earthRadius * Math.asin(footprintRadius / (earthRadius + altitude));
      
      // Create footprint
      const footprintGeometry = new THREE.CircleGeometry(footprintRadius, 32);
      const footprintMaterial = new THREE.MeshBasicMaterial({
        color: 0x4CAF50,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      
      const footprint = new THREE.Mesh(footprintGeometry, footprintMaterial);
      
      // Position the footprint at the calculated point on Earth's surface
      footprint.position.copy(directionToNadir.clone().multiplyScalar(earthRadius));
      
      // Orient the footprint to be tangent to the Earth's surface
      footprint.lookAt(new THREE.Vector3(0, 0, 0));
      footprint.rotateX(Math.PI / 2);
      
      // If off-nadir angle is present, the footprint becomes elliptical
      if (offNadirRad > 0) {
        // Stretch the footprint in the direction of off-nadir
        footprint.scale.z = 1 / Math.cos(offNadirRad);
      }
      
      // Add footprint to scene
      sceneRef.current.scene.add(footprint);
      sceneRef.current.sensorFootprint = footprint;
      
      // Update camera target
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
