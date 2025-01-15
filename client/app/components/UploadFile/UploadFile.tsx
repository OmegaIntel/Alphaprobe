import React, { useState } from 'react';
import { Input } from '~/components/ui/input';
import { Progress } from '~/components/ui/progress';
import { Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { API_BASE_URL } from '~/constant';
import { useNavigate } from '@remix-run/react';

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
  const navigate = useNavigate();

  const handleFileUpload = async (files: FileList) => {
    const validFileTypes = [
      'application/pdf',
      'application/msword',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const newFiles = Array.from(files)
      .filter((file) => validFileTypes.includes(file.type))
      .map((file) => ({
        file,
        progress: 0,
        uploaded: false,
      }));

    if (newFiles.length === 0) {
      alert(
        'No valid files selected. Please upload PDF, DOC, JPG, PNG, or Excel files.'
      );
      return;
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    for (const fileObj of newFiles) {
      const formData = new FormData();
      formData.append('files', fileObj.file);

      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('authToken='))
          ?.split('=')[1];

        if (!token) {
          navigate('/login');
          return;
        }
        const response = await fetch(`${API_BASE_URL}/api/upload-documents`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload file');
        }

        const responseData = await response.json();
        localStorage.setItem('dealId', responseData.deal_id); // Store dealId in localStorage

        setUploadedFiles((prevFiles) => {
          const updatedFiles = [...prevFiles];
          const currentFileIndex = updatedFiles.findIndex(
            (f) => f.file.name === fileObj.file.name
          );
          if (currentFileIndex !== -1) {
            updatedFiles[currentFileIndex].progress = 100;
            updatedFiles[currentFileIndex].uploaded = true;
          }
          return updatedFiles;
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file: ' + fileObj.file.name);
      }
    }

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
          accept=".pdf,.doc,.jpeg,.jpg,.png,.xls,.xlsx"
          className="hidden"
          id="file-upload"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium">Upload Files</span>
            <span className="text-xs text-slate-500">
              Supports PDF, DOC, JPG, PNG, and Excel files
            </span>
          </div>
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-4">
          {uploadedFiles.map((fileObj, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-2 border rounded"
            >
              <span className="truncate flex-1">{fileObj.file.name}</span>
              <Progress value={fileObj.progress} className="w-full" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
                title="Remove file"
              >
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
