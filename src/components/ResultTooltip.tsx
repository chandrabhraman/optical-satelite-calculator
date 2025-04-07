
import React from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { HelpCircle } from "lucide-react";

interface ResultTooltipProps {
  description: string;
  width?: string;
}

const ResultTooltip = ({ description, width = "280px" }: ResultTooltipProps) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help inline-block ml-1 align-text-top" />
      </HoverCardTrigger>
      <HoverCardContent 
        className="bg-popover/80 backdrop-blur-sm text-popover-foreground text-sm p-3"
        style={{ width }} 
        side="left"
        align="start"
      >
        {description}
      </HoverCardContent>
    </HoverCard>
  );
};

export default ResultTooltip;
