
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GlobalCounterProps {
  localCount: number;
}

const GlobalCounter = ({ localCount }: GlobalCounterProps) => {
  const [globalCount, setGlobalCount] = useState<number>(0);
  const [previousLocalCount, setPreviousLocalCount] = useState<number>(0);
  
  useEffect(() => {
    // Fetch the current global count on component mount
    const fetchGlobalCount = async () => {
      try {
        // Use a different API that allows CORS
        const response = await fetch('https://api.countapi.xyz/get/satellite-calculator/calculations');
        const data = await response.json();
        if (data && data.value !== undefined) {
          setGlobalCount(data.value);
        }
      } catch (error) {
        console.error('Error fetching global count:', error);
        // Set a fallback value if API fails
        setGlobalCount(localCount > 0 ? localCount : 100);
      }
    };
    
    fetchGlobalCount();
  }, []);
  
  useEffect(() => {
    // Update the global count when local count increases
    if (localCount > previousLocalCount) {
      setPreviousLocalCount(localCount);
      
      const updateGlobalCount = async () => {
        try {
          // Use a different API that allows CORS
          const response = await fetch('https://api.countapi.xyz/hit/satellite-calculator/calculations');
          const data = await response.json();
          if (data && data.value !== undefined) {
            setGlobalCount(data.value);
          } else {
            // If the API doesn't return a proper value, increment locally
            setGlobalCount(prev => prev + 1);
          }
        } catch (error) {
          console.error('Error updating global count:', error);
          // If API fails, increment locally
          setGlobalCount(prev => prev + 1);
        }
      };
      
      updateGlobalCount();
    }
  }, [localCount, previousLocalCount]);
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1">
          <Calculator className="h-4 w-4 text-primary" />
          <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20 transition-colors">
            {globalCount.toLocaleString()} calculations
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Total calculations by all users</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default GlobalCounter;
