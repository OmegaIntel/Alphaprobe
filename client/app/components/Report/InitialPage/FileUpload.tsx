import { CircleX, FileSpreadsheet, LoaderPinwheel } from "lucide-react";
import { useState, FC } from "react";
import { cn } from "~/lib/utils";
import { uploadDeepResearchFiles } from "../api";
import { useDispatch } from "react-redux";
import { setProjectId } from "../../../store/slices/projectSlice"; // adjust the path as needed
import { UploadFile } from "../api";

type UploadedDOC = {
  file_name:string;
  file_path: string;
}
interface FileUploadProps {
  temp_project_id: string;
  setUploadedDocuments : (files : UploadedDOC[]) => void
}


const FileUpload: FC<FileUploadProps> = (props) => {
  const { temp_project_id, setUploadedDocuments } = props;
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success">("idle");
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
    try {
      const data : UploadFile = {
        files : files,
        project_id: '',
        temp_project_id: temp_project_id
      }
      const response = await uploadDeepResearchFiles(data);
      const projectId = response.project_id;
      console.log("Project ID:", projectId, response.data);
      setUploadedDocuments(response.data)
      // Set the projectId in Redux store
      dispatch(setProjectId(temp_project_id));
      // Clear files after successful upload so we show the success message.
      setFiles([]);
      setUploadStatus("success");
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus("idle");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
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
          className="hidden"
          id="fileInput"
          onChange={handleFileChange}
          multiple
        />
        <label htmlFor="fileInput" className="cursor-pointer">
          <p className="text-sm font-medium text-gray-400">
            Drag & drop files here, or click to select
          </p>
        </label>
      </div>

      {/* Loading state */}
      {uploadStatus === "loading" && (
        <div className="mt-4 flex items-center">
          <span className="animate-spin">
            <LoaderPinwheel className="w-6 h-6 text-gray-600" />
          </span>
          <span className="ml-2 text-sm">Uploading...</span>
        </div>
      )}

      {/* Show file list and submit button if files exist and not loading */}
      {files.length > 0 && uploadStatus !== "loading" && (
        <div className="mt-4 w-full">
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="inline-flex items-center gap-2 p-2 border rounded-lg bg-gray-100 w-fit"
              >
                <div className="w-6 h-6 bg-indigo-200 text-white flex items-center justify-center rounded-full">
                  {false ? (
                    <span className="animate-spin">
                      <LoaderPinwheel className="w-4 h-4 text-gray-600" />
                    </span>
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className="text-sm font-medium">{file.name}</div>
                <button onClick={() => removeFile(index)} className="ml-auto">
                  <CircleX className="w-4 h-4 text-gray-600 hover:text-red-600" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleUpload(files)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Submit Files
          </button>
        </div>
      )}

      {/* Success message */}
      {files.length === 0 && uploadStatus === "success" && (
        <div className="mt-4">
          <p className="text-green-600 text-sm">
            Files uploaded successfully.
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
