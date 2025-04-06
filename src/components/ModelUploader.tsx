
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ModelHelpTooltip from './ModelHelpTooltip';

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
        
        // Toast messages are now handled in the parent component
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
    </div>
  );
};

export default ModelUploader;
