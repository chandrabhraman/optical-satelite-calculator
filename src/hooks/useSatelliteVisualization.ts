
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SensorInputs } from '@/utils/types';
import { LocationData } from '@/components/LocationInput';
import { createPyramidGeometry, createCurvedFootprint } from '@/utils/threeUtils';

interface SceneRef {
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
}

interface UseSatelliteVisualizationProps {
  containerRef: React.RefObject<HTMLDivElement>;
  inputs: SensorInputs | null;
  locationData: LocationData;
  setLocationData: (data: LocationData) => void;
}

export function useSatelliteVisualization({
  containerRef,
  inputs,
  locationData,
  setLocationData
}: UseSatelliteVisualizationProps) {
  const sceneRef = useRef<SceneRef | null>(null);

  // Update satellite position based on location data
  const updateSatellitePosition = (data: LocationData) => {
    if (!sceneRef.current || !data.location) return;
    
    const earthRadius = 6371; // Earth radius in km
    const altitude = data.altitude;
    
    // Convert lat/lng to 3D position
    const lat = data.location.lat * Math.PI / 180;
    const lng = data.location.lng * Math.PI / 180;
    
    // Calculate position on Earth's surface
    const surfaceX = earthRadius * Math.cos(lat) * Math.cos(lng);
    const surfaceY = earthRadius * Math.sin(lat);
    const surfaceZ = earthRadius * Math.cos(lat) * Math.sin(lng);
    
    // Direction from Earth center to surface position
    const directionVector = new THREE.Vector3(surfaceX, surfaceY, surfaceZ).normalize();
    
    // Position satellite at altitude above this point
    const satellitePosition = directionVector.clone().multiplyScalar(earthRadius + altitude);
    
    // Update satellite position
    sceneRef.current.satellite.position.copy(satellitePosition);
    
    // Rotate satellite to face Earth center
    sceneRef.current.satellite.lookAt(0, 0, 0);
    
    // Adjust satellite orientation (the default orientation may need adjustment)
    sceneRef.current.satellite.rotateX(Math.PI / 2);
    
    // Update controls target
    sceneRef.current.controls.target.copy(sceneRef.current.satellite.position);
    sceneRef.current.controls.update();
  };

  // Function to update the visualization based on inputs
  const updateVisualization = (inputs: SensorInputs) => {
    if (!sceneRef.current) return;
    
    // Calculate sensor field dimensions
    const earthRadius = 6371; // Earth radius in km
    const altitude = inputs.altitudeMax / 1000; // Convert to km
    
    // Calculate FOV based on inputs - both horizontal and vertical
    const sensorWidthH = inputs.pixelSize * inputs.pixelCountH / 1000; // in mm
    const sensorWidthV = inputs.pixelSize * inputs.pixelCountV / 1000; // in mm
    const fovH = 2 * Math.atan(sensorWidthH / (2 * inputs.focalLength));
    const fovV = 2 * Math.atan(sensorWidthV / (2 * inputs.focalLength));
    
    console.log(`Calculated FOV - Horizontal: ${(fovH * 180 / Math.PI).toFixed(2)}°, Vertical: ${(fovV * 180 / Math.PI).toFixed(2)}°`);
    
    // Update satellite position if no location is specified
    if (!locationData.location) {
      sceneRef.current.satellite.position.y = earthRadius + altitude;
    }
    
    // Remove existing sensor field and footprint if they exist
    if (sceneRef.current.sensorField) {
      sceneRef.current.satellite.remove(sceneRef.current.sensorField);
    }
    
    if (sceneRef.current.sensorFootprint) {
      sceneRef.current.scene.remove(sceneRef.current.sensorFootprint);
    }
    
    // Calculate off-nadir angle in radians
    const offNadirRad = (inputs.nominalOffNadirAngle * Math.PI) / 180;
    
    // Create sensor field pyramid
    // The pyramid should start from satellite center and expand toward Earth
    const pyramidHeight = altitude * 0.9; // Make it slightly shorter than the altitude
    
    // Calculate base width and height based on FOV angles
    const baseWidth = 2 * pyramidHeight * Math.tan(fovH / 2);
    const baseHeight = 2 * pyramidHeight * Math.tan(fovV / 2);
    
    // Create a pyramid geometry
    const pyramidGeometry = createPyramidGeometry(baseWidth, baseHeight, pyramidHeight);
    
    const sensorFieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const newSensorField = new THREE.Mesh(pyramidGeometry, sensorFieldMaterial);
    
    // Position and orient the pyramid correctly:
    // 1. Rotate to point down (toward Earth)
    newSensorField.rotation.x = -Math.PI; // Changed from Math.PI to -Math.PI to point down
    
    // 2. Position so apex is at satellite center
    newSensorField.position.y = 0;
    
    // 3. Apply off-nadir angle if specified
    if (offNadirRad > 0) {
      newSensorField.rotation.z = offNadirRad;
    }
    
    // Add sensor field to satellite
    sceneRef.current.satellite.add(newSensorField);
    sceneRef.current.sensorField = newSensorField;
    
    // Create curved footprint on Earth's surface
    const footprint = createCurvedFootprint(
      earthRadius, 
      sceneRef.current.satellite.position, 
      fovH, 
      fovV, 
      inputs.nominalOffNadirAngle
    );
    
    // Add footprint to scene
    sceneRef.current.scene.add(footprint);
    sceneRef.current.sensorFootprint = footprint;
    
    // Update camera target
    sceneRef.current.controls.target.copy(sceneRef.current.satellite.position);
    sceneRef.current.controls.update();
  };

  // Initialize scene and all objects
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
    controls.minDistance = 100; // Allow much closer zooming
    controls.maxDistance = 200000; // Allow zooming out much further

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
    
    // Create default sensor field (pyramid shape)
    // Default square-based pyramid pointing from satellite towards Earth
    const defaultSensorAngle = Math.PI / 12; // 15 degrees
    const sensorHeight = 600; // Height of the pyramid
    const baseSize = Math.tan(defaultSensorAngle) * sensorHeight; // Base size based on height and angle
    
    // Create a pyramid using a BufferGeometry
    const pyramidGeometry = createPyramidGeometry(baseSize, baseSize, sensorHeight);
    
    const sensorFieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const sensorField = new THREE.Mesh(pyramidGeometry, sensorFieldMaterial);
    
    // Position pyramid at satellite with apex at satellite center
    // Properly orient the pyramid to expand outward toward Earth
    sensorField.rotation.x = -Math.PI; // Rotate to point down
    
    // Move sensor field origin to the satellite center (apex at satellite)
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
    
    // If location data is available, update satellite position
    if (locationData.location) {
      updateSatellitePosition(locationData);
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
    
    // Update visualization if inputs are provided
    if (inputs) {
      updateVisualization(inputs);
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
      updateVisualization(inputs);
    }
  }, [inputs]);

  return { updateSatellitePosition };
}
