
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GlobalCounterProps {
  localCount: number;
}

const GlobalCounter = ({ localCount }: GlobalCounterProps) => {
  const [globalCount, setGlobalCount] = useState<number>(0);
  
  useEffect(() => {
    // Fetch the current global count
    const fetchGlobalCount = async () => {
      try {
        const response = await fetch('https://api.countapi.xyz/get/satellite-calculator/calculations');
        const data = await response.json();
        if (data.value) {
          setGlobalCount(data.value);
        }
      } catch (error) {
        console.error('Error fetching global count:', error);
      }
    };
    
    fetchGlobalCount();
  }, []);
  
  useEffect(() => {
    // Update the global count when local count increases
    if (localCount > 0) {
      const updateGlobalCount = async () => {
        try {
          const response = await fetch('https://api.countapi.xyz/hit/satellite-calculator/calculations');
          const data = await response.json();
          if (data.value) {
            setGlobalCount(data.value);
          }
        } catch (error) {
          console.error('Error updating global count:', error);
        }
      };
      
      updateGlobalCount();
    }
  }, [localCount]);
  
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
