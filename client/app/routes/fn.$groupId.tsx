'use client';

import { useEffect, useState } from 'react';
import { useParams } from '@remix-run/react';
import { fetcher } from '~/services/HTTPS';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { format } from 'date-fns';
import { UploadFinancialModel } from '~/components/UploadFile/UploadFinancialModel';
import { FileDown, Loader2 } from 'lucide-react';

interface FinancialModel {
  id: string;
  company_name: string;
  created_at: string;
  original_file_s3: string;
  updated_model_s3: string | null;
  is_initial_upload: boolean;
  note?: string;
  updates_applied?: number;
}

interface PresignedUrlResponse {
  url: string;
}

export default function FinancialModelGroupPage() {
  const { groupId } = useParams();
  const [models, setModels] = useState<FinancialModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState<Record<string, boolean>>({});

  const loadGroupModels = async () => {
    console.log('[🔄] Fetching models for groupId:', groupId);
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher<{ models: FinancialModel[] }>(
        `/api/financial-models/group/${groupId}`
      );
      console.log('[✅] API Response:', res);
      setModels(res.models);
    } catch (err) {
      console.error('[❌] Error fetching models:', err);
      setError('Failed to load group models');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) loadGroupModels();
  }, [groupId]);

  const getPresignedUrl = async (s3Key: string): Promise<string> => {
    try {
      setDownloadingFiles(prev => ({ ...prev, [s3Key]: true }));
      const response = await fetcher<PresignedUrlResponse>(
        `/api/financial-models/presigned-url?s3_key=${encodeURIComponent(s3Key)}`
      );
      return response.url;
    } catch (err) {
      console.error('[❌] Error getting presigned URL:', err);
      throw new Error('Failed to generate download link');
    } finally {
      setDownloadingFiles(prev => ({ ...prev, [s3Key]: false }));
    }
  };

  const handleDownload = async (s3Key: string, fileName: string) => {
    try {
      const presignedUrl = await getPresignedUrl(s3Key);
      
      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = presignedUrl;
      
      // Extract the filename from the S3 key or use a default
      const defaultFileName = s3Key.split('/').pop() || fileName;
      link.download = defaultFileName;
      
      // Append to the document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the file. Please try again.');
    }
  };

  const initialModel = models.find((m) => m.is_initial_upload);
  const updateModels = models.filter((m) => !m.is_initial_upload).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="p-6 space-y-6">
      {/* 🔝 Page Header with Upload Button on Right */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Financial Model History</h1>
        {groupId && (
          <Button onClick={() => setShowUploadForm((prev) => !prev)}>
            {showUploadForm ? 'Cancel Upload' : '➕ Upload New Update'}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          {initialModel && (
            <Card>
              <CardHeader>
                <CardTitle>
                  📌 Reference File: {initialModel.company_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Uploaded on{' '}
                      {format(new Date(initialModel.created_at), 'dd MMM yyyy')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ID: {initialModel.id.substring(0, 8)}...
                    </p>
                    {initialModel.note && (
                      <p className="text-sm mt-2 italic">"{initialModel.note}"</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDownload(initialModel.original_file_s3, `${initialModel.company_name}_template.xlsx`)}
                    disabled={downloadingFiles[initialModel.original_file_s3]}
                  >
                    {downloadingFiles[initialModel.original_file_s3] ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="mr-2 h-4 w-4" />
                    )}
                    Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {updateModels.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mt-6">
                📈 Updates Timeline
              </h2>
              {updateModels.map((model, idx) => (
                <Card key={model.id} className="border-l-4 border-blue-500">
                  <CardHeader>
                    <CardTitle>
                      Update #{updateModels.length - idx} 
                      {model.updates_applied && model.updates_applied > 0 && (
                        <span className="text-sm text-blue-500 ml-2">
                          ({model.updates_applied} cells updated)
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Uploaded on{' '}
                          {format(new Date(model.created_at), 'dd MMM yyyy')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          ID: {model.id.substring(0, 8)}...
                        </p>
                        {model.note && (
                          <p className="text-sm mt-2 italic">"{model.note}"</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {model.updated_model_s3 && (
                          <Button
                            size="sm"
                            onClick={() => handleDownload(model.updated_model_s3!, `${initialModel?.company_name}_updated.xlsx`)}
                            disabled={downloadingFiles[model.updated_model_s3]}
                          >
                            {downloadingFiles[model.updated_model_s3] ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <FileDown className="mr-2 h-4 w-4" />
                            )}
                            Download Updated Model
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(model.original_file_s3, `${initialModel?.company_name}_update_data.xlsx`)}
                          disabled={downloadingFiles[model.original_file_s3]}
                        >
                          {downloadingFiles[model.original_file_s3] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <FileDown className="mr-2 h-4 w-4" />
                          )}
                          Download Source Data
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {showUploadForm && groupId && (
            <div className="mt-8">
              <UploadFinancialModel
                referenceModelId={groupId}
                onSuccess={() => {
                  loadGroupModels();
                  setShowUploadForm(false); // auto-hide after success
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}