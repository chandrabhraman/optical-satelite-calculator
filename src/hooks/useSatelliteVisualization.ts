import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SensorInputs } from '@/utils/types';
import { OrbitData } from '@/components/LocationInput';
import { createPyramidGeometry, createCurvedFootprint } from '@/utils/threeUtils';
import { calculateSensorParameters } from '@/utils/sensorCalculations';
import { 
  toRadians,
  toDegrees,
  normalizeAngle,
  calculateSatelliteECIPosition,
  eciToEcef,
  ecefToGeodetic,
  calculateSatelliteLatLong,
  calculateOrbitalPeriod
} from '@/utils/orbitalUtils';
import { toast } from '@/hooks/use-toast';

interface SceneRef {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  satellite: THREE.Group;
  sensorField: THREE.Mesh;
  fovAnnotations: THREE.Group | null;
  sensorFootprint: THREE.Mesh | THREE.Group | null; // Update the type to allow Group as well
  earth: THREE.Mesh;
  stars: THREE.Points;
  animationId: number;
  containerSize: { width: number; height: number };
  orbitAngle: number;
  orbitSpeed: number;
  orbitPlane: THREE.Group | null;
  orbitRadius: number;
  earthRotationAngle: number;
  trueAnomaly: number;
  inclination: number;
  raan: number;
  isInitialized: boolean; // Flag to track if the scene is fully initialized
}

interface UseSatelliteVisualizationProps {
  containerRef: React.RefObject<HTMLDivElement>;
  inputs: SensorInputs | null;
  orbitData: OrbitData;
  onPositionUpdate?: (position: {lat: number, lng: number}) => void;
}

const MODEL_PATHS = [
  '/models/satellite-default.glb',
];

// Real Earth rotates at ~0.0042 degrees per second
// For 2x faster than real Earth: 0.0042 * 2 = 0.0084 degrees per second
// Convert to radians per frame: 0.0084 * (Math.PI/180) = ~0.0001466 radians per frame
const EARTH_ROTATION_RATE = 0.0000146; // radians per frame (2x faster than real Earth)

export function useSatelliteVisualization({
  containerRef,
  inputs,
  orbitData,
  onPositionUpdate
}: UseSatelliteVisualizationProps) {
  const sceneRef = useRef<SceneRef | null>(null);
  
  // Get current Earth rotation angle
  const getCurrentEarthRotation = (): number => {
    return sceneRef.current ? sceneRef.current.earthRotationAngle : 0;
  };
  
  const updateSatelliteOrbit = (data: OrbitData) => {
    if (!sceneRef.current || !sceneRef.current.isInitialized) return;
    
    // Check what has changed
    const inclinationChanged = data.inclination !== sceneRef.current.inclination;
    const raanChanged = data.raan !== toDegrees(sceneRef.current.raan);
    const trueAnomalyChanged = data.trueAnomaly !== toDegrees(sceneRef.current.trueAnomaly);
    const altitudeChanged = data.altitude !== sceneRef.current.orbitRadius - 6371;
    
    console.log(`Changes detected - Inclination: ${inclinationChanged}, RAAN: ${raanChanged}, TrueAnomaly: ${trueAnomalyChanged}, Altitude: ${altitudeChanged}`);
    
    // Store the new values
    if (altitudeChanged) {
      sceneRef.current.orbitRadius = 6371 + data.altitude;
    }
    
    if (inclinationChanged) {
      sceneRef.current.inclination = data.inclination;
    }
    
    if (raanChanged) {
      sceneRef.current.raan = toRadians(data.raan);
    }
    
    if (trueAnomalyChanged) {
      sceneRef.current.trueAnomaly = toRadians(data.trueAnomaly);
    }
    
    // Recreate orbit plane for any parameter change to ensure consistency
    if (inclinationChanged || raanChanged || altitudeChanged || sceneRef.current.orbitPlane === null) {
      if (sceneRef.current.orbitPlane) {
        sceneRef.current.scene.remove(sceneRef.current.orbitPlane);
      }
      
      // Create a new orbit plane based on orbital elements
      const orbitPlane = new THREE.Group();
      sceneRef.current.scene.add(orbitPlane);
      sceneRef.current.orbitPlane = orbitPlane;
      
      // Apply rotations with quaternions to rotate around world axes
      // First apply RAAN rotation around world Y axis (equivalent to Z axis in orbital calculations)
      const raanQuaternion = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0), 
        sceneRef.current.raan
      );
      
      orbitPlane.quaternion.copy(raanQuaternion);
      
      // Then apply inclination rotation around the local X axis (after RAAN rotation)
      const inclinationQuaternion = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0), 
        toRadians(sceneRef.current.inclination)
      );
      
      // Combine rotations (quaternion multiplication applies the second quaternion to the result of the first)
      orbitPlane.quaternion.multiply(inclinationQuaternion);
      
      console.log(`Updated orbit plane - Inclination: ${sceneRef.current.inclination}°, RAAN: ${toDegrees(sceneRef.current.raan)}°`);
      
      // Redraw orbit path
      drawOrbitPath(sceneRef.current.orbitRadius, orbitPlane);
    }
    
    // Update satellite position based on current true anomaly
    updateSatelliteOrbitPosition(0);
  };
  
  const drawOrbitPath = (radius: number, orbitPlane: THREE.Group) => {
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      orbitPoints.push(
        radius * Math.cos(angle),
        0,
        radius * Math.sin(angle)
      );
    }
    
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
    
    const orbitMaterial = new THREE.LineDashedMaterial({
      color: 0x4CAF50,
      dashSize: 50,
      gapSize: 50,
    });
    
    const orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
    orbitPath.computeLineDistances();
    orbitPlane.add(orbitPath);
  };
  
  const startOrbitAnimation = (data: OrbitData) => {
    if (!sceneRef.current || !sceneRef.current.isInitialized) return;
    
    const earthRadius = 6371;
    const orbitalRadius = earthRadius + data.altitude;
    sceneRef.current.orbitRadius = orbitalRadius;
    sceneRef.current.inclination = data.inclination;
    sceneRef.current.raan = toRadians(data.raan);
    sceneRef.current.trueAnomaly = toRadians(data.trueAnomaly);
    
    // Calculate orbit speed using orbital period
    const orbitPeriod = calculateOrbitalPeriod(orbitalRadius);
    // Convert to radians per frame assuming 60 frames per second
    sceneRef.current.orbitSpeed = (2 * Math.PI) / (orbitPeriod * 60);
    
    console.log(`Starting orbit animation at altitude ${data.altitude} km with inclination ${data.inclination}°, RAAN ${data.raan}°, True Anomaly ${data.trueAnomaly}°`);
    console.log(`Orbit period: ${orbitPeriod.toFixed(2)} seconds, Orbit speed: ${sceneRef.current.orbitSpeed.toFixed(8)} rad/frame`);
    
    // Clear existing orbit plane if it exists
    if (sceneRef.current.orbitPlane) {
      sceneRef.current.scene.remove(sceneRef.current.orbitPlane);
    }
    
    // Create a new orbit plane based on orbital elements
    const orbitPlane = new THREE.Group();
    sceneRef.current.scene.add(orbitPlane);
    sceneRef.current.orbitPlane = orbitPlane;
    
    // Apply rotations with quaternions to rotate around world axes
    // First apply RAAN rotation around world Y axis (equivalent to Z axis in orbital calculations)
    const raanQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0), 
      sceneRef.current.raan
    );
    
    orbitPlane.quaternion.copy(raanQuaternion);
    
    // Then apply inclination rotation around the local X axis (after RAAN rotation)
    const inclinationQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0), 
      toRadians(sceneRef.current.inclination)
    );
    
    // Combine rotations (quaternion multiplication applies the second quaternion to the result of the first)
    orbitPlane.quaternion.multiply(inclinationQuaternion);
    
    // Draw orbit path
    drawOrbitPath(orbitalRadius, orbitPlane);
    
    // Update satellite position along orbit
    updateSatelliteOrbitPosition(0);
  };
  
  const updateSatelliteOrbitPosition = (deltaAngle: number) => {
    if (!sceneRef.current || !sceneRef.current.orbitPlane || !sceneRef.current.isInitialized) return;
    
    if (deltaAngle !== 0) {
      const newTrueAnomaly = normalizeAngle(sceneRef.current.trueAnomaly + deltaAngle);
      sceneRef.current.trueAnomaly = newTrueAnomaly;
    }
    
    // Calculate position in the orbital plane (local coordinates)
    // FIX: Reverse sin/cos to correct the true anomaly display
    // When true anomaly is 90°, satellite should be at (0, 0, radius) not at (0, 0, -radius)
    const x = sceneRef.current.orbitRadius * Math.cos(sceneRef.current.trueAnomaly);
    // Use negative sine to correct the orientation so 90° is where it should be
    const z = -sceneRef.current.orbitRadius * Math.sin(sceneRef.current.trueAnomaly);
    
    const localPosition = new THREE.Vector3(x, 0, z);
    
    // Clone the orbit plane's world matrix to avoid modifying the original
    const orbitPlaneMatrix = sceneRef.current.orbitPlane.matrixWorld.clone();
    
    // Apply the orbit plane's transformation to get the satellite's world position
    sceneRef.current.satellite.position.copy(localPosition.clone().applyMatrix4(orbitPlaneMatrix));
    
    // Orient the satellite to face Earth center
    sceneRef.current.satellite.lookAt(0, 0, 0);
    sceneRef.current.satellite.rotateX(Math.PI / 2);
    
    // Calculate lat/long using the orbital elements
    // Note: Earth rotation affects the longitude, but RAAN is set in the orbit plane itself
    const { lat, lng } = calculateSatelliteLatLong(
      sceneRef.current.orbitRadius - 6371, // altitude
      sceneRef.current.inclination, 
      sceneRef.current.raan,
      sceneRef.current.trueAnomaly,
      sceneRef.current.earthRotationAngle,
      0, // eccentricity (circular orbit for visualization)
      0  // argument of periapsis
    );
    
    // Remove any existing footprint before updating
    if (sceneRef.current.sensorFootprint && sceneRef.current.sensorFootprint.parent) {
      sceneRef.current.sensorFootprint.parent.remove(sceneRef.current.sensorFootprint);
      sceneRef.current.sensorFootprint = null;
    }
    
    // Calculate the nadir point on Earth's surface
    const dirToCenter = new THREE.Vector3().subVectors(
      new THREE.Vector3(0, 0, 0),
      sceneRef.current.satellite.position
    ).normalize();
    
    const surfacePoint = dirToCenter.multiplyScalar(6371); // Earth radius
    
    // Only create a new footprint if we have inputs for field of view
    if (inputs && sceneRef.current.sensorField) {
      // Get field of view parameters from inputs if available
      const calculatedParams = calculateSensorParameters({
        pixelSize: inputs.pixelSize,
        pixelCountH: inputs.pixelCountH,
        pixelCountV: inputs.pixelCountV,
        gsdRequirements: inputs.gsdRequirements,
        altitudeMin: inputs.altitudeMin / 1000,
        altitudeMax: inputs.altitudeMax / 1000,
        focalLength: inputs.focalLength,
        aperture: inputs.aperture,
        nominalOffNadirAngle: inputs.nominalOffNadirAngle
      });
      
      const fovH = calculatedParams.hfovDeg * Math.PI / 180;
      const fovV = calculatedParams.vfovDeg * Math.PI / 180;
      
      // Create the footprint on Earth's surface
      const footprint = createCurvedFootprint(
        6371, // Earth radius
        sceneRef.current.satellite.position, 
        fovH, 
        fovV, 
        inputs.nominalOffNadirAngle,
        calculatedParams.horizontalFootprint,
        calculatedParams.verticalFootprint
      );
      
      footprint.position.copy(surfacePoint);
      
      // Orient the footprint to be tangent to Earth's surface
      const normal = surfacePoint.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const axis = new THREE.Vector3().crossVectors(up, normal).normalize();
      const angle = Math.acos(up.dot(normal));
      
      if (!isNaN(angle) && angle !== 0 && !isNaN(axis.x) && !isNaN(axis.y) && !isNaN(axis.z)) {
        footprint.quaternion.setFromAxisAngle(axis, angle);
      }
      
      // Add footprint to the scene (not to the satellite)
      sceneRef.current.scene.add(footprint);
      sceneRef.current.sensorFootprint = footprint;
    }
    
    // Notify position update with lat/long coordinates
    if (onPositionUpdate) {
      onPositionUpdate({ lat, lng });
    }
  };
  
  const loadCustomModel = (file: File) => {
    if (!sceneRef.current || !sceneRef.current.isInitialized) return;
    
    const objectUrl = URL.createObjectURL(file);
    
    const satelliteGroup = sceneRef.current.satellite;
    const sensorField = sceneRef.current.sensorField;
    
    const childrenToKeep = [];
    if (sensorField) childrenToKeep.push(sensorField);
    if (sceneRef.current.fovAnnotations) childrenToKeep.push(sceneRef.current.fovAnnotations);
    
    while (satelliteGroup.children.length > 0) {
      const child = satelliteGroup.children[0];
      satelliteGroup.remove(child);
    }
    
    childrenToKeep.forEach(child => satelliteGroup.add(child));
    
    if (file.name.endsWith('.blend')) {
      console.log('Blend file detected, showing fallback model and notification');
      loadDefaultSatelliteModel(satelliteGroup);
      
      URL.revokeObjectURL(objectUrl);
      return;
    }
    
    const containerWidth = sceneRef.current.containerSize.width;
    const containerHeight = sceneRef.current.containerSize.height;
    const minDimension = Math.min(containerWidth, containerHeight);
    const satelliteScale = minDimension * 0.02;
    
    const loader = new GLTFLoader();
    loader.load(
      objectUrl,
      (gltf) => {
        console.log('Model loaded successfully');
        
        gltf.scene.scale.set(satelliteScale, satelliteScale, satelliteScale);
        
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        gltf.scene.position.sub(center);
        
        satelliteGroup.add(gltf.scene);
        URL.revokeObjectURL(objectUrl);
      },
      (xhr) => {
        console.log(`${(xhr.loaded / xhr.total * 100)}% loaded`);
      },
      (error) => {
        console.error('Error loading model:', error);
        URL.revokeObjectURL(objectUrl);
        loadDefaultSatelliteModel(satelliteGroup);
      }
    );
  };
  
  const loadDefaultSatelliteModel = (satelliteGroup: THREE.Group) => {
    if (!sceneRef.current) return;
    
    const containerWidth = sceneRef.current.containerSize.width;
    const containerHeight = sceneRef.current.containerSize.height;
    const minDimension = Math.min(containerWidth, containerHeight);
    const satelliteBaseSize = minDimension * 0.02;
    
    console.log('Loading default satellite model from local path');
    const loader = new GLTFLoader();
    
    loader.load(
      MODEL_PATHS[0],
      (gltf) => {
        console.log(`Model loaded successfully from ${MODEL_PATHS[0]}`);
        
        gltf.scene.scale.set(satelliteBaseSize, satelliteBaseSize, satelliteBaseSize);
        
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        gltf.scene.position.sub(center);
        
        satelliteGroup.add(gltf.scene);
      },
      (xhr) => {
        console.log(`Model loading progress: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error(`Error loading model from ${MODEL_PATHS[0]}:`, error);
        console.log('Creating fallback satellite model');
        createFallbackSatelliteModel(satelliteGroup, satelliteBaseSize);
      }
    );
  };
  
  const createFallbackSatelliteModel = (satelliteGroup: THREE.Group, satelliteBaseSize: number) => {
    console.log('Creating fallback satellite model with size:', satelliteBaseSize);
    
    const satelliteGeometry = new THREE.BoxGeometry(
      satelliteBaseSize * 1.5, 
      satelliteBaseSize * 0.5, 
      satelliteBaseSize
    );
    const satelliteMaterial = new THREE.MeshPhongMaterial({
      color: 0xCCCCCC,
      emissive: 0x333333,
      specular: 0x111111,
      shininess: 50
    });
    const satelliteBody = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
    satelliteBody.castShadow = true;
    satelliteGroup.add(satelliteBody);
    
    const panelGeometry = new THREE.BoxGeometry(
      satelliteBaseSize * 2.5, 
      satelliteBaseSize * 0.025, 
      satelliteBaseSize
    );
    const panelMaterial = new THREE.MeshPhongMaterial({
      color: 0x2244AA,
      emissive: 0x112233,
      specular: 0x111122,
      shininess: 80
    });
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.x = -satelliteBaseSize * 2;
    leftPanel.castShadow = true;
    satelliteGroup.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.x = satelliteBaseSize * 2;
    rightPanel.castShadow = true;
    satelliteGroup.add(rightPanel);
    
    const antennaGeometry = new THREE.CylinderGeometry(
      satelliteBaseSize * 0.02,
      satelliteBaseSize * 0.02,
      satelliteBaseSize * 0.8
    );
    const antennaMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      emissive: 0x222222
    });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.y = satelliteBaseSize * 0.5;
    satelliteGroup.add(antenna);
    
    const detailGeometry = new THREE.BoxGeometry(
      satelliteBaseSize * 0.2,
      satelliteBaseSize * 0.2,
      satelliteBaseSize * 0.2
    );
    const detailMaterial = new THREE.MeshPhongMaterial({
      color: 0x444444,
      emissive: 0x222222
    });
    
    const detail1 = new THREE.Mesh(detailGeometry, detailMaterial);
    detail1.position.set(satelliteBaseSize * 0.4, satelliteBaseSize * 0.2, satelliteBaseSize * 0.3);
    satelliteGroup.add(detail1);
    
    const detail2 = new THREE.Mesh(detailGeometry, detailMaterial);
    detail2.position.set(-satelliteBaseSize * 0.4, satelliteBaseSize * 0.2, -satelliteBaseSize * 0.3);
    satelliteGroup.add(detail2);
    
    console.log('Fallback satellite model created with', satelliteGroup.children.length, 'parts');
  };
  
  const updateVisualization = (inputs: SensorInputs) => {
    if (!sceneRef.current || !sceneRef.current.isInitialized) return;
    
    const earthRadius = 6371;
    const altitude = inputs.altitudeMax / 1000;
    
    // Use orbitData if available, otherwise use default values
    if (!orbitData) {
      startOrbitAnimation({
        altitude: altitude,
        inclination: 98, // Default inclination
        raan: 0,
        trueAnomaly: 0
      });
    } else {
      // Update the orbit with the current orbitData
      updateSatelliteOrbit(orbitData);
    }
    
    const calculatedParams = calculateSensorParameters({
      pixelSize: inputs.pixelSize,
      pixelCountH: inputs.pixelCountH,
      pixelCountV: inputs.pixelCountV,
      gsdRequirements: inputs.gsdRequirements,
      altitudeMin: inputs.altitudeMin / 1000,
      altitudeMax: inputs.altitudeMax / 1000,
      focalLength: inputs.focalLength,
      aperture: inputs.aperture,
      nominalOffNadirAngle: inputs.nominalOffNadirAngle
    });
    
    const fovH = calculatedParams.hfovDeg * Math.PI / 180;
    const fovV = calculatedParams.vfovDeg * Math.PI / 180;
    
    console.log(`Calculated FOV - Horizontal: ${calculatedParams.hfovDeg.toFixed(2)}°, Vertical: ${calculatedParams.vfovDeg.toFixed(2)}°`);
    console.log(`Footprints - Horizontal: ${calculatedParams.horizontalFootprint.toFixed(2)} km, Vertical: ${calculatedParams.verticalFootprint.toFixed(2)} km`);
    
    // Remove existing sensor field if present
    if (sceneRef.current.sensorField && sceneRef.current.sensorField.parent) {
      sceneRef.current.satellite.remove(sceneRef.current.sensorField);
      sceneRef.current.sensorField = null;
    }
    
    if (sceneRef.current.fovAnnotations && sceneRef.current.fovAnnotations.parent) {
      sceneRef.current.satellite.remove(sceneRef.current.fovAnnotations);
      sceneRef.current.fovAnnotations = null;
    }
    
    // Remove any existing footprint before creating a new one
    if (sceneRef.current.sensorFootprint && sceneRef.current.sensorFootprint.parent) {
      sceneRef.current.sensorFootprint.parent.remove(sceneRef.current.sensorFootprint);
      sceneRef.current.sensorFootprint = null;
    }
    
    const offNadirRad = (inputs.nominalOffNadirAngle * Math.PI) / 180;
    const pyramidHeight = altitude;
    const baseWidth = 2 * pyramidHeight * Math.tan(fovH / 2);
    const baseHeight = 2 * pyramidHeight * Math.tan(fovV / 2);
    
    const pyramidGeometry = createPyramidGeometry(baseWidth, baseHeight, pyramidHeight);
    
    // PERFORMANCE IMPROVEMENT: Use MeshBasicMaterial instead of MeshPhongMaterial
    // for the sensor field, and optimize transparency settings
    const sensorFieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false, // Improve transparency rendering
      polygonOffset: true, // Prevent z-fighting
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
    
    const newSensorField = new THREE.Mesh(pyramidGeometry, sensorFieldMaterial);
    
    newSensorField.rotation.x = Math.PI;
    newSensorField.position.y = 0;
    
    if (offNadirRad > 0) {
      newSensorField.rotation.z = offNadirRad;
    }
    
    // PERFORMANCE IMPROVEMENT: Set frustumCulled to false to prevent 
    // the sensor field from being culled incorrectly
    newSensorField.frustumCulled = false;
    
    sceneRef.current.satellite.add(newSensorField);
    sceneRef.current.sensorField = newSensorField;
    
    sceneRef.current.fovAnnotations = null;
    
    // Update camera to look at satellite
    sceneRef.current.controls.target.copy(sceneRef.current.satellite.position);
    sceneRef.current.controls.update();
    
    // Update satellite position to refresh the footprint
    updateSatelliteOrbitPosition(0);
  };
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    if (sceneRef.current) {
      sceneRef.current.renderer.dispose();
      sceneRef.current.scene.clear();
      cancelAnimationFrame(sceneRef.current.animationId);
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A0F1A);
    
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000000
    );
    camera.position.set(0, 2000, 15000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    directionalLight.position.set(5000, 3000, 5000);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.8);
    scene.add(hemisphereLight);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 500000;
    
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

    const earthRadius = 6371;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthTextureLoader = new THREE.TextureLoader();
    
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: null,
      specularMap: null,
      bumpMap: null,
      bumpScale: 10,
      specular: new THREE.Color(0x333333),
      shininess: 25,
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.receiveShadow = true;
    scene.add(earth);
    
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
    
    const satellite = new THREE.Group();
    scene.add(satellite);
    
    const containerSize = {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    };
    
    loadDefaultSatelliteModel(satellite);
    
    const defaultSensorAngle = Math.PI / 12;
    const sensorHeight = 600;
    const baseSize = Math.tan(defaultSensorAngle) * sensorHeight;
    
    const pyramidGeometry = createPyramidGeometry(baseSize, baseSize, sensorHeight);
    
    const sensorFieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false, // Improve transparency rendering
      polygonOffset: true, // Prevent z-fighting
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
    
    const sensorField = new THREE.Mesh(pyramidGeometry, sensorFieldMaterial);
    
    sensorField.rotation.x = Math.PI;
    sensorField.position.y = 0;
    satellite.add(sensorField);
    
    // Initialize with no footprint - we'll create it when needed
    let sensorFootprint: THREE.Mesh | THREE.Group | null = null;
    
    // Initialize default orbit parameters
    const defaultAltitude = orbitData.altitude;
    const defaultInclination = orbitData.inclination;
    const defaultRaan = toRadians(orbitData.raan);
    const defaultTrueAnomaly = toRadians(orbitData.trueAnomaly);
    
    let orbitAngle = defaultTrueAnomaly;
    let orbitSpeed = 0;
    let orbitPlane: THREE.Group | null = null;
    let orbitRadius = earthRadius + defaultAltitude;
    let earthRotationAngle = 0;
    let trueAnomaly = defaultTrueAnomaly;
    let inclination = defaultInclination;
    let raan = defaultRaan;
    
    function focusOnSatellite() {
      const offset = satellite.position.clone().add(new THREE.Vector3(0, 0, 2000));
      camera.position.copy(offset);
      controls.target.copy(satellite.position);
      controls.update();
    }
    
    // Mark when scene is fully initialized to avoid race conditions
    let isInitialized = false;
    
    // Initialize orbit with default parameters (but defer until we're fully loaded)
    setTimeout(() => {
      startOrbitAnimation(orbitData);
      focusOnSatellite();
      isInitialized = true;
      
      // Store this flag in the sceneRef
      if (sceneRef.current) {
        sceneRef.current.isInitialized = true;
      }
    }, 500);
    
    const instructionsElement = document.createElement('div');
    instructionsElement.style.position = 'absolute';
    instructionsElement.style.top = '10px';
    instructionsElement.style.left = '10px';
    instructionsElement.style.color = 'white';
    instructionsElement.style.padding = '5px';
    instructionsElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
    instructionsElement.style.borderRadius = '5px';
    instructionsElement.style.fontSize = '12px';
    instructionsElement.style.pointerEvents = 'none';
    instructionsElement.innerText = 'Click and drag to rotate. Scroll to zoom.';
    containerRef.current.appendChild(instructionsElement);
    
    const handleResize = () => {
      if (containerRef.current) {
        if (sceneRef.current) {
          sceneRef.current.containerSize = {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight
          };
        }
        
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // PERFORMANCE IMPROVEMENT: Use a better render loop with throttling for smoother animations
    let lastRenderTime = 0;
    const minRenderInterval = 1000 / 60; // Target 60fps
    
    const animate = (currentTime: number) => {
      const animationId = requestAnimationFrame(animate);
      
      // Throttle rendering for performance
      if (currentTime - lastRenderTime < minRenderInterval) {
        if (sceneRef.current) {
          sceneRef.current.animationId = animationId;
        }
        return;
      }
      
      lastRenderTime = currentTime;
      controls.update();
      
      // Update Earth rotation angle for day/night effect
      // This doesn't affect the coordinates system or RAAN
      earthRotationAngle = normalizeAngle(earthRotationAngle + EARTH_ROTATION_RATE);
      earth.rotation.y = earthRotationAngle;
      
      stars.rotation.y += 0.0001;
      
      // Update satellite position in orbit if initialized
      if (sceneRef.current && sceneRef.current.orbitPlane && isInitialized) {
        updateSatelliteOrbitPosition(sceneRef.current.orbitSpeed);
      }
      
      renderer.render(scene, camera);
      
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
        sceneRef.current.earthRotationAngle = earthRotationAngle;
      }
    };
    
    animate(0);
    
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      satellite,
      sensorField,
      fovAnnotations: null,
      sensorFootprint,
      earth,
      stars,
      animationId: 0,
      containerSize,
      orbitAngle,
      orbitSpeed,
      orbitPlane,
      orbitRadius,
      earthRotationAngle,
      trueAnomaly,
      inclination,
      raan,
      isInitialized
    };
    
    // Defer initialization of visualization until everything is ready
    if (inputs) {
      setTimeout(() => {
        updateVisualization(inputs);
      }, 800);
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
      if (instructionsElement && instructionsElement.parentNode) {
        instructionsElement.parentNode.removeChild(instructionsElement);
      }
    };
  }, []);
  
  useEffect(() => {
    if (inputs && sceneRef.current && sceneRef.current.isInitialized) {
      updateVisualization(inputs);
    }
  }, [inputs]);

  // Capture snapshot of the 3D canvas
  const captureSnapshot = (): string | null => {
    if (!sceneRef.current || !sceneRef.current.renderer) {
      return null;
    }
    
    // Force a render to ensure the latest frame is captured
    sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    
    // Get the canvas data URL
    return sceneRef.current.renderer.domElement.toDataURL('image/png');
  };

  return { 
    updateSatelliteOrbit, 
    loadCustomModel, 
    startOrbitAnimation,
    getCurrentEarthRotation,
    captureSnapshot
  };
}
