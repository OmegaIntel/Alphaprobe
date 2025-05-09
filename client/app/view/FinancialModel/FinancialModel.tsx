'use client';

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from '@remix-run/react';
import { fetcher } from '~/services/HTTPS';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { Button } from '~/components/ui/button';
import { UploadFinancialModel } from '~/components/UploadFile/UploadFinancialModel';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

interface FinancialModel {
  id: string;
  company_name: string;
  created_at: string;
  model_group_id: string;
  is_initial_upload: boolean;
}

// Define the expected API response structure
interface FinancialModelsResponse {
  models: FinancialModel[];
}

export default function FinancialModelListPage() {
  const [models, setModels] = useState<FinancialModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const navigate = useNavigate();
  const isFirstRender = useRef(true);

  const loadModels = async () => {
    if (!isFirstRender.current && loading) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetcher<FinancialModelsResponse>('/api/financial-models/list');
      
      let modelsList: FinancialModel[] = [];
      
      if (response.data && Array.isArray(response.data.models)) {
        modelsList = response.data.models;
      }
      else if (response && Array.isArray(response.models)) {
        modelsList = response.models;
      }
      else if (response.data && Array.isArray(response.data)) {
        modelsList = response.data;
      }
      else if (Array.isArray(response)) {
        modelsList = response;
      }
      else {
        setError("Failed to parse models from server response");
        setModels([]);
        return;
      }
      
      const validModels = modelsList.filter(model => {
        const isValid = 
          model && 
          typeof model.id === 'string' && 
          typeof model.company_name === 'string';
        
        return isValid;
      });
      
      setModels(validModels);
      
      if (validModels.length === 0 && modelsList.length > 0) {
        setError("Models were found but they have an invalid format");
      }
    } catch (err) {
      setError("Failed to load models. Please try again later.");
      setModels([]);
    } finally {
      setLoading(false);
      isFirstRender.current = false;
    }
  };

  useEffect(() => {
    loadModels();
    return () => {
      // Cleanup function
    };
  }, []);

  const handleCardClick = (model: FinancialModel) => {
    if (!model.model_group_id) {
      return;
    }
    
    if (typeof model.model_group_id === 'string' && model.model_group_id.length === 36) {
      const url = `/fn/${model.model_group_id}`;
      navigate(url);
    }
  };

  const toggleUploadModal = () => {
    setShowUpload(prev => !prev);
  };

  const handleUploadSuccess = () => {
    loadModels();
    setShowUpload(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Financial Models</h1>
        <Button 
          onClick={toggleUploadModal}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Upload Model
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-red-300 bg-red-50 text-red-700 rounded-md">
          {error}
          <button 
            className="ml-4 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded"
            onClick={() => {
              if (!loading) loadModels();
            }}
          >
            Retry
          </button>
        </div>
      )}

      {showUpload && (
        <div className="mb-6 p-4 border rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Upload a New Financial Model</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleUploadModal}
            >
              Cancel
            </Button>
          </div>
          <UploadFinancialModel onSuccess={handleUploadSuccess} />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : models.length === 0 ? (
        <div className="max-w-2xl mx-auto mt-6">
          <p className="mb-4 text-muted-foreground text-center">
            You haven't uploaded any financial models yet. Upload your first model to get started.
          </p>
          <UploadFinancialModel onSuccess={loadModels} />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {models.length} financial model{models.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {models.map((model) => (
              <Card
                key={model.id}
                className="cursor-pointer hover:shadow-lg transition"
                onClick={() => handleCardClick(model)}
              >
                <CardHeader>
                  <CardTitle>{model.company_name || 'Unnamed Model'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Uploaded on {
                      model.created_at 
                        ? format(new Date(model.created_at), 'dd MMM yyyy')
                        : 'Unknown date'
                    }
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    ID: {model.id ? model.id.substring(0, 8) + '...' : 'N/A'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}