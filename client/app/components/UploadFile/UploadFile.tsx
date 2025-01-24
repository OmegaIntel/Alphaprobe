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
  name: string;
  progress: number;
  uploaded: boolean;
}

interface Document {
  id: string;
  name: string;
  description: string | null;
}

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded }) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileWithProgress[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const dealId = useSelector((state: RootState) => state.deals?.dealId);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchDocuments = async (currentDealId: string) => {
    try {
      setLoading(true);
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('authToken='))
        ?.split('=')[1];

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/documents/${currentDealId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail === "No documents found for this deal ID.") {
          setHasDocuments(false);
      setIsDeleting(null);
          setDocuments([]);
          return;
        }
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents);
      setHasDocuments(true);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setHasDocuments(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setIsDeleting(documentId);
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('authToken='))
        ?.split('=')[1];

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Remove the document from the local state
      setDocuments((prevDocuments) => 
        prevDocuments.filter((doc) => doc.id !== documentId)
      );

      // Update hasDocuments if there are no documents left
      if (documents.length === 1) {
        setHasDocuments(false);
      }

    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document. Please try again.');
    }
  };

  useEffect(() => {
    if (dealId) {
      fetchDocuments(dealId);
    }
  }, [dealId]);

  const handleFileUpload = async (files: FileList) => {
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

    const newFiles = Array.from(files).filter((file) =>
      validFileTypes.includes(file.type)
    );

    if (newFiles.length === 0) {
      alert(
        'No valid files selected. Please upload PDF, DOC, JPG, PNG, or Excel files.'
      );
      return;
    }

    setUploadedFiles((prev) => [
      ...prev,
      ...newFiles.map((file) => ({
        file,
        progress: 0,
        uploaded: false,
        name: file.name,
      })),
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
            file.file.name === fileObj.name
              ? { ...file, progress: 100, uploaded: true }
              : file
          )
        );
        
        fetchDocuments(currentDealId);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Error uploading file: ${fileObj.name}`);
      }
    }

    onFilesUploaded(newFiles);
  };

  return (
    <div>
      {warning && (
        <div className="mb-4 p-2 bg-yellow-200 text-yellow-800 rounded">
          {warning}
        </div>
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

      {uploadedFiles.map((fileObj, index) => (
        <div key={index} className="flex items-center gap-4 p-2 border rounded mt-2">
          <span className="truncate flex-1">{fileObj.name}</span>
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

      {loading ? (
        <div className="mt-4 text-center">Loading documents...</div>
      ) : (
        hasDocuments && documents.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-medium">Uploaded Documents</h3>
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 p-2 border rounded">
                <span className="truncate flex-1">{doc.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteDocument(doc.id)}
                  title="Remove document"
                  disabled={isDeleting === doc.id}
                >
                  {isDeleting === doc.id ? (
                    <span className="animate-spin h-4 w-4">◌</span>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default FileUpload;