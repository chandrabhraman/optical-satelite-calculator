export type PSFType = 'motion' | 'gaussian' | 'defocus';

interface PSFParams {
  length?: number;
  angle?: number;
  size: number;
  sigma?: number;
}

/**
 * Generate a Point Spread Function kernel
 */
export function estimatePSF(type: PSFType, params: PSFParams): number[][] {
  const { size } = params;
  
  switch (type) {
    case 'motion':
      return generateMotionPSF(params.length || 10, params.angle || 0, size);
    case 'gaussian':
      return generateGaussianPSF(size, params.sigma || 2);
    case 'defocus':
      return generateDefocusPSF(size);
    default:
      return generateMotionPSF(10, 0, size);
  }
}

/**
 * Generate a motion blur PSF
 */
function generateMotionPSF(length: number, angle: number, size: number): number[][] {
  const psf: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  const center = Math.floor(size / 2);
  
  const angleRad = (angle * Math.PI) / 180;
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);
  
  for (let i = 0; i < length; i++) {
    const x = Math.round(center + dx * (i - length / 2));
    const y = Math.round(center + dy * (i - length / 2));
    
    if (x >= 0 && x < size && y >= 0 && y < size) {
      psf[y][x] += 1;
    }
  }
  
  // Normalize
  const sum = psf.flat().reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        psf[i][j] /= sum;
      }
    }
  }
  
  return psf;
}

/**
 * Generate a Gaussian PSF
 */
function generateGaussianPSF(size: number, sigma: number): number[][] {
  const psf: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  const center = Math.floor(size / 2);
  
  let sum = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const x = j - center;
      const y = i - center;
      const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      psf[i][j] = value;
      sum += value;
    }
  }
  
  // Normalize
  if (sum > 0) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        psf[i][j] /= sum;
      }
    }
  }
  
  return psf;
}

/**
 * Generate a defocus PSF (disk)
 */
function generateDefocusPSF(size: number): number[][] {
  const psf: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  const center = Math.floor(size / 2);
  const radius = size / 4;
  
  let sum = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const x = j - center;
      const y = i - center;
      const dist = Math.sqrt(x * x + y * y);
      
      if (dist <= radius) {
        psf[i][j] = 1;
        sum += 1;
      }
    }
  }
  
  // Normalize
  if (sum > 0) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        psf[i][j] /= sum;
      }
    }
  }
  
  return psf;
}

/**
 * Perform Richardson-Lucy deconvolution
 */
export async function deconvolveImage(
  image: HTMLImageElement,
  psf: number[][],
  iterations: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Cannot get canvas context');
  
  // Set canvas size
  canvas.width = image.width;
  canvas.height = image.height;
  
  // Draw image to canvas
  ctx.drawImage(image, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Convert to grayscale for processing
  const width = canvas.width;
  const height = canvas.height;
  const gray: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    gray[y] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      gray[y][x] = (data[idx] + data[idx + 1] + data[idx + 2]) / (3 * 255);
    }
  }
  
  // Initialize estimate
  let estimate = gray.map(row => [...row]);
  
  // Richardson-Lucy iterations
  for (let iter = 0; iter < iterations; iter++) {
    // Convolve estimate with PSF
    const convolved = convolve2D(estimate, psf);
    
    // Compute ratio
    const ratio: number[][] = [];
    for (let y = 0; y < height; y++) {
      ratio[y] = [];
      for (let x = 0; x < width; x++) {
        ratio[y][x] = convolved[y][x] > 0 ? gray[y][x] / convolved[y][x] : 0;
      }
    }
    
    // Flip PSF for correlation
    const psfFlipped = psf.map(row => [...row].reverse()).reverse();
    
    // Correlate with flipped PSF
    const correction = convolve2D(ratio, psfFlipped);
    
    // Update estimate
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        estimate[y][x] *= correction[y][x];
      }
    }
  }
  
  // Convert back to image
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const value = Math.min(255, Math.max(0, estimate[y][x] * 255));
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

/**
 * 2D convolution
 */
function convolve2D(image: number[][], kernel: number[][]): number[][] {
  const height = image.length;
  const width = image[0].length;
  const kHeight = kernel.length;
  const kWidth = kernel[0].length;
  const kCenterY = Math.floor(kHeight / 2);
  const kCenterX = Math.floor(kWidth / 2);
  
  const result: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      let sum = 0;
      
      for (let ky = 0; ky < kHeight; ky++) {
        for (let kx = 0; kx < kWidth; kx++) {
          const iy = y + ky - kCenterY;
          const ix = x + kx - kCenterX;
          
          if (iy >= 0 && iy < height && ix >= 0 && ix < width) {
            sum += image[iy][ix] * kernel[ky][kx];
          }
        }
      }
      
      result[y][x] = sum;
    }
  }
  
  return result;
}
