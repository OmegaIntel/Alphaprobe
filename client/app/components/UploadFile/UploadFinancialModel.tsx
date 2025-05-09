import { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '@radix-ui/react-switch';
import { fileFetcher } from '~/services/HTTPS';

interface UploadFinancialModelProps {
  referenceModelId?: string;
  onSuccess?: (data: any) => void;
}

export const UploadFinancialModel: React.FC<UploadFinancialModelProps> = ({
  referenceModelId,
  onSuccess,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [note, setNote] = useState('');
  const [isInitialUpload, setIsInitialUpload] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (referenceModelId) {
      setIsInitialUpload(false); // force update mode if ref ID is provided
    }
  }, [referenceModelId]);

  const handleSubmit = async () => {
    if (!file || !companyName) return alert('Company name and file are required');
    if (!isInitialUpload && !referenceModelId) return alert('Reference model ID required for updates');

    const formData = new FormData();
    formData.append('company_name', companyName);
    formData.append('is_initial_upload', String(isInitialUpload));
    formData.append('file', file);
    if (!isInitialUpload && referenceModelId) {
      formData.append('reference_model_id', referenceModelId);
    }
    if (note) formData.append('note', note);

    try {
      setLoading(true);
      const res = await fileFetcher('/api/financial-models/upload', {
        method: 'POST',
        body: formData,
      });
      onSuccess?.(res.data);
    } catch (err: any) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-xl w-full max-w-xl">
      <div className="space-y-1">
        <Label>Company Name</Label>
        <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label>Note (optional)</Label>
        <Textarea value={note} onChange={e => setNote(e.target.value)} />
      </div>

     
      {!referenceModelId && (
        <div className="flex items-center gap-2">
          <Switch
            checked={isInitialUpload}
            onCheckedChange={(checked) => setIsInitialUpload(checked)}
            id="initial-upload"
          />
          <Label htmlFor="initial-upload">Initial Upload</Label>
        </div>
      )}

      <div className="space-y-1">
        <Label>Upload File (.xlsx)</Label>
        <Input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files?.[0] || null)} />
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? 'Uploading...' : 'Upload'}
      </Button>
    </div>
  );
};
