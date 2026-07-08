export type ScanChannel = 'RGB' | 'NIR' | 'SWIR';
export type ScanMode = 'pushbroom' | 'whiskbroom' | 'frame';

// Sample the "true color" terrain map and remap for the given channel.
// terrain: 0..1 scalar where 0 = water, ~0.35 = soil, ~0.55 = sparse veg,
// ~0.8 = dense veg, 1 = snow/cloud.
export function paletteFor(channel: ScanChannel, terrain: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, terrain));
  if (channel === 'RGB') {
    if (t < 0.25) {
      // deep water -> shallow
      const k = t / 0.25;
      return [10 + 20 * k, 40 + 60 * k, 90 + 90 * k];
    }
    if (t < 0.45) {
      // beach / soil
      const k = (t - 0.25) / 0.2;
      return [180 - 30 * k, 160 - 40 * k, 110 - 40 * k];
    }
    if (t < 0.85) {
      // vegetation
      const k = (t - 0.45) / 0.4;
      return [80 - 40 * k, 130 + 40 * k, 60 - 20 * k];
    }
    // snow / cloud
    const k = (t - 0.85) / 0.15;
    return [200 + 55 * k, 210 + 45 * k, 220 + 35 * k];
  }
  if (channel === 'NIR') {
    // False-color IR: veg -> bright red/crimson, water -> near black, soil -> cyan-ish
    if (t < 0.25) {
      const k = t / 0.25;
      return [5 + 10 * k, 10 + 20 * k, 25 + 35 * k];
    }
    if (t < 0.45) {
      const k = (t - 0.25) / 0.2;
      return [60 + 40 * k, 150 - 40 * k, 170 - 60 * k];
    }
    if (t < 0.85) {
      const k = (t - 0.45) / 0.4;
      return [200 + 50 * k, 40 + 30 * k, 60 + 20 * k];
    }
    const k = (t - 0.85) / 0.15;
    return [230 + 25 * k, 220 + 35 * k, 220 + 35 * k];
  }
  // SWIR: water very dark, soil brown/orange, veg olive/muted, snow bright
  if (t < 0.25) {
    return [4, 6, 10];
  }
  if (t < 0.45) {
    const k = (t - 0.25) / 0.2;
    return [140 + 60 * k, 90 + 40 * k, 40 + 20 * k];
  }
  if (t < 0.85) {
    const k = (t - 0.45) / 0.4;
    return [120 - 20 * k, 120 - 10 * k, 60 - 20 * k];
  }
  const k = (t - 0.85) / 0.15;
  return [220 + 35 * k, 220 + 35 * k, 200 + 55 * k];
}

// Deterministic pseudo-terrain "value" at (x, y) using layered value-noise.
// Cheap enough to call per-pixel in a small canvas at low frame rate.
export function terrainAt(x: number, y: number): number {
  const n =
    Math.sin(x * 0.013 + y * 0.007) * 0.5 +
    Math.sin(x * 0.031 - y * 0.023 + 1.7) * 0.3 +
    Math.sin(x * 0.071 + y * 0.061 + 3.1) * 0.2;
  // remap -1..1 -> 0..1 with a slight bias toward mid values
  return Math.max(0, Math.min(1, 0.5 + n * 0.45));
}
