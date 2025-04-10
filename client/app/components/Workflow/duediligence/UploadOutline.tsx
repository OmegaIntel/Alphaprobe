import { FC, useState } from "react";
import { useDispatch } from "react-redux";
import { setProjectId } from "../../../store/slices/projectSlice"; // adjust the path as needed
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { X, FileSpreadsheet, Upload, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { uploadOutlineFiles } from "~/components/Report/api";

type UploadOutlineFile = {
  files: File[];
  temp_project_id: string;
};

type UploadedOutlineFile = {
  file_name: string;
  file_path: string;
  bucket: string;
};

interface OutlineFileUploadProps {
  temp_project_id: string;
  setUploadedOutlineFiles: (files: UploadedOutlineFile[]) => void;
}

const OutlineFileUpload: FC<OutlineFileUploadProps> = (props) => {
  const { temp_project_id, setUploadedOutlineFiles } = props;
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const dispatch = useDispatch();

  // Helper to add new files from a FileList to our state.
  const handleFiles = (newFiles: FileList) => {
    const fileArray = Array.from(newFiles);
    setFiles((prevFiles) => [...prevFiles, ...fileArray]);
    // If new files are added after a successful upload, reset the status.
    if (uploadStatus === "success") {
      setUploadStatus("idle");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFiles(event.target.files);
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
    if (event.dataTransfer.files) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  async function handleUpload(files: File[]) {
    setUploadStatus("loading");
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 300);
    
    try {
      const data = {
        files: files,
        temp_project_id: temp_project_id
      };
      
      const response = await uploadOutlineFiles(data);
      console.log("Upload response:", response);
      
      // If response is an array, use it directly, otherwise check for a data property
      const uploadedFiles = Array.isArray(response) 
        ? response 
        : (response.data || []);
      
      setUploadedOutlineFiles(uploadedFiles);
      
      // Set the projectId in Redux store
      dispatch(setProjectId(temp_project_id));
      
      // Set progress to 100% when complete
      setUploadProgress(100);
      
      // Clear files after successful upload so we show the success message.
      setFiles([]);
      setUploadStatus("success");
      
      // Clear interval if it's still running
      clearInterval(progressInterval);
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus("error");
      clearInterval(progressInterval);
    }
  }

  return (
    <div className="w-full space-y-4">
      <Card 
        className={cn(
          "w-full border border-dashed p-6 text-center cursor-pointer transition-all",
          dragActive ? "border-primary bg-primary/5" : "border-muted"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          // Only trigger if clicking on the card itself, not on its children
          if (e.currentTarget === e.target) {
            document.getElementById('outlineFileInput')?.click();
          }
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drag & drop outline files here, or click to select
          </p>
          <Input
            type="file"
            className="hidden"
            id="outlineFileInput"
            onChange={handleFileChange}
            multiple
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => document.getElementById('outlineFileInput')?.click()}
          >
            Browse Files
          </Button>
        </div>
      </Card>

      {/* Loading state with progress */}
      {uploadStatus === "loading" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm">Uploading outline files...</span>
          </div>
          <Progress value={uploadProgress} className="h-2 w-full" />
        </div>
      )}

      {/* Error state */}
      {uploadStatus === "error" && (
        <Alert variant="destructive">
          <AlertDescription>
            There was an error uploading your files. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {files.length === 0 && uploadStatus === "success" && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>
            Outline files uploaded successfully.
          </AlertDescription>
        </Alert>
      )}

      {/* Show file list and submit button if files exist and not loading */}
      {files.length > 0 && uploadStatus !== "loading" && (
        <div className="space-y-4">
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 rounded-md bg-muted/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button 
            onClick={() => handleUpload(files)}
            className="w-full"
          >
            Upload Outline Files
          </Button>
        </div>
      )}
    </div>
  );
};

export default OutlineFileUpload;