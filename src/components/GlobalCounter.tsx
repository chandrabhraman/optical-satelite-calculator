
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GlobalCounterProps {
  localCount: number;
}

const GlobalCounter = ({ localCount }: GlobalCounterProps) => {
  const [globalCount, setGlobalCount] = useState<number>(() => {
    // Try to get the count from localStorage first
    const savedCount = localStorage.getItem('satellite-calculator-count');
    return savedCount ? parseInt(savedCount, 10) : 0;
  });
  const [previousLocalCount, setPreviousLocalCount] = useState<number>(0);
  
  // Fetch the global count on component mount
  useEffect(() => {
    const fetchGlobalCount = async () => {
      try {
        const response = await fetch('https://api.countapi.xyz/get/satellite-calculator/calculations');
        const data = await response.json();
        if (data && data.value !== undefined) {
          const fetchedCount = data.value;
          setGlobalCount(fetchedCount);
          localStorage.setItem('satellite-calculator-count', fetchedCount.toString());
        }
      } catch (error) {
        console.error('Error fetching global count:', error);
        // Don't override with fallback if we have localStorage value
      }
    };
    
    fetchGlobalCount();
  }, []);
  
  // Update the global count when local count increases
  useEffect(() => {
    if (localCount > previousLocalCount) {
      setPreviousLocalCount(localCount);
      
      const updateGlobalCount = async () => {
        try {
          const response = await fetch('https://api.countapi.xyz/hit/satellite-calculator/calculations');
          const data = await response.json();
          if (data && data.value !== undefined) {
            const newCount = data.value;
            setGlobalCount(newCount);
            localStorage.setItem('satellite-calculator-count', newCount.toString());
          } else {
            // If API doesn't return proper value, increment locally
            const newCount = globalCount + 1;
            setGlobalCount(newCount);
            localStorage.setItem('satellite-calculator-count', newCount.toString());
          }
        } catch (error) {
          console.error('Error updating global count:', error);
          // If API fails, increment locally
          const newCount = globalCount + 1;
          setGlobalCount(newCount);
          localStorage.setItem('satellite-calculator-count', newCount.toString());
        }
      };
      
      updateGlobalCount();
    }
  }, [localCount, previousLocalCount, globalCount]);
  
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
