
import * as THREE from 'three';

/**
 * Creates a pyramid geometry for sensor field visualization
 */
export function createPyramidGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
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

/**
 * Creates a curved polygon on the Earth surface to represent sensor footprint
 */
export function createCurvedFootprint(
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
