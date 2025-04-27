import { FC, useState } from 'react';
import InputComponent from '~/view/Report/InputBar/InputComponent';
import { useForm, Controller } from 'react-hook-form';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Switch from '@radix-ui/react-switch';
import {
  Globe,
  FileSearch,
  GalleryVerticalEnd,
  BarChart4,
  TrendingUp,
  CheckCircle,
  CircleCheck,
  Timer
} from 'lucide-react';
import clsx from 'clsx';
import { ResearchType, researchTypeOptions } from '~/view/Report/reportUtils';
import FileUpload from '~/view/Report/InitialPage/FileUpload';
import OutlineFileUpload from '../duediligence/UploadOutline';
import { v4 as uuidv4 } from 'uuid';
import { getUniqueID } from '~/lib/utils';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '~/store/store';
import { Card, CardContent } from '~/components/ui/card';

// Define market research specific templates
const marketTemplates = [
  {
    id: 'market-analysis',
    category: ['markets', 'research'],
    title: 'Market Analysis',
    description:
      'Comprehensive analysis of market trends, size, and growth potential',
    tags: ['Market Research', 'Industry Analysis', 'Growth Trends'],
  },
  {
    id: 'competitor-analysis',
    category: ['markets', 'research'],
    title: 'Competitor Analysis',
    description:
      'Detailed insights on competitors, their strategies and market position',
    tags: ['Competitive Intelligence', 'Benchmarking', 'Strategic Analysis'],
  },
  {
    id: 'customer-insights',
    category: ['markets', 'research'],
    title: 'Customer Insights',
    description: 'Deep dive into customer behaviors, preferences and segments',
    tags: ['Consumer Research', 'Market Segmentation', 'Behavioral Analysis'],
  },
  {
    id: 'market-entry',
    category: ['markets', 'strategy'],
    title: 'Market Entry Strategy',
    description: 'Strategic approach for entering new markets or territories',
    tags: ['Go-to-Market', 'Expansion Strategy', 'Market Opportunity'],
  },
];

type UploadedFile = {
  file_name: string;
  file_path: string;
};

// Define market-specific report types
export type MarketReportType =
  | 'market-analysis'
  | 'competitor-analysis'
  | 'customer-insights'
  | 'market-entry';

// Form data interface specific to market research
export interface MarketResearchFormData {
  reportType: MarketReportType;
  preferences: {
    web: boolean;
    file: boolean;
    customFormat: boolean; // Separate preference for custom format
  };
  uploadedDocuments: any[];
  uploadedOutlineFiles: any[]; // Add for checklist documents
  promptValue: string;
  temp_project_id: string;
  researchType: ResearchType;
}

type THeroProps = {
  promptValue: string;
  setPromptValue: React.Dispatch<React.SetStateAction<string>>;
  handleDisplayResult: (query: MarketResearchFormData) => void;
};

const MarketResearchInitialPage: FC<THeroProps> = ({
  promptValue,
  setPromptValue,
  handleDisplayResult,
}) => {
  const { activeProjectId } = useSelector((state: RootState) => state.sidebar);
  const tempProjectID = activeProjectId?.temp_project_id || getUniqueID();
  const [uploadedOutlineFiles, setUploadedOutlineFiles] = useState<
    UploadedFile[]
  >([]);

  const { control, handleSubmit, watch, setValue } =
    useForm<MarketResearchFormData>({
      defaultValues: {
        reportType: 'market-analysis',
        preferences: {
          web: true,
          file: false,
          customFormat: false,
        },
        uploadedDocuments: [],
        uploadedOutlineFiles: [],
        promptValue: '',
        temp_project_id: tempProjectID,
        researchType: 'research', // Default research type, but not showing in UI
      },
    });

  const generateReport: { project_id: string } = {
    project_id: '',
  };

  //@ts-ignore
  globalThis.reportGeneration = generateReport;

  const formWatch = watch();

  const onSubmit = (data: MarketResearchFormData) => {
    console.log('Market Research Data:', data.uploadedDocuments);
    let newData = {
      reportType: data.reportType,
      preferences: data.preferences,
      uploadedDocuments: data.uploadedDocuments,
      uploadedOutlineFiles: data.uploadedOutlineFiles,
      researchType: data.researchType,
    };

    localStorage.setItem('marketResearchPreference', JSON.stringify(newData));
  };

  const setUploadedDocuments = (files: UploadedFile[]) => {
    setValue('uploadedDocuments', files);
  };

  const handleUploadedFiles = (files: UploadedFile[]) => {
    setUploadedOutlineFiles(files);
    setValue('uploadedOutlineFiles', files);
  };

  // Example market research questions suggestions
  const marketResearchSuggestions = [
    "What's the current market size and growth rate for electric vehicles in Europe?",
    'Who are the top 5 competitors in the cloud computing industry and what are their market shares?',
    'What are the key consumer trends in sustainable fashion for 2025?',
    "What's the TAM, SAM, and SOM for telemedicine services in North America?",
  ];

  const handleClickSuggestion = (value: string) => {
    setPromptValue(value);
  };

  return (
    <div className="flex flex-col items-center py-8 md:py-12 lg:pt-8 lg:pb-16 overflow-x-auto">
      <div className="w-full">
        <h1 className="text-xl font-semibold mb-2">
          AI Market Research Generator
        </h1>
        <p className="text-sm text-gray-500">
          Generate comprehensive market insights, competitive analysis, and
          strategic recommendations with AI assistance
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 w-full">
        <div className="p-4 border-none rounded-lg bg-gray-50 space-y-4">
          {/* Web Search */}
          <Controller
            name="preferences.web"
            control={control}
            render={({ field }) => (
              <label className="flex items-center justify-between py-2 border rounded-lg px-4">
                <div className="flex items-center space-x-4">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">Web Search</span>
                </div>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="w-4 h-4 !text-indigo-600 !bg-indigo-600 accent-indigo-600"
                />
              </label>
            )}
          />

          {/* File Upload */}
          <Controller
            name="preferences.file"
            control={control}
            render={({ field }) => (
              <div className="border rounded-lg py-2 px-4">
                <label className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FileSearch className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Upload Market Data
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4 scheme-dark !bg-indigo-600 accent-indigo-600"
                  />
                </label>
                {field.value && (
                  <div className="mt-3">
                    <FileUpload
                      temp_project_id={formWatch.temp_project_id}
                      setUploadedDocuments={setUploadedDocuments}
                    />
                  </div>
                )}
              </div>
            )}
          />

          {/* Custom Format Upload - Separate section */}
          <Controller
            name="preferences.customFormat"
            control={control}
            render={({ field }) => (
              <div className="border rounded-lg py-2 px-4">
                <label className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-500 rounded-full p-1 flex items-center justify-center">
                      <FileSearch className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium">
                      Your Custom Format
                    </span>
                    <span className="text-xs text-gray-500">
                      PowerPoint, Word, Excel, etc.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4 scheme-dark !bg-indigo-600 accent-indigo-600"
                  />
                </label>
                {field.value && (
                  <div className="mt-3">
                    <OutlineFileUpload
                      temp_project_id={tempProjectID}
                      setUploadedOutlineFiles={handleUploadedFiles}
                    />

                    {uploadedOutlineFiles.length > 0 && (
                      <div className="mt-3 text-sm text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {uploadedOutlineFiles.length} file(s) uploaded
                        successfully
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          />

          <Controller
            name="researchType"
            control={control}
            render={({ field }) => (
              <RadioGroup.Root
                className="flex gap-4"
                {...field}
                onValueChange={(value) => field.onChange(value as ResearchType)}
              >
                {researchTypeOptions.map((option) => (
                  <label
                    key={option.id}
                    className={clsx(
                      'cursor-pointer border p-[2px] w-36 rounded-full flex',
                      formWatch.researchType === option.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-white'
                    )}
                  >
                    <RadioGroup.Item className="hidden" value={option.value} />
                    <CircleCheck
                      className={`w-8 h-8 ${
                        formWatch.researchType === option.value
                          ? 'text-green-300'
                          : 'text-gray-300'
                      }`}
                    />
                    <div className="flex flex-col ml-1">
                      <h3 className="text-xs font-semibold">{option.label}</h3>
                      <p className="flex items-center text-xs text-gray-400">
                        <Timer className="w-3 h-3 mr-1" />
                        {option.timeDurations}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup.Root>
            )}
          />
        </div>

        {/* Example queries section */}
        <div className="w-full mb-6">
          <h3 className="text-sm font-medium mb-2">Example queries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {marketResearchSuggestions.map((suggestion, index) => (
              <Card
                key={index}
                onClick={() => handleClickSuggestion(suggestion)}
                className="cursor-pointer border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-colors"
              >
                <CardContent className="p-3">
                  <div className="flex items-start">
                    <TrendingUp className="w-4 h-4 text-gray-500 mt-1 mr-2 flex-shrink-0" />
                    <p className="text-xs text-gray-600">{suggestion}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="w-full pb-8 md:pb-10">
          <InputComponent
            promptValue={promptValue}
            setPromptValue={(prompt: string) => {
              setPromptValue(prompt);
              setValue('promptValue', prompt);
            }}
            handleSubmit={(prompt: string) => {
              setValue('promptValue', prompt);
              handleDisplayResult({
                ...formWatch,
                promptValue: prompt,
                uploadedOutlineFiles: uploadedOutlineFiles,
              });

              // Save preferences to localStorage for future use
              let newData = {
                reportType: formWatch.reportType,
                preferences: formWatch.preferences,
                uploadedDocuments: formWatch.uploadedDocuments,
                uploadedOutlineFiles: uploadedOutlineFiles,
                researchType: formWatch.researchType,
              };
              localStorage.setItem(
                'marketResearchPreference',
                JSON.stringify(newData)
              );
            }}
          />
        </div>
      </form>
    </div>
  );
};

export default MarketResearchInitialPage;
