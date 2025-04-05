
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface LocationSearchProps {
  onLocationSelected: (location: Location) => void;
  initialLocation?: Location;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationSelected, initialLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const resultsContainerRef = useRef<HTMLDivElement | null>(null);

  // Sample location data - in a real app, this would come from an API
  const sampleLocations: Location[] = [
    { name: "New York, NY, USA", lat: 40.7128, lng: -74.006 },
    { name: "Los Angeles, CA, USA", lat: 34.0522, lng: -118.2437 },
    { name: "Chicago, IL, USA", lat: 41.8781, lng: -87.6298 },
    { name: "Houston, TX, USA", lat: 29.7604, lng: -95.3698 },
    { name: "Phoenix, AZ, USA", lat: 33.4484, lng: -112.0740 },
    { name: "Philadelphia, PA, USA", lat: 39.9526, lng: -75.1652 },
    { name: "San Antonio, TX, USA", lat: 29.4241, lng: -98.4936 },
    { name: "San Diego, CA, USA", lat: 32.7157, lng: -117.1611 },
    { name: "Dallas, TX, USA", lat: 32.7767, lng: -96.7970 },
    { name: "San Francisco, CA, USA", lat: 37.7749, lng: -122.4194 },
    { name: "London, UK", lat: 51.5074, lng: -0.1278 },
    { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
    { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
    { name: "Sydney, Australia", lat: -33.8688, lng: 151.2093 },
    { name: "Rio de Janeiro, Brazil", lat: -22.9068, lng: -43.1729 },
  ];

  // Handle search
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call with timeout
    const timer = setTimeout(() => {
      const filtered = sampleLocations.filter(location => 
        location.name.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setIsLoading(false);
      setIsOpen(filtered.length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    setQuery(location.name);
    setIsOpen(false);
    onLocationSelected(location);
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsContainerRef.current && !resultsContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          placeholder="Search for a location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pr-10"
          onFocus={() => query && setIsOpen(true)}
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      </div>
      
      {isOpen && (
        <Card className="absolute mt-1 w-full z-50" ref={resultsContainerRef}>
          <CardContent className="p-0">
            <div className="max-h-60 overflow-auto">
              {isLoading ? (
                <div className="p-2 text-center text-muted-foreground">Loading...</div>
              ) : results.length > 0 ? (
                <div className="py-1">
                  {results.map((location, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-left px-3 rounded-none"
                      onClick={() => handleSelectLocation(location)}
                    >
                      {location.name}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-center text-muted-foreground">No results found</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedLocation && (
        <div className="text-xs text-muted-foreground mt-1">
          Selected: {selectedLocation.name} ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
