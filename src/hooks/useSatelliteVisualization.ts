
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SensorInputs } from '@/utils/types';
import { LocationData } from '@/components/LocationInput';
import { createPyramidGeometry, createCurvedFootprint, createFOVAnnotations } from '@/utils/threeUtils';
import { calculateSensorParameters } from '@/utils/sensorCalculations';

interface SceneRef {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  satellite: THREE.Group;
  sensorField: THREE.Mesh;
  fovAnnotations: THREE.Group | null;
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

  const updateSatellitePosition = (data: LocationData) => {
    if (!sceneRef.current || !data.location) return;
    
    const earthRadius = 6371; // Earth radius in km
    const altitude = data.altitude;
    
    const lat = data.location.lat * Math.PI / 180;
    const lng = data.location.lng * Math.PI / 180;
    
    const surfaceX = earthRadius * Math.cos(lat) * Math.cos(lng);
    const surfaceY = earthRadius * Math.sin(lat);
    const surfaceZ = earthRadius * Math.cos(lat) * Math.sin(lng);
    
    const directionVector = new THREE.Vector3(surfaceX, surfaceY, surfaceZ).normalize();
    
    const satellitePosition = directionVector.clone().multiplyScalar(earthRadius + altitude);
    
    sceneRef.current.satellite.position.copy(satellitePosition);
    
    sceneRef.current.satellite.lookAt(0, 0, 0);
    
    sceneRef.current.satellite.rotateX(Math.PI / 2);
    
    sceneRef.current.controls.target.copy(sceneRef.current.satellite.position);
    sceneRef.current.controls.update();
  };

  const loadCustomModel = (file: File) => {
    if (!sceneRef.current) return;
    
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
      createDefaultSatelliteModel(satelliteGroup);
      
      URL.revokeObjectURL(objectUrl);
      return;
    }
    
    // Get current altitude for better scaling
    const altitude = inputs ? inputs.altitudeMax / 1000 : 600; // Default to 600km if no inputs
    const earthRadius = 6371; // Earth radius in km
    
    // Calculate scale based on a percentage of Earth radius rather than altitude
    // Setting it to 1-3% of Earth radius for better visual proportion
    const satelliteScale = earthRadius * 0.02; // 2% of Earth radius
    
    const loader = new GLTFLoader();
    loader.load(
      objectUrl,
      (gltf) => {
        console.log('Model loaded successfully');
        
        // Apply more appropriate scaling relative to Earth size
        gltf.scene.scale.set(satelliteScale, satelliteScale, satelliteScale);
        
        // Optional: normalize the model position to center it
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
        createDefaultSatelliteModel(satelliteGroup);
      }
    );
  };

  const createDefaultSatelliteModel = (satelliteGroup: THREE.Group) => {
    const satelliteGeometry = new THREE.BoxGeometry(300, 100, 200);
    const satelliteMaterial = new THREE.MeshPhongMaterial({
      color: 0xCCCCCC,
      emissive: 0x333333,
      specular: 0x111111,
      shininess: 50
    });
    const satelliteBody = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
    satelliteBody.castShadow = true;
    satelliteBody.rotation.x = 0;
    satelliteGroup.add(satelliteBody);
    
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
    satelliteGroup.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.x = 400;
    rightPanel.castShadow = true;
    satelliteGroup.add(rightPanel);
  };

  const updateVisualization = (inputs: SensorInputs) => {
    if (!sceneRef.current) return;
    
    const earthRadius = 6371; // Earth radius in km
    const altitude = inputs.altitudeMax / 1000; // Convert to km
    
    const calculatedParams = calculateSensorParameters({
      pixelSize: inputs.pixelSize,
      pixelCountH: inputs.pixelCountH,
      pixelCountV: inputs.pixelCountV,
      gsdRequirements: inputs.gsdRequirements,
      altitudeMin: inputs.altitudeMin / 1000, // Convert to km
      altitudeMax: inputs.altitudeMax / 1000, // Convert to km
      focalLength: inputs.focalLength,
      aperture: inputs.aperture,
      nominalOffNadirAngle: inputs.nominalOffNadirAngle
    });
    
    const fovH = calculatedParams.hfovDeg * Math.PI / 180; // Convert to radians
    const fovV = calculatedParams.vfovDeg * Math.PI / 180; // Convert to radians
    
    console.log(`Calculated FOV - Horizontal: ${calculatedParams.hfovDeg.toFixed(2)}°, Vertical: ${calculatedParams.vfovDeg.toFixed(2)}°`);
    
    if (!locationData.location) {
      sceneRef.current.satellite.position.y = earthRadius + altitude;
    }
    
    if (sceneRef.current.sensorField) {
      sceneRef.current.satellite.remove(sceneRef.current.sensorField);
    }
    
    if (sceneRef.current.fovAnnotations) {
      sceneRef.current.satellite.remove(sceneRef.current.fovAnnotations);
    }
    
    if (sceneRef.current.sensorFootprint) {
      sceneRef.current.scene.remove(sceneRef.current.sensorFootprint);
    }
    
    const offNadirRad = (inputs.nominalOffNadirAngle * Math.PI) / 180;
    
    const pyramidHeight = altitude;
    
    const baseWidth = 2 * pyramidHeight * Math.tan(fovH / 2);
    const baseHeight = 2 * pyramidHeight * Math.tan(fovV / 2);
    
    const pyramidGeometry = createPyramidGeometry(baseWidth, baseHeight, pyramidHeight);
    
    const sensorFieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const newSensorField = new THREE.Mesh(pyramidGeometry, sensorFieldMaterial);
    
    newSensorField.rotation.x = Math.PI; // Rotate 180 degrees to point toward Earth
    newSensorField.position.y = 0;
    
    if (offNadirRad > 0) {
      newSensorField.rotation.z = offNadirRad;
    }
    
    sceneRef.current.satellite.add(newSensorField);
    sceneRef.current.sensorField = newSensorField;
    
    const fovAnnotations = createFOVAnnotations(
      sceneRef.current.satellite.position,
      fovH,
      fovV,
      calculatedParams.hfovDeg,
      calculatedParams.vfovDeg
    );
    
    sceneRef.current.satellite.add(fovAnnotations);
    sceneRef.current.fovAnnotations = fovAnnotations;
    
    const footprint = createCurvedFootprint(
      earthRadius, 
      sceneRef.current.satellite.position, 
      fovH, 
      fovV, 
      inputs.nominalOffNadirAngle
    );
    
    sceneRef.current.scene.add(footprint);
    sceneRef.current.sensorFootprint = footprint;
    
    sceneRef.current.controls.target.copy(sceneRef.current.satellite.position);
    sceneRef.current.controls.update();
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
    
    // Remove fog to prevent dimming when zooming out
    // scene.fog = new THREE.FogExp2(0x0A0F1A, 0.00005);
    
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      500000
    );
    camera.position.set(0, 2000, 15000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    
    // Increase ambient light intensity to ensure scene is visible when zoomed out
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Increased from default
    scene.add(ambientLight);
    
    // Increase directional light intensity for better visibility at distance
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.5); // Increased intensity
    directionalLight.position.set(5000, 3000, 5000);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Increase hemisphere light for better ambient illumination
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.8); // Increased from 0.5
    scene.add(hemisphereLight);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 100;
    controls.maxDistance = 200000;
    
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
    
    createDefaultSatelliteModel(satellite);
    
    const defaultSensorAngle = Math.PI / 12;
    const sensorHeight = 600;
    const baseSize = Math.tan(defaultSensorAngle) * sensorHeight;
    
    const pyramidGeometry = createPyramidGeometry(baseSize, baseSize, sensorHeight);
    
    const sensorFieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const sensorField = new THREE.Mesh(pyramidGeometry, sensorFieldMaterial);
    
    sensorField.rotation.x = Math.PI; // Rotate 180 degrees to point toward Earth
    sensorField.position.y = 0;
    satellite.add(sensorField);
    
    const defaultFootprintGeometry = new THREE.CircleGeometry(500, 32);
    const footprintMaterial = new THREE.MeshBasicMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    
    const sensorFootprint = new THREE.Mesh(defaultFootprintGeometry, footprintMaterial);
    sensorFootprint.position.y = -earthRadius;
    sensorFootprint.rotation.x = -Math.PI / 2;
    scene.add(sensorFootprint);
    
    const defaultAltitude = 600;
    satellite.position.y = earthRadius + defaultAltitude;
    
    satellite.lookAt(0, 0, 0);
    satellite.rotateX(Math.PI / 2);
    
    if (locationData.location) {
      updateSatellitePosition(locationData);
    }
    
    function focusOnSatellite() {
      const offset = satellite.position.clone().add(new THREE.Vector3(0, 0, 2000));
      camera.position.copy(offset);
      controls.target.copy(satellite.position);
      controls.update();
    }
    
    focusOnSatellite();
    
    const handleResize = () => {
      if (containerRef.current) {
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Create custom look at function that doesn't dim with distance
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      controls.update();
      
      earth.rotation.y += 0.0005;
      
      stars.rotation.y += 0.0001;
      
      renderer.render(scene, camera);
      
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }
    };
    
    animate();
    
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
      animationId: 0
    };
    
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
  
  useEffect(() => {
    if (inputs && sceneRef.current) {
      updateVisualization(inputs);
    }
  }, [inputs]);

  return { updateSatellitePosition, loadCustomModel };
}
