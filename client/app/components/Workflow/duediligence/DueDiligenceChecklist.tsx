import { useRef, useState, useEffect, useCallback, FC } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Upload, Globe, FileText, MoveDown } from 'lucide-react';
import { getUniqueID } from '~/lib/utils';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '~/store/store';
import OutlineFileUpload from './UploadOutline';
import InputComponent from '~/components/Report/InputBar/InputComponent';
import { useLocation, useParams } from '@remix-run/react';
import { setProject } from '~/store/slices/sideBar';
import Loader from '~/components/Report/Loader';

// Import necessary components for results display
import ReportBlock from '~/components/Report/ReportBlock';

type UploadedOutlineFile = {
  file_name: string;
  file_path: string;
  bucket: string;
};

// Define any other types we need to match the API structure
type OutlineFileUploadProps = {
  temp_project_id: string;
  setUploadedOutlineFiles: (files: UploadedOutlineFile[]) => void;
};

// Import the correct types from reportUtils
import { 
  ConversationData,
  ResearchType,
  Citation
} from '~/components/Report/reportUtils';
import { createGetDocumentReport, updateGetDocumentReport } from '~/components/Report/api';

const ChecklistSelector: FC = () => {
  const location = useLocation();
  const { id = null } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  
  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [connectToDataRoom, setConnectToDataRoom] = useState<boolean>(false);
  const [uploadAdditionalDocs, setUploadAdditionalDocs] = useState<boolean>(false);
  const [uploadedOutlineFiles, setUploadedOutlineFiles] = useState<UploadedOutlineFile[]>([]);
  const [requirements, setRequirements] = useState<string>('');
  
  // States for report display
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationData[]>([]);
  const [isStopped, setIsStopped] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const mainContentRef = useRef<HTMLDivElement>(null);
  const { activeProjectId } = useSelector((state: RootState) => state.sidebar);
  const tempProjectID = activeProjectId?.temp_project_id || getUniqueID();

  // Check for saved report data on component mount
  useEffect(() => {
    setTimeout(() => {
      if (id) {
        setLoading(true);
        setShowResult(true);
        const getSaved = async () => {
          let res = null;
          try {
            // Replace with your actual API call
            res = await fetch(`/api/reports/${id}`).then(r => r.json());
          } catch (err) {
            console.error('error-------', err);
            setLoading(false);
          } finally {
            if (res?.length) {
              const conv = res.map((item: any) => ({
                id: item.id,
                query: item.query,
                res: item.response,
                res_id: item.id,
                updated_at: item.updated_at,
                sections: item.sections,
                researchType: 'research' as ResearchType // Explicitly type as ResearchType as default
              }));
              setConversation([...conv]);
              setLoading(false);
            }
          }
        };
        getSaved();
      } else {
        setShowResult(false);
        setLoading(false);
      }
    }, 1000);
  }, [location, id]);

  const handleUploadedFiles = (files: UploadedOutlineFile[]) => {
    setUploadedOutlineFiles(files);
    console.log('Uploaded outline files:', files);
  };

  // Handle form submission and API call
  const handleSubmitRequirements = async (value: string) => {
    try {
      //@ts-ignore
      const projectID = globalThis.reportGeneration?.project_id || id;

      setShowResult(true);
      setLoading(true);
      setRequirements('');
      
      // Add the new question to conversation
      setConversation((prevOrder) => [
        ...prevOrder,
        {
          query: value,
          res: "",
          res_id: `${prevOrder.length}`,
          sections: [],
          researchType: 'research' as ResearchType // Explicitly type as ResearchType
        },
      ]);

      let response: { report: string; sections?: any[]; project: any, researchType: ResearchType } | null = null;

      // Make the API call based on if we have a project ID or not
      if (!projectID) {
        response = await createGetDocumentReport({
          promptValue: value,
          web_search: true,
          file_search: uploadAdditionalDocs,
          templateId: selectedTemplate,
          temp_project_id: tempProjectID,
          uploaded_files: uploadedOutlineFiles,
          researchType: 'research' as ResearchType
        });
        
        if (response?.project) {
          dispatch(setProject(response.project));
          const generateReport: { project_id: string } = {
            project_id: response.project.id,
          };
          //@ts-ignore
          globalThis.reportGeneration = generateReport;
        }
      } else {
        const project_id = id || projectID;
        response = await updateGetDocumentReport({
          promptValue: value,
          web_search: true,
          file_search: uploadAdditionalDocs,
          templateId: selectedTemplate,
          temp_project_id: tempProjectID,
          uploaded_files: uploadedOutlineFiles || [],
          projectId: project_id,
          researchType: 'research' as ResearchType
        });
      }

      // Update the conversation with the response
      if (response) {
        setConversation((prev: ConversationData[]) => {
          let lastCon = [...prev].pop();
          return prev.map((resData) => {
            if (resData.res_id === lastCon?.res_id) {
              return { 
                ...resData, 
                res: `${response.report}`, 
                sections: response.sections || [] 
              };
            }
            return resData;
          });
        });
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('error-----------', error);
    }
  };

  // Scroll handling logic
  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY + window.innerHeight;
    const nearBottom = scrollPosition >= document.documentElement.scrollHeight - 100;
    const isPageScrollable = document.documentElement.scrollHeight > window.innerHeight;
    setShowScrollButton(isPageScrollable && !nearBottom);
  }, []);

  useEffect(() => {
    const mainContentElement = mainContentRef.current;
    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });

    if (mainContentElement) {
      resizeObserver.observe(mainContentElement);
    }

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      if (mainContentElement) {
        resizeObserver.unobserve(mainContentElement);
      }
      resizeObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  // Render the form view or the results view
  return (
    <div className="flex h-[calc(100vh-80px)] justify-center">
      <div className="h-full max-w-[800px] space-y-2">
        {!showResult && (
          <div className="p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-4 gap-2">
              <div className="p-2 bg-gray-100 rounded-md">
                <FileText className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Choose A Due Diligence Checklist
                </h2>
                <p className="text-sm text-gray-500">
                  Choose the right template below for your report type
                </p>
              </div>
            </div>

            {/* Template Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card
                className={`cursor-pointer border hover:border-blue-500 transition-colors ${
                  selectedTemplate === 'standard'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                onClick={() => setSelectedTemplate('standard')}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium mb-1">Omega Pre-Populated Checklist</h3>
                  <p className="text-sm text-gray-500">
                    Use our industry standard diligence checklist
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer border hover:border-blue-500 transition-colors ${
                  selectedTemplate === 'custom'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                onClick={() => setSelectedTemplate('custom')}
              >
                <CardContent className="flex flex-col p-4">
                  <h3 className="font-medium mb-1">Your Custom Checklist</h3>
                  <p className="text-sm text-gray-500">Upload your custom template</p>
                  <Upload className="w-5 h-5 text-gray-500 mx-auto mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Optional Options */}
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
                  onCheckedChange={() =>
                    setUploadAdditionalDocs(!uploadAdditionalDocs)
                  }
                />
              </div>
            </div>

            {/* File Upload Section */}
            {uploadAdditionalDocs && (
              <div className="mb-4">
                <OutlineFileUpload
                  temp_project_id={tempProjectID}
                  setUploadedOutlineFiles={handleUploadedFiles}
                />

                {uploadedOutlineFiles.length > 0 && (
                  <div className="mt-2 text-sm text-green-600">
                    {uploadedOutlineFiles.length} file(s) uploaded successfully
                  </div>
                )}
              </div>
            )}

            {/* Prompt Input Section */}
            <form
              className="pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (requirements) {
                  handleSubmitRequirements(requirements);
                }
              }}
            >
              <InputComponent
                promptValue={requirements}
                setPromptValue={setRequirements}
                handleSubmit={(value) => {
                  if (value) {
                    handleSubmitRequirements(value);
                  }
                }}
              />
            </form>
          </div>
        )}

        {showResult && (
          <div
            ref={mainContentRef}
            className="flex h-[88%] w-full grow flex-col items-center justify-between overflow-x-auto"
          >
            <div className="container w-full space-y-2">
              <div className="container space-y-2 task-components">
                <ReportBlock
                  orderedData={conversation}
                />
              </div>
            </div>
          </div>
        )}
        
        {showResult && (
          <div className="sticky bottom-0 flex items-center w-full mr-4">
            {loading ? (
              <Loader />
            ) : (
              <InputComponent
                promptValue={requirements}
                setPromptValue={setRequirements}
                handleSubmit={(value: string) => {
                  if (value) {
                    handleSubmitRequirements(value);
                  }
                }}
                disabled={loading}
                isStopped={isStopped}
              />
            )}
          </div>
        )}
      </div>
      
      {showScrollButton && showResult && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-4 right-8 flex items-center justify-center w-12 h-12 text-gray-600 bg-gray-200 rounded-full hover:bg-gray-400 transform hover:scale-105 transition-all duration-200 shadow-lg z-50"
        >
          <MoveDown className="w-12 h-12" />
        </button>
      )}
    </div>
  );
};

export default ChecklistSelector;