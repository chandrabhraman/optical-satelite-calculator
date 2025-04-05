
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

export interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface LocationSearchProps {
  onLocationSelected: (location: Location) => void;
  initialLocation?: Location;
}

// Enhanced location database with more cities and better descriptions
const locationDatabase: Location[] = [
  { name: "New York City, NY, USA", lat: 40.7128, lng: -74.006 },
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
  { name: "Mumbai, India", lat: 19.0760, lng: 72.8777 },
  { name: "Beijing, China", lat: 39.9042, lng: 116.4074 },
  { name: "Cairo, Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Moscow, Russia", lat: 55.7558, lng: 37.6173 },
  { name: "Toronto, Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Mexico City, Mexico", lat: 19.4326, lng: -99.1332 },
  { name: "Berlin, Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Madrid, Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Seoul, South Korea", lat: 37.5665, lng: 126.9780 },
  { name: "Jakarta, Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Nairobi, Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Cape Town, South Africa", lat: -33.9249, lng: 18.4241 },
  { name: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Vienna, Austria", lat: 48.2082, lng: 16.3738 },
  { name: "Honolulu, HI, USA", lat: 21.3069, lng: -157.8583 },
  { name: "Anchorage, AK, USA", lat: 61.2181, lng: -149.9003 },
  { name: "Reykjavik, Iceland", lat: 64.1466, lng: -21.9426 }
];

const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationSelected, initialLocation }) => {
  const [inputValue, setInputValue] = useState(initialLocation?.name || '');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Location[]>([]);
  const commandRef = useRef<HTMLDivElement>(null);
  
  // Update results based on input value
  useEffect(() => {
    if (inputValue.trim() === '') {
      setResults([]);
      return;
    }
    
    const searchResults = locationDatabase.filter(location => 
      location.name.toLowerCase().includes(inputValue.toLowerCase())
    );
    
    setResults(searchResults);
    
    if (searchResults.length > 0 && inputValue.length > 1) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [inputValue]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleLocationClick = (location: Location) => {
    setInputValue(location.name);
    onLocationSelected(location);
    setIsOpen(false);
  };
  
  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          placeholder="Search for a location..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full pr-10"
          onFocus={() => inputValue.trim() !== '' && setIsOpen(true)}
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      </div>
      
      {isOpen && (
        <div ref={commandRef} className="absolute mt-1 w-full z-50">
          <div className="rounded-md border border-border bg-popover shadow-md">
            <div className="max-h-60 overflow-auto p-1">
              {results.length > 0 ? (
                results.map((location, index) => (
                  <div 
                    key={index}
                    className="text-sm px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleLocationClick(location)}
                  >
                    {location.name}
                  </div>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No results found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {initialLocation && inputValue === initialLocation.name && (
        <div className="text-xs text-muted-foreground mt-1">
          Selected: {initialLocation.lat.toFixed(4)}, {initialLocation.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
