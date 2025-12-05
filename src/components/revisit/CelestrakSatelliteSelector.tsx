import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Satellite, X, RefreshCw, Check } from "lucide-react";
import {
  fetchActiveSatellites,
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
    
    try {
      const satellites = await fetchActiveSatellites();
      setAllSatellites(satellites);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch satellites");
    } finally {
      setIsLoading(false);
    }
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
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading active satellites from Celestrak...</p>
        <p className="text-sm">This may take a moment</p>
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
        {filteredSatellites.length > 0 && filteredSatellites.length <= 100 && (
          <Button variant="link" size="sm" onClick={handleSelectAll}>
            Select all {filteredSatellites.length}
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
