import * as THREE from 'three';

/**
 * Creates a pyramid geometry for sensor field visualization
 * The pyramid is created with apex at origin (0,0,0) and base toward -Y direction
 * Adapted for Z-polar coordinate system
 */
export function createPyramidGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  // Define the 5 vertices of the pyramid (4 base corners + 1 apex)
  // Apex at origin, base extends in negative Y direction
  // For Z-polar system, we keep the sensor pointing in -Y direction
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
 * Creates FOV angle annotations with arrows and text labels
 * Enhanced to make annotations more visible and illustrative
 * Updated for Z-polar coordinate system
 */
export function createFOVAnnotations(
  satellitePosition: THREE.Vector3,
  fovH: number, // in radians
  fovV: number, // in radians
  fovHDeg: number, // in degrees
  fovVDeg: number // in degrees
): THREE.Group {
  const group = new THREE.Group();
  
  // Calculate better positions for the labels based on the FOV angles
  const distanceFromOrigin = 1000; // Fixed distance for visibility
  
  // Create horizontal FOV label with arrow indicators
  const hLabel = createTextSprite(`HFOV: ${fovHDeg.toFixed(2)}°`, { 
    fontsize: 32, // Increased font size
    textColor: { r: 0, g: 255, b: 0, a: 1.0 },
    backgroundColor: { r: 0, g: 0, b: 0, a: 0.8 } // More opaque background
  });
  
  // Position label at right side of the sensor field view - adjusted for Z-polar
  hLabel.position.set(distanceFromOrigin, -200, 0);
  group.add(hLabel);
  
  // Add horizontal FOV indicator arrows - adjusted for Z-polar
  const hArrowLeft = createArrow(
    new THREE.Vector3(-1, 0, 0), // Left direction
    new THREE.Vector3(0, -100, 0), // Slightly below origin
    distanceFromOrigin * 0.8, // Arrow length
    0x00FF00 // Green color
  );
  group.add(hArrowLeft);
  
  const hArrowRight = createArrow(
    new THREE.Vector3(1, 0, 0), // Right direction
    new THREE.Vector3(0, -100, 0), // Slightly below origin
    distanceFromOrigin * 0.8, // Arrow length
    0x00FF00 // Green color
  );
  group.add(hArrowRight);
  
  // Create vertical FOV label - adjusted for Z-polar
  const vLabel = createTextSprite(`VFOV: ${fovVDeg.toFixed(2)}°`, {
    fontsize: 32, // Increased font size
    textColor: { r: 255, g: 50, b: 50, a: 1.0 },
    backgroundColor: { r: 0, g: 0, b: 0, a: 0.8 } // More opaque background
  });
  
  // Position label on the side for better visibility - adjusted for Z-polar
  vLabel.position.set(0, -200, distanceFromOrigin);
  group.add(vLabel);
  
  // Add vertical FOV indicator arrows - adjusted for Z-polar
  const vArrowUp = createArrow(
    new THREE.Vector3(0, 0, 1), // Up direction in Z-polar system
    new THREE.Vector3(0, -100, 0), // Slightly below origin
    distanceFromOrigin * 0.8, // Arrow length
    0xFF3333 // Red color
  );
  group.add(vArrowUp);
  
  const vArrowDown = createArrow(
    new THREE.Vector3(0, 0, -1), // Down direction in Z-polar system
    new THREE.Vector3(0, -100, 0), // Slightly below origin
    distanceFromOrigin * 0.8, // Arrow length
    0xFF3333 // Red color
  );
  group.add(vArrowDown);
  
  // Add diagonal arrows to show the actual FOV angles - adjusted for Z-polar
  const hAngle = fovH / 2; // Half of horizontal FOV
  const vAngle = fovV / 2; // Half of vertical FOV
  
  // Calculate directions based on FOV angles for Z-polar system
  const rightDirection = new THREE.Vector3(
    Math.sin(hAngle),
    -Math.cos(hAngle),
    0
  ).normalize();
  
  const leftDirection = new THREE.Vector3(
    -Math.sin(hAngle),
    -Math.cos(hAngle),
    0
  ).normalize();
  
  const upDirection = new THREE.Vector3(
    0,
    -Math.cos(vAngle),
    Math.sin(vAngle)
  ).normalize();
  
  const downDirection = new THREE.Vector3(
    0,
    -Math.cos(vAngle),
    -Math.sin(vAngle)
  ).normalize();
  
  // Create the actual FOV boundary arrows
  const rightFovArrow = createArrow(
    rightDirection,
    new THREE.Vector3(0, 0, 0),
    distanceFromOrigin * 1.2,
    0x00AA00 // Darker green
  );
  group.add(rightFovArrow);
  
  const leftFovArrow = createArrow(
    leftDirection,
    new THREE.Vector3(0, 0, 0),
    distanceFromOrigin * 1.2,
    0x00AA00 // Darker green
  );
  group.add(leftFovArrow);
  
  const upFovArrow = createArrow(
    upDirection,
    new THREE.Vector3(0, 0, 0),
    distanceFromOrigin * 1.2,
    0xAA0000 // Darker red
  );
  group.add(upFovArrow);
  
  const downFovArrow = createArrow(
    downDirection,
    new THREE.Vector3(0, 0, 0),
    distanceFromOrigin * 1.2,
    0xAA0000 // Darker red
  );
  group.add(downFovArrow);
  
  return group;
}

/**
 * Creates a curved polygon on the Earth surface to represent sensor footprint
 * Updated for Z-polar coordinate system
 */
export function createCurvedFootprint(
  earthRadius: number, 
  satellitePosition: THREE.Vector3,
  fovH: number,
  fovV: number,
  offNadirAngle: number,
  horizontalFootprint: number = 0, // in km
  verticalFootprint: number = 0 // in km
): THREE.Group {
  const group = new THREE.Group();

  // Calculate direction to Earth center
  const directionToEarthCenter = new THREE.Vector3().subVectors(
    new THREE.Vector3(0, 0, 0),
    satellitePosition
  ).normalize();
  
  // Get satellite altitude (distance to Earth center minus Earth radius)
  const distanceToEarthCenter = satellitePosition.length();
  const altitude = distanceToEarthCenter - earthRadius;
  
  // Create a coordinate system with Y pointing to Earth center in Z-polar system
  const yAxis = directionToEarthCenter; // Y is toward Earth center
  const zAxis = new THREE.Vector3(0, 0, 1); // Z is polar axis
  
  // Create X axis orthogonal to Y and Z
  const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
  
  // Recalculate Z to ensure orthogonality
  const zAxisAdjusted = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  
  // Apply off-nadir angle rotation if specified
  if (offNadirAngle !== 0) {
    const offNadirRad = (offNadirAngle * Math.PI) / 180;
    const rotationAxis = xAxis;
    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(rotationAxis, offNadirRad);
    yAxis.applyMatrix4(rotationMatrix);
  }
  
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
      const xOffset = Math.tan(fovH / 2) * u * altitude;
      const zOffset = Math.tan(fovV / 2) * v * altitude;
      
      // Calculate direction from satellite to this point in Z-polar system
      const direction = new THREE.Vector3(
        xOffset * xAxis.x + altitude * yAxis.x + zOffset * zAxisAdjusted.x,
        xOffset * xAxis.y + altitude * yAxis.y + zOffset * zAxisAdjusted.y,
        xOffset * xAxis.z + altitude * yAxis.z + zOffset * zAxisAdjusted.z
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
  
  const footprintMesh = new THREE.Mesh(geometry, material);
  group.add(footprintMesh);
  
  // Add dimension labels if footprint sizes are provided
  if (horizontalFootprint > 0) {
    // Create horizontal footprint label
    const hLabel = createTextSprite(`Horizontal: ${horizontalFootprint.toFixed(1)} km`, {
      fontsize: 24,
      textColor: { r: 255, g: 255, b: 255, a: 1.0 },
      backgroundColor: { r: 0, g: 0, b: 0, a: 0.7 }
    });
    
    // Calculate position for horizontal label - adjusted for Z-polar
    const rightEdgePosition = new THREE.Vector3();
    rightEdgePosition.setFromMatrixPosition(footprintMesh.matrixWorld);
    rightEdgePosition.x += footprintRadius * 0.7;
    rightEdgePosition.y -= 20; // Small offset from the footprint
    hLabel.position.copy(rightEdgePosition);
    
    group.add(hLabel);
  }
  
  if (verticalFootprint > 0) {
    // Create vertical footprint label
    const vLabel = createTextSprite(`Vertical: ${verticalFootprint.toFixed(1)} km`, {
      fontsize: 24,
      textColor: { r: 255, g: 255, b: 255, a: 1.0 },
      backgroundColor: { r: 0, g: 0, b: 0, a: 0.7 }
    });
    
    // Calculate position for vertical label - adjusted for Z-polar
    const topEdgePosition = new THREE.Vector3();
    topEdgePosition.setFromMatrixPosition(footprintMesh.matrixWorld);
    topEdgePosition.z += footprintRadius * 0.7; // Z is up in Z-polar system
    topEdgePosition.y -= 20; // Small offset from the footprint
    vLabel.position.copy(topEdgePosition);
    
    group.add(vLabel);
  }
  
  return group;
}
