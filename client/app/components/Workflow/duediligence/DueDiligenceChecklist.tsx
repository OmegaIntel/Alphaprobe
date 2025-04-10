import React, { useState } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Textarea } from '~/components/ui/textarea';
import { Button } from '~/components/ui/button';
import { Upload, Globe, FileText, Send } from 'lucide-react';

interface ChecklistSelectorProps {
  onSelectTemplate: (template: string) => void;
  onSubmitRequirements: (requirements: string) => void;
}

const ChecklistSelector: React.FC<ChecklistSelectorProps> = ({ 
  onSelectTemplate,
  onSubmitRequirements 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<string>('');
  const [connectToDataRoom, setConnectToDataRoom] = useState<boolean>(false);
  const [uploadAdditionalDocs, setUploadAdditionalDocs] = useState<boolean>(false);

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    onSelectTemplate(template);
  };

  const handleRequirementsSubmit = () => {
    onSubmitRequirements(requirements);
  };

  return (
    <div className="p-6  rounded-lg shadow-sm">
      <div className="flex items-center mb-4 gap-2">
        <div className="p-2 bg-gray-100 rounded-md">
          <FileText className="w-5 h-5 text-gray-700" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-900">Choose A Due Diligence Checklist</h2>
          <p className="text-sm text-gray-500">Choose the right template below for your report type</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card 
          className={`cursor-pointer border hover:border-blue-500 transition-colors ${
            selectedTemplate === 'standard' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
          onClick={() => handleTemplateSelect('standard')}
        >
          <CardContent className="p-4">
            <h3 className="font-medium mb-1">Omega Pre-Populated Checklist</h3>
            <p className="text-sm text-gray-500">Use our industry standard diligence checklist</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer border hover:border-blue-500 transition-colors ${
            selectedTemplate === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
          onClick={() => handleTemplateSelect('custom')}
        >
          <CardContent className="flex flex-col p-4">
            <h3 className="font-medium mb-1">Your Custom Checklist</h3>
            <p className="text-sm text-gray-500">Upload your custom template</p>
            <Upload className="w-5 h-5 text-gray-500 mx-auto mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 mb-4">
        <div 
          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
          onClick={() => setConnectToDataRoom(!connectToDataRoom)}
        >
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-700" />
            <span>Connect to a Third-Party Data Room</span>
          </div>
          <Checkbox 
            checked={connectToDataRoom} 
            onCheckedChange={() => setConnectToDataRoom(!connectToDataRoom)}
          />
        </div>

        <div 
          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
          onClick={() => setUploadAdditionalDocs(!uploadAdditionalDocs)}
        >
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-gray-700" />
            <span>Upload Additional Documents</span>
          </div>
          <Checkbox 
            checked={uploadAdditionalDocs} 
            onCheckedChange={() => setUploadAdditionalDocs(!uploadAdditionalDocs)}
          />
        </div>
      </div>

      <div className="relative">
        <Textarea 
          className="pr-12 resize-none"
          placeholder="Provide additional report requirements..."
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
        />
        <Button 
          size="sm" 
          className="absolute right-2 bottom-2"
          onClick={handleRequirementsSubmit}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChecklistSelector;