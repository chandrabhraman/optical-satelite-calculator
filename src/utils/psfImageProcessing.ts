export type PSFType = 'motion' | 'gaussian' | 'defocus';
export type DeconvolutionMethod = 'richardsonLucy' | 'wiener' | 'richardsonLucyTV' | 'blindDeconvolution';

interface PSFParams {
  length?: number;
  angle?: number;
  size: number;
  sigma?: number;
}

interface DeconvolutionOptions {
  iterations: number;
  method: DeconvolutionMethod;
  regularization?: number; // For TV and Wiener
  noiseVariance?: number; // For Wiener
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
 * Perform image deconvolution using specified method
 */
// Resize image if too large to prevent performance issues
function resizeImageIfNeeded(img: HTMLImageElement, maxDimension: number = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  let width = img.width;
  let height = img.height;
  
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = (height / width) * maxDimension;
      width = maxDimension;
    } else {
      width = (width / height) * maxDimension;
      height = maxDimension;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  
  return canvas;
}

export async function deconvolveImage(
  image: HTMLImageElement,
  psf: number[][],
  iterations: number,
  method: DeconvolutionMethod = 'richardsonLucy',
  regularization: number = 0.01,
  noiseVariance: number = 0.001,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Resize image if needed
  const resizedCanvas = resizeImageIfNeeded(image);
  const width = resizedCanvas.width;
  const height = resizedCanvas.height;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Cannot get canvas context');
  
  ctx.drawImage(resizedCanvas, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Separate RGB channels (normalize to 0-1)
  const channels: number[][][] = [[], [], []]; // R, G, B
  
  for (let y = 0; y < height; y++) {
    for (let c = 0; c < 3; c++) {
      channels[c][y] = [];
    }
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      channels[0][y][x] = data[idx] / 255;     // R
      channels[1][y][x] = data[idx + 1] / 255; // G
      channels[2][y][x] = data[idx + 2] / 255; // B
    }
  }
  
  // Process each channel independently with progress updates
  const deconvolvedChannels: number[][][] = [];
  
  for (let c = 0; c < 3; c++) {
    let estimate: number[][];
    const channelProgress = (prog: number) => {
      const baseProgress = 10 + (c * 25);
      onProgress?.(baseProgress + (prog * 0.25));
    };
    
    switch (method) {
      case 'wiener':
        estimate = wienerDeconvolution(channels[c], psf, noiseVariance);
        channelProgress(100);
        await new Promise(resolve => setTimeout(resolve, 0));
        break;
      case 'richardsonLucyTV':
        estimate = await richardsonLucyTV(channels[c], psf, iterations, regularization, channelProgress);
        break;
      case 'blindDeconvolution':
        estimate = await blindDeconvolution(channels[c], psf, iterations, channelProgress);
        break;
      case 'richardsonLucy':
      default:
        estimate = await richardsonLucy(channels[c], psf, iterations, channelProgress);
        break;
    }
    
    deconvolvedChannels[c] = estimate;
  }
  
  onProgress?.(85);
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // Reconstruct RGB image from deconvolved channels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, Math.max(0, deconvolvedChannels[0][y][x] * 255));     // R
      data[idx + 1] = Math.min(255, Math.max(0, deconvolvedChannels[1][y][x] * 255)); // G
      data[idx + 2] = Math.min(255, Math.max(0, deconvolvedChannels[2][y][x] * 255)); // B
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  onProgress?.(100);
  return canvas.toDataURL();
}

/**
 * Richardson-Lucy deconvolution algorithm
 */
async function richardsonLucy(
  image: number[][], 
  psf: number[][], 
  iterations: number,
  onProgress?: (progress: number) => void
): Promise<number[][]> {
  const height = image.length;
  const width = image[0].length;
  let estimate = image.map(row => [...row]);
  
  for (let iter = 0; iter < iterations; iter++) {
    const convolved = convolve2D(estimate, psf);
    
    const ratio: number[][] = [];
    for (let y = 0; y < height; y++) {
      ratio[y] = [];
      for (let x = 0; x < width; x++) {
        ratio[y][x] = convolved[y][x] > 1e-10 ? image[y][x] / convolved[y][x] : 0;
      }
    }
    
    const psfFlipped = psf.map(row => [...row].reverse()).reverse();
    const correction = convolve2D(ratio, psfFlipped);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        estimate[y][x] *= correction[y][x];
        estimate[y][x] = Math.max(0, estimate[y][x]); // Non-negativity constraint
      }
    }
    
    // Yield to UI every 5 iterations
    if (iter % 5 === 0) {
      onProgress?.((iter / iterations) * 100);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return estimate;
}

/**
 * Richardson-Lucy with Total Variation regularization
 */
async function richardsonLucyTV(
  image: number[][], 
  psf: number[][], 
  iterations: number, 
  lambda: number,
  onProgress?: (progress: number) => void
): Promise<number[][]> {
  const height = image.length;
  const width = image[0].length;
  let estimate = image.map(row => [...row]);
  
  for (let iter = 0; iter < iterations; iter++) {
    const convolved = convolve2D(estimate, psf);
    
    const ratio: number[][] = [];
    for (let y = 0; y < height; y++) {
      ratio[y] = [];
      for (let x = 0; x < width; x++) {
        ratio[y][x] = convolved[y][x] > 1e-10 ? image[y][x] / convolved[y][x] : 0;
      }
    }
    
    const psfFlipped = psf.map(row => [...row].reverse()).reverse();
    const correction = convolve2D(ratio, psfFlipped);
    
    // Compute TV gradient
    const tvGrad = computeTVGradient(estimate);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        estimate[y][x] *= correction[y][x];
        estimate[y][x] -= lambda * tvGrad[y][x]; // TV regularization
        estimate[y][x] = Math.max(0, estimate[y][x]);
      }
    }
    
    // Yield to UI every 5 iterations
    if (iter % 5 === 0) {
      onProgress?.((iter / iterations) * 100);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return estimate;
}

/**
 * Wiener filter deconvolution
 */
function wienerDeconvolution(image: number[][], psf: number[][], noiseVariance: number): number[][] {
  const height = image.length;
  const width = image[0].length;
  
  // Apply FFT-based Wiener filtering (simplified spatial domain approximation)
  const psfFlipped = psf.map(row => [...row].reverse()).reverse();
  
  // Compute PSF power
  const psfPower = psf.flat().reduce((sum, val) => sum + val * val, 0);
  
  // Wiener filter coefficient
  const wienerCoef = psfPower / (psfPower + noiseVariance);
  
  // Correlate with PSF
  const filtered = convolve2D(image, psfFlipped);
  
  // Apply Wiener coefficient
  const result: number[][] = [];
  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      result[y][x] = filtered[y][x] * wienerCoef;
      result[y][x] = Math.max(0, Math.min(1, result[y][x]));
    }
  }
  
  return result;
}

/**
 * Blind deconvolution (alternating minimization)
 */
async function blindDeconvolution(
  image: number[][], 
  initialPsf: number[][], 
  iterations: number,
  onProgress?: (progress: number) => void
): Promise<number[][]> {
  const height = image.length;
  const width = image[0].length;
  let estimate = image.map(row => [...row]);
  let psf = initialPsf.map(row => [...row]);
  
  for (let iter = 0; iter < iterations; iter++) {
    // Update image estimate
    estimate = await richardsonLucy(image, psf, 2);
    
    // Update PSF estimate (every few iterations)
    if (iter % 3 === 0 && iter > 0) {
      psf = estimatePSFFromImage(image, estimate, psf.length);
    }
    
    // Yield to UI every 3 iterations (blind deconv is slower)
    if (iter % 3 === 0) {
      onProgress?.((iter / iterations) * 100);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return estimate;
}

/**
 * Estimate PSF from image and its estimate
 */
function estimatePSFFromImage(blurred: number[][], sharp: number[][], psfSize: number): number[][] {
  const psf: number[][] = Array(psfSize).fill(0).map(() => Array(psfSize).fill(0));
  const center = Math.floor(psfSize / 2);
  
  // Simplified PSF estimation using gradient correlation
  const height = blurred.length;
  const width = blurred[0].length;
  
  for (let py = 0; py < psfSize; py++) {
    for (let px = 0; px < psfSize; px++) {
      let sum = 0;
      let count = 0;
      
      for (let y = center; y < height - center; y++) {
        for (let x = center; x < width - center; x++) {
          const sy = y + py - center;
          const sx = x + px - center;
          
          if (sy >= 0 && sy < height && sx >= 0 && sx < width) {
            sum += blurred[y][x] * sharp[sy][sx];
            count++;
          }
        }
      }
      
      psf[py][px] = count > 0 ? sum / count : 0;
    }
  }
  
  // Normalize PSF
  const psfSum = psf.flat().reduce((a, b) => a + b, 0);
  if (psfSum > 0) {
    for (let i = 0; i < psfSize; i++) {
      for (let j = 0; j < psfSize; j++) {
        psf[i][j] /= psfSum;
      }
    }
  }
  
  return psf;
}

/**
 * Compute Total Variation gradient
 */
function computeTVGradient(image: number[][]): number[][] {
  const height = image.length;
  const width = image[0].length;
  const gradient: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    gradient[y] = [];
    for (let x = 0; x < width; x++) {
      let gx = 0, gy = 0;
      
      // Forward differences
      if (x < width - 1) gx = image[y][x + 1] - image[y][x];
      if (y < height - 1) gy = image[y + 1][x] - image[y][x];
      
      const magnitude = Math.sqrt(gx * gx + gy * gy) + 1e-8;
      gradient[y][x] = (gx + gy) / magnitude;
    }
  }
  
  return gradient;
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
