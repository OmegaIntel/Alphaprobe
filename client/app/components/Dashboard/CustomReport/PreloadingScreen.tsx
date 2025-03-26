import React, { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent } from '~/components/ui/card';
import { Trash2, Edit2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '~/components/ui/alert-dialog';
import FileUpload from '~/components/UploadFile/UploadFile';
import { API_BASE_URL } from '~/constant';
import { useNavigate } from '@remix-run/react';
import { setData } from '~/store/slices/customReport';
import { useDispatch } from 'react-redux';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { toast } from '~/hooks/use-toast';



interface FormData {
  query: string;
  headings: string[];
}

interface Template {
  id: string;
  name: string;
  headings: string[];
}

interface CustomReportSearchFormProps {
  companyQuery?: string;
}

const templates: Template[] = [
  {
    id: 'financial',
    name: 'Financial Analysis',
    headings: ['Financial Overview', 'Revenue Analysis', 'Cost Structure', 'Profitability Metrics', 'Cash Flow Analysis'],
  },
  {
    id: 'market',
    name: 'Market Analysis',
    headings: ['Market Overview', 'Competitive Landscape', 'Market Trends', 'Growth Opportunities', 'Market Challenges'],
  },
];

const CustomReportSearchForm: React.FC<CustomReportSearchFormProps> = ({ companyQuery }) => {
  const [headings, setHeadings] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [newHeading, setNewHeading] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [deleteIndex, setDeleteIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);
  const [dealFormData, setDealFormData] = useState({ name: '', overview: '', industry: '' });

  const query = 'Sample Query';
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleTemplateSelect = (templateId: string) => {
    const selectedTemplate = templates.find((t) => t.id === templateId);
    if (selectedTemplate) setHeadings(selectedTemplate.headings);
  };

  const handleNewReport = () => {
    setHeadings([]);
    setNewHeading('');
    setEditingIndex(-1);
  };

  const handleAddHeading = () => {
    if (newHeading.trim()) {
      const updatedHeadings = [...headings];
      if (editingIndex >= 0) updatedHeadings[editingIndex] = newHeading;
      else updatedHeadings.push(newHeading);
      setHeadings(updatedHeadings);
      setNewHeading('');
      setEditingIndex(-1);
    }
  };

  const handleDelete = (index: number) => {
    setDeleteIndex(index);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    setHeadings(headings.filter((_, idx) => idx !== deleteIndex));
    setShowDeleteDialog(false);
  };

  const handleSubmit = async () => {
    if (!query.trim()) return alert('Please enter a search query');

    setIsLoading(true);
    const dealId = localStorage.getItem('dealId');
    if (!dealId) {
      alert('No deal ID found. Please upload documents first.');
      setIsLoading(false);
      return;
    }

    const formData: FormData = { query: companyQuery || 'Nike', headings };

    try {
      const token = document.cookie.split('; ').find((row) => row.startsWith('authToken='))?.split('=')[1];
      if (!token) return navigate('/login');

      const response = await fetch(`${API_BASE_URL}/api/generate-report?deal_id=${dealId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      dispatch(setData({ report: data.report, dealId: data.deal_id }));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealFormData.name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Company name is required' });
      return;
    }

    setIsCreatingDeal(true);
    try {
      const token = document.cookie.split('; ').find((row) => row.startsWith('authToken='))?.split('=')[1];
      if (!token) return navigate('/login');

      const payload = {
        name: dealFormData.name,
        overview: dealFormData.overview || 'No overview',
        industry: dealFormData.industry || 'General',
        start_date: new Date().toISOString().split('T')[0],
        due_date: null,
        progress: '0%',
        investment_thesis: 'Initial investment thesis content. Please update.',
      };

      const response = await fetch(`${API_BASE_URL}/api/deals/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create deal');
      }

      const newDealData = await response.json();
      localStorage.setItem('dealId', newDealData.id);
      navigate(`/duediligence/${newDealData.name}`);
      setIsDealDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsCreatingDeal(false);
    }
  };

  if (!companyQuery) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">No Deal Selected</h2>
          <p className="mb-4">You haven't selected a deal or created a new deal yet. Please create a deal before generating a custom report.</p>
          <Button onClick={() => setIsDealDialogOpen(true)}>Create New Deal</Button>
        </CardContent>

        <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input id="name" placeholder="Enter company name" value={dealFormData.name} onChange={(e) => setDealFormData((prev) => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" placeholder="Enter industry" value={dealFormData.industry} onChange={(e) => setDealFormData((prev) => ({ ...prev, industry: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overview">Company Overview</Label>
                <Textarea id="overview" placeholder="Enter company overview" rows={4} value={dealFormData.overview} onChange={(e) => setDealFormData((prev) => ({ ...prev, overview: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full" disabled={isCreatingDeal}>
                {isCreatingDeal ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Deal...</> : 'Create Deal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  return (
    <div className="flex gap-6">
      <Card className="w-1/3 space-y-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Report Templates</h2>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger>
                <SelectContent>{templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Upload Documents</h2>
              <FileUpload onFilesUploaded={(files) => console.log(files)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-2/3 min-w-[500px] max-w-[500px]">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Generate your Custom Report</h2>
          <div className="flex flex-col">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                {headings.map((heading, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1">{heading}</span>
                    {/* <Button variant="ghost" size="icon" onClick={() => handleEdit(index)}><Edit2 className="h-4 w-4" /></Button> */}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto space-y-4">
              <div className="flex gap-2">
                <Input type="text" placeholder="Enter heading" value={newHeading} onChange={(e) => setNewHeading(e.target.value)} />
                <Button onClick={handleAddHeading} variant="outline">{editingIndex >= 0 ? 'Update' : 'Add'} Heading</Button>
              </div>
              {isLoading && (
                <Alert>
                  <AlertDescription className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating report please wait while your custom report is being generated for {companyQuery}
                  </AlertDescription>
                </Alert>
              )}
              <Button onClick={handleSubmit} className="w-full" disabled={!query.trim() || headings.length === 0 || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Submit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the heading.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomReportSearchForm;