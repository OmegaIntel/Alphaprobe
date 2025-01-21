import React, { useEffect, useState } from 'react';
import { Input } from '~/components/ui/input';
import { Progress } from '~/components/ui/progress';
import { Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { API_BASE_URL } from '~/constant';
import { useNavigate } from '@remix-run/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '~/store/store';
import { setDealId } from '~/store/slices/dealSlice';

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
  const [warning, setWarning] = useState<string | null>(null);
  const dealId = useSelector((state: RootState) => state.deals?.dealId);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if dealId is not in Redux state
    if (!dealId) {
      // Try to get it from localStorage
      const storedDealId = localStorage.getItem('dealId');
      if (storedDealId) {
        // If found in localStorage, update Redux state
        dispatch(setDealId(storedDealId));
        setWarning(null);
      } else {
        setWarning('Deal ID is missing. Please select or create a deal first.');
      }
    } else {
      // If dealId exists in Redux, ensure it's also in localStorage
      localStorage.setItem('dealId', dealId);
      setWarning(null);
    }
  }, [dealId, dispatch]);

  const handleFileUpload = async (files: FileList) => {
    // First check for dealId before proceeding
    const currentDealId = dealId || localStorage.getItem('dealId');
    
    if (!currentDealId) {
      setWarning('Deal ID is missing. Please select or create a deal first.');
      return;
    }

    const validFileTypes = [
      'application/pdf',
      'application/msword',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    const newFiles = Array.from(files).filter((file) => validFileTypes.includes(file.type));

    if (newFiles.length === 0) {
      alert('No valid files selected. Please upload PDF, DOC, JPG, PNG, or Excel files.');
      return;
    }

    setUploadedFiles((prev) => [
      ...prev,
      ...newFiles.map((file) => ({ file, progress: 0, uploaded: false })),
    ]);

    for (const fileObj of newFiles) {
      const formData = new FormData();
      formData.append('deal_id', currentDealId);
      formData.append('name', fileObj.name);
      formData.append('files', fileObj);

      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('authToken='))
          ?.split('=')[1];
        
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload file');
        }

        const responseData = await response.json();
        console.log('File uploaded successfully:', responseData);

        setUploadedFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.file.name === fileObj.name ? { ...file, progress: 100, uploaded: true } : file
          )
        );
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Error uploading file: ${fileObj.name}`);
      }
    }

    onFilesUploaded(newFiles);
  };

  // Rest of the component remains the same...
  return (
    <div>
      {warning && (
        <div className="mb-4 p-2 bg-yellow-200 text-yellow-800 rounded">{warning}</div>
      )}
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
                onClick={() =>
                  setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
                }
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