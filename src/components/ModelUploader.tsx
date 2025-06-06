import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ModelHelpTooltip from './ModelHelpTooltip';
import { playSound, SOUNDS } from "@/utils/soundEffects";

interface ModelUploaderProps {
  onModelUpload: (file: File) => void;
}

const ModelUploader = ({ onModelUpload }: ModelUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Check if the file is a supported format
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf') || file.name.endsWith('.blend')) {
        setSelectedFile(file);
        onModelUpload(file);
        
        // Play the upload sound effect
        playSound(SOUNDS.upload, 0.4);
        
        // Toast messages are handled in the parent component
      } else {
        toast({
          title: "Unsupported file format",
          description: "Please upload a .glb, .gltf, or .blend 3D model file.",
          variant: "destructive"
        });
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <h3 className="text-sm font-medium">Satellite Model</h3>
        <ModelHelpTooltip />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".glb,.gltf,.blend"
          className="hidden"
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleButtonClick}
          className="flex items-center"
        >
          <Upload className="h-4 w-4 mr-2" />
          {selectedFile ? 'Change Model' : 'Upload Custom Model'}
        </Button>
      </div>
      {selectedFile ? (
        <span className="text-xs text-muted-foreground block truncate max-w-[230px]">
          {selectedFile.name}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground block truncate max-w-[230px]">
          Using default satellite model
        </span>
      )}
      <div className="text-xs p-2 bg-background/40 backdrop-blur-sm rounded-md text-muted-foreground">
        <a 
          href="https://nasa3d.arc.nasa.gov/detail/cubesat-1RU" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-primary hover:underline"
        >
          Try uploading this NASA CubeSat model (.glb supported)
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
        <p className="mt-1">Download and upload locally for best experience</p>
      </div>
    </div>
  );
};

export default ModelUploader;
