/**
 * Celestrak API utilities for fetching active satellite TLEs
 */

export interface CelestrakSatellite {
  name: string;
  line1: string;
  line2: string;
  noradId: string;
  constellation?: string;
  country?: string;
}

// Common constellation patterns to detect from satellite names
export const KNOWN_CONSTELLATIONS = [
  'STARLINK',
  'ONEWEB',
  'FLOCK',
  'LEMUR',
  'DOVE',
  'PLANETSCOPE',
  'SPIRE',
  'IRIDIUM',
  'GLOBALSTAR',
  'ORBCOMM',
  'COSMOS',
  'YAOGAN',
  'JILIN',
  'SKYSAT',
  'WORLDVIEW',
  'SENTINEL',
  'LANDSAT',
  'GOES',
  'NOAA',
  'METOP',
];

/**
 * Fetch active satellite TLEs from Celestrak
 */
export async function fetchActiveSatellites(): Promise<CelestrakSatellite[]> {
  const response = await fetch(
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
    { mode: 'cors' }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch TLEs: ${response.status}`);
  }
  
  const tleText = await response.text();
  return parseTLEBatch(tleText);
}

/**
 * Parse batch TLE data into satellite objects
 */
function parseTLEBatch(tleText: string): CelestrakSatellite[] {
  const lines = tleText.trim().split('\n');
  const satellites: CelestrakSatellite[] = [];
  
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 >= lines.length) break;
    
    const name = lines[i].trim();
    const line1 = lines[i + 1].trim();
    const line2 = lines[i + 2].trim();
    
    // Validate TLE format
    if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
      continue;
    }
    
    // Extract NORAD ID from line 1
    const noradId = line1.substring(2, 7).trim();
    
    // Detect constellation from name
    const constellation = detectConstellation(name);
    
    satellites.push({
      name,
      line1,
      line2,
      noradId,
      constellation,
    });
  }
  
  return satellites;
}

/**
 * Detect constellation from satellite name
 */
function detectConstellation(name: string): string | undefined {
  const upperName = name.toUpperCase();
  
  for (const constellation of KNOWN_CONSTELLATIONS) {
    if (upperName.includes(constellation)) {
      return constellation;
    }
  }
  
  return undefined;
}

/**
 * Filter satellites by search term (searches name)
 */
export function filterSatellitesByName(
  satellites: CelestrakSatellite[],
  searchTerm: string
): CelestrakSatellite[] {
  if (!searchTerm.trim()) return satellites;
  
  const term = searchTerm.toLowerCase();
  return satellites.filter(sat => 
    sat.name.toLowerCase().includes(term)
  );
}

/**
 * Filter satellites by constellation
 */
export function filterSatellitesByConstellation(
  satellites: CelestrakSatellite[],
  constellation: string
): CelestrakSatellite[] {
  if (!constellation) return satellites;
  
  const term = constellation.toUpperCase();
  return satellites.filter(sat => 
    sat.name.toUpperCase().includes(term)
  );
}

/**
 * Get unique constellation names from satellite list
 */
export function getUniqueConstellations(satellites: CelestrakSatellite[]): string[] {
  const constellations = new Set<string>();
  
  satellites.forEach(sat => {
    if (sat.constellation) {
      constellations.add(sat.constellation);
    }
  });
  
  return Array.from(constellations).sort();
}

/**
 * Fetch satellite country from KeepTrack API
 */
export async function fetchSatelliteCountry(noradId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.keeptrack.space/v2/sat/${noradId}`,
      { mode: 'cors' }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.country || data.C || null;
  } catch {
    return null;
  }
}

/**
 * Batch fetch countries for multiple satellites (with rate limiting)
 */
export async function fetchSatelliteCountries(
  noradIds: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<Map<string, string>> {
  const countries = new Map<string, string>();
  const batchSize = 10;
  
  for (let i = 0; i < noradIds.length; i += batchSize) {
    const batch = noradIds.slice(i, i + batchSize);
    
    const promises = batch.map(async (id) => {
      const country = await fetchSatelliteCountry(id);
      if (country) {
        countries.set(id, country);
      }
    });
    
    await Promise.all(promises);
    onProgress?.(Math.min(i + batchSize, noradIds.length), noradIds.length);
    
    // Rate limit: wait 100ms between batches
    if (i + batchSize < noradIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return countries;
}
