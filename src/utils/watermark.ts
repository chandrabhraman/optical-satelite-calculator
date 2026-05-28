/**
 * Adds a small translucent watermark with the site URL to a canvas (in place).
 * Placed in the bottom-right corner with elegant styling.
 */
export const drawWatermark = (
  canvas: HTMLCanvasElement,
  text: string = 'opticalsatellitetools.space'
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  // Scale font with image size, clamped
  const fontSize = Math.max(11, Math.min(20, Math.round(Math.min(w, h) * 0.018)));
  const padX = Math.round(fontSize * 0.9);
  const padY = Math.round(fontSize * 0.55);

  ctx.save();
  ctx.font = `500 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.textBaseline = 'alphabetic';

  const metrics = ctx.measureText(text);
  const textW = metrics.width;
  const boxW = textW + padX * 2;
  const boxH = fontSize + padY * 2;
  const margin = Math.round(fontSize * 1.2);
  const x = w - boxW - margin;
  const y = h - boxH - margin;

  // Translucent rounded background
  const r = Math.round(boxH / 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + boxW - r, y);
  ctx.quadraticCurveTo(x + boxW, y, x + boxW, y + r);
  ctx.lineTo(x + boxW, y + boxH - r);
  ctx.quadraticCurveTo(x + boxW, y + boxH, x + boxW - r, y + boxH);
  ctx.lineTo(x + r, y + boxH);
  ctx.quadraticCurveTo(x, y + boxH, x, y + boxH - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Watermark text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(text, x + padX, y + padY + fontSize * 0.85);
  ctx.restore();
};

/**
 * Returns a watermarked PNG data URL for an existing image data URL.
 */
export const watermarkDataUrl = async (
  dataUrl: string,
  text?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No 2D context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      drawWatermark(canvas, text);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};
