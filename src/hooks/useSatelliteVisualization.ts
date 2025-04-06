import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SensorInputs } from '@/utils/types';
import { LocationData } from '@/components/LocationInput';
import { createPyramidGeometry, createCurvedFootprint } from '@/utils/threeUtils';
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
  containerSize: { width: number; height: number };
  orbitAngle: number;
  orbitSpeed: number;
  orbitPlane: THREE.Group | null;
  orbitRadius: number;
}

interface UseSatelliteVisualizationProps {
  containerRef: React.RefObject<HTMLDivElement>;
  inputs: SensorInputs | null;
  locationData: LocationData;
  setLocationData: (data: LocationData) => void;
}

const MODEL_PATHS = [
  '/models/satellite-default.glb',
];

export function useSatelliteVisualization({
  containerRef,
  inputs,
  locationData,
  setLocationData
}: UseSatelliteVisualizationProps) {
  const sceneRef = useRef<SceneRef | null>(null);

  const updateSatellitePosition = (data: LocationData) => {
    if (!sceneRef.current || !data.location) return;
    
    if (sceneRef.current.orbitPlane) {
      sceneRef.current.scene.remove(sceneRef.current.orbitPlane);
      sceneRef.current.orbitPlane = null;
    }
    
    const earthRadius = 6371;
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

  const startOrbitAnimation = (altitude: number) => {
    if (!sceneRef.current) return;
    
    const earthRadius = 6371;
    sceneRef.current.orbitRadius = earthRadius + altitude;
    
    const GM = 398600.4418;
    const orbitCircumference = 2 * Math.PI * sceneRef.current.orbitRadius;
    const orbitPeriod = Math.sqrt((4 * Math.PI * Math.PI * Math.pow(sceneRef.current.orbitRadius, 3)) / GM);
    
    sceneRef.current.orbitSpeed = (2 * Math.PI) / (orbitPeriod * 10);
    
    console.log(`Starting orbit animation at altitude ${altitude} km`);
    console.log(`Orbit radius: ${sceneRef.current.orbitRadius} km`);
    console.log(`Orbit period would be: ${orbitPeriod.toFixed(2)} seconds`);
    console.log(`Animation speed: ${sceneRef.current.orbitSpeed.toFixed(8)} rad/frame`);
    
    const orbitPlane = new THREE.Group();
    sceneRef.current.scene.add(orbitPlane);
    sceneRef.current.orbitPlane = orbitPlane;
    
    orbitPlane.rotation.x = (98 * Math.PI) / 180;
    
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      orbitPoints.push(
        sceneRef.current.orbitRadius * Math.cos(angle),
        0,
        sceneRef.current.orbitRadius * Math.sin(angle)
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
    
    sceneRef.current.orbitAngle = 0;
    
    updateSatelliteOrbitPosition(0);
  };

  const updateSatelliteOrbitPosition = (deltaAngle: number) => {
    if (!sceneRef.current || !sceneRef.current.orbitPlane) return;
    
    sceneRef.current.orbitAngle += deltaAngle;
    
    const x = sceneRef.current.orbitRadius * Math.cos(sceneRef.current.orbitAngle);
    const z = sceneRef.current.orbitRadius * Math.sin(sceneRef.current.orbitAngle);
    
    const positionInPlane = new THREE.Vector3(x, 0, z);
    
    const worldMatrix = sceneRef.current.orbitPlane.matrixWorld.clone();
    positionInPlane.applyMatrix4(worldMatrix);
    
    sceneRef.current.satellite.position.copy(positionInPlane);
    
    sceneRef.current.satellite.lookAt(0, 0, 0);
    sceneRef.current.satellite.rotateX(Math.PI / 2);
    
    if (sceneRef.current.sensorFootprint) {
      const dirToCenter = new THREE.Vector3().subVectors(
        new THREE.Vector3(0, 0, 0),
        sceneRef.current.satellite.position
      ).normalize();
      
      const surfacePoint = dirToCenter.multiplyScalar(6371);
      
      if (sceneRef.current.sensorFootprint.parent === sceneRef.current.scene) {
        sceneRef.current.sensorFootprint.position.copy(surfacePoint);
        
        const normal = surfacePoint.clone().normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const axis = new THREE.Vector3().crossVectors(up, normal).normalize();
        const angle = Math.acos(up.dot(normal));
        
        if (!isNaN(angle) && angle !== 0) {
          sceneRef.current.sensorFootprint.quaternion.setFromAxisAngle(axis, angle);
        }
      }
    }
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
    if (!sceneRef.current) return;
    
    const earthRadius = 6371;
    const altitude = inputs.altitudeMax / 1000;
    
    if (!locationData.location) {
      startOrbitAnimation(altitude);
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
    
    newSensorField.rotation.x = Math.PI;
    newSensorField.position.y = 0;
    
    if (offNadirRad > 0) {
      newSensorField.rotation.z = offNadirRad;
    }
    
    sceneRef.current.satellite.add(newSensorField);
    sceneRef.current.sensorField = newSensorField;
    
    sceneRef.current.fovAnnotations = null;
    
    const footprint = createCurvedFootprint(
      earthRadius, 
      sceneRef.current.satellite.position, 
      fovH, 
      fovV, 
      inputs.nominalOffNadirAngle,
      calculatedParams.horizontalFootprint,
      calculatedParams.verticalFootprint
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
      depthWrite: false
    });
    
    const sensorField = new THREE.Mesh(pyramidGeometry, sensorFieldMaterial);
    
    sensorField.rotation.x = Math.PI;
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
    
    let orbitAngle = 0;
    let orbitSpeed = 0;
    let orbitPlane: THREE.Group | null = null;
    let orbitRadius = earthRadius + defaultAltitude;
    
    if (locationData.location) {
      updateSatellitePosition(locationData);
    } else {
      satellite.position.y = earthRadius + defaultAltitude;
      startOrbitAnimation(defaultAltitude);
    }
    
    function focusOnSatellite() {
      const offset = satellite.position.clone().add(new THREE.Vector3(0, 0, 2000));
      camera.position.copy(offset);
      controls.target.copy(satellite.position);
      controls.update();
    }
    
    focusOnSatellite();
    
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
    
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      controls.update();
      
      earth.rotation.y += 0.0005;
      stars.rotation.y += 0.0001;
      
      if (sceneRef.current && sceneRef.current.orbitPlane) {
        updateSatelliteOrbitPosition(sceneRef.current.orbitSpeed);
      }
      
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
      animationId: 0,
      containerSize,
      orbitAngle,
      orbitSpeed,
      orbitPlane,
      orbitRadius
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
      if (instructionsElement && instructionsElement.parentNode) {
        instructionsElement.parentNode.removeChild(instructionsElement);
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
