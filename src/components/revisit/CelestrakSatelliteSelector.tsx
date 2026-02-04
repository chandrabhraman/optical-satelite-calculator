import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Search, Satellite, X, RefreshCw, Check } from "lucide-react";
import {
  filterSatellitesByName,
  getUniqueConstellations,
  CelestrakSatellite,
} from "@/utils/celestrakApi";

interface CelestrakSatelliteSelectorProps {
  onSatellitesSelected: (satellites: CelestrakSatellite[]) => void;
  selectedSatellites: CelestrakSatellite[];
}

const CelestrakSatelliteSelector: React.FC<CelestrakSatelliteSelectorProps> = ({
  onSatellitesSelected,
  selectedSatellites,
}) => {
  const [allSatellites, setAllSatellites] = useState<CelestrakSatellite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConstellationFilter, setSelectedConstellationFilter] = useState<string>("");

  // Create a Set of selected IDs for fast lookup
  const selectedIds = useMemo(() => 
    new Set(selectedSatellites.map(s => s.noradId)),
    [selectedSatellites]
  );

  // Fetch satellites on mount
  useEffect(() => {
    loadSatellites();
  }, []);

  const loadSatellites = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);
    setLoadingStage("Connecting to Celestrak...");
    
    try {
      setLoadingProgress(10);
      setLoadingStage("Downloading TLE data...");
      
      const response = await fetch(
        'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
        { mode: 'cors' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch TLEs: ${response.status}`);
      }
      
      setLoadingProgress(50);
      setLoadingStage("Processing satellite data...");
      
      const tleText = await response.text();
      const lines = tleText.trim().split('\n');
      const satellites: CelestrakSatellite[] = [];
      const totalLines = lines.length;
      
      for (let i = 0; i < lines.length; i += 3) {
        if (i + 2 >= lines.length) break;
        
        const name = lines[i].trim();
        const line1 = lines[i + 1].trim();
        const line2 = lines[i + 2].trim();
        
        if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
          continue;
        }
        
        const noradId = line1.substring(2, 7).trim();
        const constellation = detectConstellation(name);
        
        satellites.push({ name, line1, line2, noradId, constellation });
        
        // Update progress every 500 satellites
        if (i % 1500 === 0) {
          const parseProgress = 50 + ((i / totalLines) * 40);
          setLoadingProgress(Math.round(parseProgress));
        }
      }
      
      setLoadingProgress(95);
      setLoadingStage("Finalizing...");
      
      setAllSatellites(satellites);
      setLoadingProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch satellites");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Detect constellation from satellite name
  const detectConstellation = (name: string): string | undefined => {
    const upperName = name.toUpperCase();
    const knownConstellations = [
      'STARLINK', 'ONEWEB', 'FLOCK', 'LEMUR', 'DOVE', 'PLANETSCOPE',
      'SPIRE', 'IRIDIUM', 'GLOBALSTAR', 'ORBCOMM', 'COSMOS', 'YAOGAN',
      'JILIN', 'SKYSAT', 'WORLDVIEW', 'SENTINEL', 'LANDSAT', 'GOES', 'NOAA', 'METOP'
    ];
    
    for (const constellation of knownConstellations) {
      if (upperName.includes(constellation)) {
        return constellation;
      }
    }
    return undefined;
  };

  // Get unique constellations for filter
  const constellations = useMemo(() => 
    getUniqueConstellations(allSatellites),
    [allSatellites]
  );

  // Filter satellites based on search and constellation
  const filteredSatellites = useMemo(() => {
    let filtered = allSatellites;
    
    if (searchTerm) {
      filtered = filterSatellitesByName(filtered, searchTerm);
    }
    
    if (selectedConstellationFilter) {
      filtered = filtered.filter(sat => 
        sat.name.toUpperCase().includes(selectedConstellationFilter.toUpperCase())
      );
    }
    
    return filtered;
  }, [allSatellites, searchTerm, selectedConstellationFilter]);

  const handleSatelliteToggle = useCallback((satellite: CelestrakSatellite) => {
    const isSelected = selectedIds.has(satellite.noradId);
    
    if (isSelected) {
      onSatellitesSelected(selectedSatellites.filter(s => s.noradId !== satellite.noradId));
    } else {
      onSatellitesSelected([...selectedSatellites, satellite]);
    }
  }, [selectedIds, selectedSatellites, onSatellitesSelected]);

  const handleSelectAll = useCallback(() => {
    // Add all filtered satellites that aren't already selected
    const newSelections = filteredSatellites.filter(
      sat => !selectedIds.has(sat.noradId)
    );
    onSatellitesSelected([...selectedSatellites, ...newSelections]);
  }, [filteredSatellites, selectedIds, selectedSatellites, onSatellitesSelected]);

  const handleClearSelection = useCallback(() => {
    onSatellitesSelected([]);
  }, [onSatellitesSelected]);

  const handleRemoveSelected = useCallback((noradId: string) => {
    onSatellitesSelected(selectedSatellites.filter(s => s.noradId !== noradId));
  }, [selectedSatellites, onSatellitesSelected]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
        <Satellite className="h-10 w-10 text-primary animate-pulse" />
        <div className="w-full max-w-xs space-y-2">
          <Progress value={loadingProgress} className="h-2" />
          <div className="flex justify-between text-xs">
            <span>{loadingStage}</span>
            <span>{loadingProgress}%</span>
          </div>
        </div>
        <p className="text-sm">Loading {loadingProgress > 50 ? 'thousands of' : ''} active satellites...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={loadSatellites} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search satellites by name (e.g., FLOCK, STARLINK, SENTINEL)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Constellation quick filters */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedConstellationFilter === "" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedConstellationFilter("")}
          >
            All
          </Badge>
          {constellations.slice(0, 10).map((constellation) => (
            <Badge
              key={constellation}
              variant={selectedConstellationFilter === constellation ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedConstellationFilter(
                selectedConstellationFilter === constellation ? "" : constellation
              )}
            >
              {constellation}
            </Badge>
          ))}
        </div>
      </div>

      {/* Selected satellites */}
      {selectedSatellites.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Selected: {selectedSatellites.length} satellite(s)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="text-xs"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {selectedSatellites.slice(0, 20).map((sat) => (
              <Badge
                key={sat.noradId}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => handleRemoveSelected(sat.noradId)}
              >
                {sat.name}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {selectedSatellites.length > 20 && (
              <Badge variant="outline">
                +{selectedSatellites.length - 20} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Results info and actions */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredSatellites.length} of {allSatellites.length} satellites
        </span>
        {filteredSatellites.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSelectAll}
            disabled={filteredSatellites.every(sat => selectedIds.has(sat.noradId))}
          >
            <Check className="h-3 w-3 mr-1" />
            Select all {filteredSatellites.length} filtered
          </Button>
        )}
      </div>

      {/* Satellite list - using custom checkbox to avoid Radix issues */}
      <ScrollArea className="h-[300px] border rounded-lg">
        <div className="p-2 space-y-1">
          {filteredSatellites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Satellite className="h-8 w-8 mb-2 opacity-50" />
              <p>No satellites match your search</p>
            </div>
          ) : (
            filteredSatellites.slice(0, 500).map((satellite) => {
              const isSelected = selectedIds.has(satellite.noradId);
              
              return (
                <div
                  key={satellite.noradId}
                  className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => handleSatelliteToggle(satellite)}
                >
                  {/* Custom checkbox to avoid Radix ref issues */}
                  <div 
                    className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-muted-foreground/50'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{satellite.name}</p>
                    <p className="text-xs text-muted-foreground">
                      NORAD ID: {satellite.noradId}
                      {satellite.constellation && (
                        <span className="ml-2">• {satellite.constellation}</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {filteredSatellites.length > 500 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              Showing first 500 results. Refine your search to see more.
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Refresh button */}
      <Button
        variant="outline"
        size="sm"
        onClick={loadSatellites}
        className="w-full"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh TLE Data
      </Button>
    </div>
  );
};

export default CelestrakSatelliteSelector;
