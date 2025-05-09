'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Skeleton } from '~/components/ui/skeleton';
import { Loader2, Maximize2, FileDown, X, AlertCircle } from 'lucide-react';
import { fetcher } from '~/services/HTTPS';

interface ExcelViewerProps {
  s3Key: string;
  fileName: string;
  title?: string;
}

interface PresignedUrlResponse {
  url: string;
}

/**
 * An Excel file viewer component that primarily offers download functionality
 * with a simplified preview placeholder
 */
const ExcelViewer: React.FC<ExcelViewerProps> = ({
  s3Key,
  fileName,
  title = 'Excel Preview'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    const getFileUrl = async () => {
      if (!s3Key) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get the presigned URL for the file
        const response = await fetcher<PresignedUrlResponse>(
          `/api/financial-models/presigned-url?s3_key=${encodeURIComponent(s3Key)}`
        );
        
        setFileUrl(response.url);
      } catch (err) {
        console.error('Error getting file URL:', err);
        setError('Could not retrieve file. Please try downloading instead.');
      } finally {
        setLoading(false);
      }
    };

    getFileUrl();
  }, [s3Key]);

  const handleDownload = async () => {
    if (!fileUrl) {
      try {
        setDownloading(true);
        // Get a fresh presigned URL for the download
        const response = await fetcher<PresignedUrlResponse>(
          `/api/financial-models/presigned-url?s3_key=${encodeURIComponent(s3Key)}`
        );
        
        // Create a temporary link element to trigger the download
        const link = document.createElement('a');
        link.href = response.url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Download failed:', error);
        alert('Failed to download the file. Please try again.');
      } finally {
        setDownloading(false);
      }
    } else {
      // If we already have the URL, use it directly
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Render a file preview UI that encourages download
  const renderPreview = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="mb-4 text-gray-600">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="64" 
            height="64" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="mx-auto mb-4"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M8 13h8" />
            <path d="M8 17h8" />
            <path d="M8 9h2" />
          </svg>
          <h3 className="text-lg font-medium mb-2">{fileName}</h3>
          <p className="text-sm text-gray-500 mb-4">
            Excel files are best viewed in their native application for full functionality.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload} className="inline-flex items-center">
            <FileDown className="mr-2 h-4 w-4" />
            Download Excel File
          </Button>
        </div>
      </div>
    );
  };

  // If in fullscreen mode, show a larger viewer
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex gap-2">
            <Button onClick={handleDownload} disabled={downloading} variant="outline">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Download Excel
            </Button>
            <Button onClick={() => setFullScreen(false)} variant="ghost">
              <X className="h-4 w-4" />
              Exit Fullscreen
            </Button>
          </div>
        </div>
        
        <div className="flex-grow overflow-auto">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="h-full p-6">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                Try Downloading Instead
              </Button>
            </div>
          ) : (
            renderPreview()
          )}
        </div>
      </div>
    );
  }

  // Normal view inside a card
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-2">
          <Button onClick={handleDownload} disabled={downloading} size="sm">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Download
          </Button>
          <Button onClick={() => setFullScreen(true)} size="sm" variant="ghost">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="w-full h-96 p-4">
            <Skeleton className="w-full h-full" />
          </div>
        ) : error ? (
          <div className="w-full h-96 p-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                Try Downloading Instead
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full" style={{ height: '400px' }}>
            {renderPreview()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelViewer;