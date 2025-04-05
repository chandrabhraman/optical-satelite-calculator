
import { useEffect, useRef, useState } from 'react';
import { SensorInputs } from '@/utils/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import LocationInput, { LocationData } from './LocationInput';

interface SatelliteVisualizationProps {
  inputs: SensorInputs | null;
}

const SatelliteVisualization = ({ inputs }: SatelliteVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [locationData, setLocationData] = useState<LocationData>({
    location: null,
    altitude: 500
  });
  
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

  // Handle location change
  const handleLocationChange = (data: LocationData) => {
    setLocationData(data);
    if (sceneRef.current && inputs) {
      updateSatellitePosition(data);
      updateVisualization(inputs);
    }
  };

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
    sensorField.rotation.x = Math.PI; // Rotate to point down
    
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
    
    // Update visualization if inputs are provided
    if (inputs) {
      updateVisualization(inputs);
    }
    
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

  // Helper function to create a pyramid geometry
  function createPyramidGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    // Define the 5 vertices of the pyramid (4 base corners + 1 apex)
    const vertices = new Float32Array([
      // Base vertices
      -width/2, -depth/2, -height/2,  // bottom left
      width/2, -depth/2, -height/2,   // bottom right
      width/2, -depth/2, height/2,    // top right
      -width/2, -depth/2, height/2,   // top left
      
      // Apex vertex
      0, 0, 0                         // apex (center of satellite)
    ]);
    
    // Define the indices for the triangular faces
    const indices = new Uint16Array([
      // Base
      0, 2, 1,
      0, 3, 2,
      
      // Side faces
      0, 1, 4,  // front
      1, 2, 4,  // right
      2, 3, 4,  // back
      3, 0, 4   // left
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    
    return geometry;
  }

  // Function to create a curved polygon on the Earth surface to represent sensor footprint
  function createCurvedFootprint(
    earthRadius: number, 
    satellitePosition: THREE.Vector3,
    fovH: number,
    fovV: number,
    offNadirAngle: number
  ): THREE.Mesh {
    // Calculate direction to Earth center
    const directionToEarthCenter = new THREE.Vector3().subVectors(
      new THREE.Vector3(0, 0, 0),
      satellitePosition
    ).normalize();
    
    // Get satellite altitude (distance to Earth center minus Earth radius)
    const distanceToEarthCenter = satellitePosition.length();
    const altitude = distanceToEarthCenter - earthRadius;
    
    // Create a coordinate system with Z pointing to Earth center
    const zAxis = directionToEarthCenter;
    const xAxis = new THREE.Vector3(1, 0, 0);
    if (Math.abs(zAxis.dot(xAxis)) > 0.9) {
      xAxis.set(0, 1, 0);
    }
    const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
    xAxis.crossVectors(yAxis, zAxis).normalize();
    
    // Apply off-nadir angle rotation if specified
    if (offNadirAngle !== 0) {
      const offNadirRad = (offNadirAngle * Math.PI) / 180;
      const rotationAxis = xAxis;
      const rotationMatrix = new THREE.Matrix4().makeRotationAxis(rotationAxis, offNadirRad);
      zAxis.applyMatrix4(rotationMatrix);
    }
    
    // Calculate corners of the field of view at the Earth's surface
    const fovHRad = fovH / 2;
    const fovVRad = fovV / 2;
    
    // Create a high-resolution curved polygon using segments
    const segments = 32;
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // Calculate radius of intersection with Earth
    const footprintRadius = earthRadius * Math.sin(Math.atan(earthRadius / altitude));
    
    // Create vertices in a grid
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        // Map i,j to normalized coordinates in [-1,1]
        const u = (i / segments) * 2 - 1;
        const v = (j / segments) * 2 - 1;
        
        // Scale by field of view
        const x = Math.tan(fovHRad) * u * altitude;
        const y = Math.tan(fovVRad) * v * altitude;
        
        // Calculate direction from satellite to this point
        const direction = new THREE.Vector3(
          x * xAxis.x + y * yAxis.x + altitude * zAxis.x,
          x * xAxis.y + y * yAxis.y + altitude * zAxis.y,
          x * xAxis.z + y * yAxis.z + altitude * zAxis.z
        ).normalize();
        
        // Find intersection with Earth's surface
        const rayOrigin = satellitePosition.clone();
        const ray = new THREE.Ray(rayOrigin, direction);
        const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), earthRadius);
        const intersectionPoint = new THREE.Vector3();
        
        if (ray.intersectSphere(sphere, intersectionPoint)) {
          // Add vertex for intersection point
          vertices.push(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);
        } else {
          // If no intersection, use a point on the horizon
          const horizonPoint = new THREE.Vector3().addVectors(
            new THREE.Vector3(0, 0, 0),
            direction.multiplyScalar(earthRadius)
          );
          vertices.push(horizonPoint.x, horizonPoint.y, horizonPoint.z);
        }
      }
    }
    
    // Create indices for the triangles
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = i * (segments + 1) + j + 1;
        const c = (i + 1) * (segments + 1) + j;
        const d = (i + 1) * (segments + 1) + j + 1;
        
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }
    
    // Create geometry from vertices and indices
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    // Create material for footprint
    const material = new THREE.MeshBasicMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    
    return new THREE.Mesh(geometry, material);
  }

  // Update visualization function
  function updateVisualization(inputs: SensorInputs) {
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
    newSensorField.rotation.x = Math.PI;
    
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
  }

  // Update visualization whenever inputs change
  useEffect(() => {
    if (inputs && sceneRef.current) {
      updateVisualization(inputs);
    }
  }, [inputs]);

  return (
    <Card className="glassmorphism w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">Satellite Sensor Field Visualization</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4 space-y-4">
        <LocationInput 
          onLocationChange={handleLocationChange}
          initialData={locationData}
        />
        <div ref={containerRef} className="w-full h-full min-h-[400px]" />
        <div className="text-xs text-muted-foreground">
          <p>Click and drag to rotate. Scroll to zoom.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SatelliteVisualization;
