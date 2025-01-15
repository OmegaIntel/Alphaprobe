import React, { useState } from "react";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import { Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";

interface FileWithProgress {
  file: File;
  progress: number;
  uploaded: boolean;
}

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded }) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileWithProgress[]>([]);

  const handleFileUpload = (files: FileList) => {
    const newFiles = Array.from(files).map((file) => ({
      file,
      progress: 0,
      uploaded: false,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((fileObj, fileIndex) => {
      const interval = setInterval(() => {
        setUploadedFiles((prevFiles) => {
          const updatedFiles = [...prevFiles];
          const currentFileIndex = prevFiles.findIndex(
            (f) => f.file.name === fileObj.file.name // Use file.name here
          );

          if (
            currentFileIndex !== -1 &&
            updatedFiles[currentFileIndex].progress < 100
          ) {
            updatedFiles[currentFileIndex] = {
              ...updatedFiles[currentFileIndex],
              progress: updatedFiles[currentFileIndex].progress + 10,
            };

            if (updatedFiles[currentFileIndex].progress === 100) {
              updatedFiles[currentFileIndex].uploaded = true;
              clearInterval(interval);
            }
          }
          return updatedFiles;
        });
      }, 300);
    });

    onFilesUploaded(newFiles.map((fileObj) => fileObj.file));
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition-colors">
        <Input
          type="file"
          multiple
          className="hidden"
          id="file-upload"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium">Upload Files</span>
            <span className="text-xs text-slate-500">
              Supports PDF, DOC, JPG, and more
            </span>
          </div>
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          {uploadedFiles.map((fileObj, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-2 border rounded"
            >
              <span className="truncate">{fileObj.file.name}</span> {/* Access file.name */}
              <Progress value={fileObj.progress} className="w-full" />
              <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
