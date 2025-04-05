
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

const ModelHelpTooltip = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>Upload .glb, .gltf, or .blend 3D models for more realistic visualization.</p>
          <p className="mt-1">You can find models on sites like:</p>
          <ul className="list-disc ml-4 mt-1">
            <li>Sketchfab</li>
            <li>Google Poly</li>
            <li>TurboSquid</li>
            <li>Blender Community</li>
          </ul>
          <p className="mt-1 text-xs text-muted-foreground">
            For best results, use models designed for real-time rendering.
          </p>
          <p className="mt-1 text-xs text-amber-500">
            Note: .blend files require conversion before rendering.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ModelHelpTooltip;
