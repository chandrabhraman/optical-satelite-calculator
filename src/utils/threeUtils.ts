
import * as THREE from 'three';

/**
 * Creates a pyramid geometry for sensor field visualization
 * The pyramid is created with apex at origin (0,0,0) and base toward -Y direction (Earth)
 */
export function createPyramidGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  // Define the 5 vertices of the pyramid (4 base corners + 1 apex)
  // Apex at origin, base extends in negative Y direction
  const vertices = new Float32Array([
    // Base vertices (toward Earth direction)
    -width/2, -depth, -height/2,  // bottom left
    width/2, -depth, -height/2,   // bottom right
    width/2, -depth, height/2,    // top right
    -width/2, -depth, height/2,   // top left
    
    // Apex vertex at origin
    0, 0, 0                       // apex (at the satellite position)
  ]);
  
  // Define the indices for the triangular faces
  const indices = new Uint16Array([
    // Base
    0, 1, 2,
    0, 2, 3,
    
    // Side faces
    0, 4, 1,  // front
    1, 4, 2,  // right
    2, 4, 3,  // back
    3, 4, 0   // left
  ]);
  
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  
  return geometry;
}

/**
 * Creates a text sprite for 3D labels
 */
export function createTextSprite(message: string, parameters: any = {}): THREE.Sprite {
  if (parameters === undefined) parameters = {};
  
  const fontface = parameters.fontface || 'Arial';
  const fontsize = parameters.fontsize || 18;
  const borderThickness = parameters.borderThickness || 4;
  const borderColor = parameters.borderColor || { r:0, g:0, b:0, a:1.0 };
  const backgroundColor = parameters.backgroundColor || { r:255, g:255, b:255, a:0.8 };
  const textColor = parameters.textColor || { r:0, g:0, b:0, a:1.0 };
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Sprite();
  
  context.font = "Bold " + fontsize + "px " + fontface;
  
  // Get text size data
  const metrics = context.measureText(message);
  const textWidth = metrics.width;
  
  // Background color
  context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
  // Border color
  context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";
  
  context.lineWidth = borderThickness;
  
  // Text color
  context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
  context.fillText(message, borderThickness, fontsize + borderThickness);
  
  // Canvas content as texture
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(10, 5, 1);
  
  return sprite;
}

/**
 * Creates arrow for visualization of FOV angles
 */
export function createArrow(direction: THREE.Vector3, origin: THREE.Vector3, length: number, color: number): THREE.ArrowHelper {
  // Reduce arrow head size significantly
  const headLength = length * 0.05; // Reduced from 0.2 to 0.05
  const headWidth = headLength * 0.4; // Reduced from 0.5 to 0.4
  
  const arrow = new THREE.ArrowHelper(
    direction.normalize(),
    origin,
    length,
    color,
    headLength,
    headWidth
  );
  
  return arrow;
}

/**
 * Creates FOV angle annotations
 */
export function createFOVAnnotations(
  satellitePosition: THREE.Vector3,
  fovH: number, // in radians
  fovV: number, // in radians
  fovHDeg: number, // in degrees
  fovVDeg: number // in degrees
): THREE.Group {
  const group = new THREE.Group();
  
  // Constants for annotation
  const arrowLength = 400;
  const horizontalColor = 0x00ff00;
  const verticalColor = 0xff0000;
  
  // Calculate directional vectors for Earth-pointing orientation
  const forward = new THREE.Vector3(0, -1, 0); // Pointing toward Earth
  
  // Create horizontal FOV annotations
  const hAngleHalf = fovH / 2;
  
  // Left horizontal edge
  const leftDir = new THREE.Vector3(-Math.sin(hAngleHalf), -Math.cos(hAngleHalf), 0);
  const leftArrow = createArrow(leftDir, new THREE.Vector3(0, 0, 0), arrowLength, horizontalColor);
  group.add(leftArrow);
  
  // Right horizontal edge
  const rightDir = new THREE.Vector3(Math.sin(hAngleHalf), -Math.cos(hAngleHalf), 0);
  const rightArrow = createArrow(rightDir, new THREE.Vector3(0, 0, 0), arrowLength, horizontalColor);
  group.add(rightArrow);
  
  // Horizontal label
  const hLabel = createTextSprite(`HFOV: ${fovHDeg.toFixed(2)}°`, { 
    fontsize: 24,
    textColor: { r: 0, g: 255, b: 0, a: 1.0 },
    backgroundColor: { r: 0, g: 0, b: 0, a: 0.6 }
  });
  hLabel.position.set(arrowLength * 0.7, -arrowLength * 0.3, 0);
  group.add(hLabel);
  
  // Create vertical FOV annotations
  const vAngleHalf = fovV / 2;
  
  // Top vertical edge
  const topDir = new THREE.Vector3(0, -Math.cos(vAngleHalf), Math.sin(vAngleHalf));
  const topArrow = createArrow(topDir, new THREE.Vector3(0, 0, 0), arrowLength, verticalColor);
  group.add(topArrow);
  
  // Bottom vertical edge
  const bottomDir = new THREE.Vector3(0, -Math.cos(vAngleHalf), -Math.sin(vAngleHalf));
  const bottomArrow = createArrow(bottomDir, new THREE.Vector3(0, 0, 0), arrowLength, verticalColor);
  group.add(bottomArrow);
  
  // Vertical label
  const vLabel = createTextSprite(`VFOV: ${fovVDeg.toFixed(2)}°`, {
    fontsize: 24,
    textColor: { r: 255, g: 0, b: 0, a: 1.0 },
    backgroundColor: { r: 0, g: 0, b: 0, a: 0.6 }
  });
  vLabel.position.set(0, -arrowLength * 0.3, arrowLength * 0.7);
  group.add(vLabel);
  
  return group;
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
