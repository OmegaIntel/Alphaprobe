import { useState, FC } from "react";
import { cn } from "~/lib/utils";
interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

const FileUpload : FC<FileUploadProps> = ({ onFileUpload }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      onFileUpload(selectedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      onFileUpload(droppedFile);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* ✅ Remove <Slot> and wrap everything inside a div */}
      <div
        className={cn(
          "w-full border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="fileInput"
          onChange={handleFileChange}
        />
        <label htmlFor="fileInput" className="cursor-pointer">
          <p className="text-sm font-medium text-gray-400">Drag & drop a file here, or click to select</p>
        </label>
      </div>
    </div>
  );
};

export default FileUpload;
