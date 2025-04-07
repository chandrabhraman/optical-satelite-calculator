
import React from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { HelpCircle } from "lucide-react";

interface ParameterTooltipProps {
  description: string;
  width?: string;
}

const ParameterTooltip = ({ description, width = "250px" }: ParameterTooltipProps) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help inline-block ml-1" />
      </HoverCardTrigger>
      <HoverCardContent 
        className="bg-popover/80 backdrop-blur-sm text-popover-foreground text-sm p-3"
        style={{ width }} 
        side="top"
        align="center"
      >
        {description}
      </HoverCardContent>
    </HoverCard>
  );
};

export default ParameterTooltip;
