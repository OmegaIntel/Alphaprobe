import React, { useState } from 'react';
import { Button } from "~/components/ui/button";
import { Input } from '~/components/ui/input';
import { Card, CardContent } from "~/components/ui/card";
import { 
  Trash2, Edit2, PlusCircle, Loader2, 
  FileText, FileImage, File, FileSpreadsheet,
  Maximize2
} from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import FileUpload from '~/components/UploadFile/UploadFile';
import { API_BASE_URL } from '~/constant';
import { useNavigate } from '@remix-run/react';
import { setData } from '~/store/slices/customReport';
import { useDispatch } from 'react-redux';

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
    id: "financial",
    name: "Financial Analysis",
    headings: [
      "Financial Overview",
      "Revenue Analysis",
      "Cost Structure",
      "Profitability Metrics",
      "Cash Flow Analysis"
    ]
  },
  {
    id: "market",
    name: "Market Analysis",
    headings: [
      "Market Overview",
      "Competitive Landscape",
      "Market Trends",
      "Growth Opportunities",
      "Market Challenges"
    ]
  }
];

const CustomReportSearchForm: React.FC<CustomReportSearchFormProps> = ({ companyQuery }) => {
  const [headings, setHeadings] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [newHeading, setNewHeading] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [deleteIndex, setDeleteIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormVisible, setIsFormVisible] = useState<boolean>(true);

  // Set a constant query value
  const query = "Sample Query";

  const handleTemplateSelect = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setHeadings(selectedTemplate.headings);
    }
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleNewReport = (): void => {
    setHeadings([]);
    setNewHeading("");
    setEditingIndex(-1);
    setIsFormVisible(true);
  };

  const handleAddHeading = (): void => {
    if (newHeading.trim()) {
      if (editingIndex >= 0) {
        const updatedHeadings: string[] = [...headings];
        updatedHeadings[editingIndex] = newHeading;
        setHeadings(updatedHeadings);
        setEditingIndex(-1);
      } else {
        setHeadings([...headings, newHeading]);
      }
      setNewHeading("");
    }
  };

  const handleEdit = (index: number): void => {
    setNewHeading(headings[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index: number): void => {
    setDeleteIndex(index);
    setShowDeleteDialog(true);
  };

  const confirmDelete = (): void => {
    const updatedHeadings: string[] = headings.filter((_, idx) => idx !== deleteIndex);
    setHeadings(updatedHeadings);
    setShowDeleteDialog(false);
  };


  const handleSubmit = async (): Promise<void> => {
    if (!query.trim()) {
      alert("Please enter a search query");
      return;
    }
  
    setIsLoading(true);
  
    const dealId = localStorage.getItem("dealId"); // Retrieve dealId from localStorage
    if (!dealId) {
      alert("No deal ID found. Please upload documents first.");
      setIsLoading(false);
      return;
    }
  
    const formData: FormData = {
      query: companyQuery || "Nike" ,
      headings: headings,
    };
  
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];
  
      if (!token) {
        navigate("/login");
        return;
      }
  
      const response = await fetch(`${API_BASE_URL}/api/generate-report?deal_id=${dealId}`, { // Correct query parameter
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
  
      const data = await response.json();
      console.log('Success:', data);

      // Store the report and deal ID in Redux
      dispatch(setData({ report: data.report, dealId: data.deal_id }));

      setIsFormVisible(false);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex gap-6">
      <Card className="w-1/3 space-y-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Report Templates</h2>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Upload Documents</h2>
              <FileUpload onFilesUploaded={(files) => console.log(files)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form Card */}
      <Card className="w-2/3">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Generate your Custom Report</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              {headings.map((heading, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <span className="flex-1">{heading}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(index)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter heading"
                value={newHeading}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewHeading(e.target.value)}
              />
              <Button 
                onClick={handleAddHeading}
                variant="outline"
              >
                {editingIndex >= 0 ? 'Update' : 'Add'} Heading
              </Button>
            </div>
            {isLoading && (
              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating report please wait while your custom report is being generated for {query}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleSubmit}
              className="w-full"
              disabled={!query.trim() || headings.length === 0 || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the heading.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4">Preview Content</div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomReportSearchForm;
