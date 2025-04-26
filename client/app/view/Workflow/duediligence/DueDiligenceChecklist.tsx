import { useRef, useState, useEffect, useCallback, FC } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import {
  Upload,
  Globe,
  FileText,
  MoveDown,
  FileSearch,
  CheckCircle,
} from 'lucide-react';
import { getUniqueID } from '~/lib/utils';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '~/store/store';
import OutlineFileUpload from './UploadOutline';
import FileUpload from '~/view/Report/InitialPage/FileUpload';
import InputComponent from '~/view/Report/InputBar/InputComponent';
import { useLocation, useParams } from '@remix-run/react';
import { setProject } from '~/store/slices/sideBar';
import Loader from '~/view/Report/Loader';

// Import necessary components for results display
import ReportBlock from '~/view/Report/ReportBlock';

type UploadedOutlineFile = {
  file_name: string;
  file_path: string;
  bucket: string;
};

type UploadedDocument = {
  file_name: string;
  file_path: string;
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
  Citation,
} from '~/view/Report/reportUtils';
import {
  createGetDocumentReport,
  updateGetDocumentReport,
} from '~/view/Report/api';

const ChecklistSelector: FC = () => {
  const location = useLocation();
  const { id = null } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [connectToDataRoom, setConnectToDataRoom] = useState<boolean>(false);
  const [uploadAdditionalDocs, setUploadAdditionalDocs] =
    useState<boolean>(false);
  const [uploadSupportingFiles, setUploadSupportingFiles] =
    useState<boolean>(false); // New state for second upload option
  const [uploadedOutlineFiles, setUploadedOutlineFiles] = useState<
    UploadedOutlineFile[]
  >([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >([]); // New state for second upload type
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
            res = await fetch(`/api/reports/${id}`).then((r) => r.json());
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
                researchType: 'research' as ResearchType, // Explicitly type as ResearchType as default
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

  const handleUploadedDocuments = (files: UploadedDocument[]) => {
    setUploadedDocuments(files);
    console.log('Uploaded supporting documents:', files);
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
          res: '',
          res_id: `${prevOrder.length}`,
          sections: [],
          researchType: 'research' as ResearchType, // Explicitly type as ResearchType
        },
      ]);

      let response: {
        report: string;
        sections?: any[];
        project: any;
        researchType: ResearchType;
      } | null = null;

      // Make the API call based on if we have a project ID or not
      if (!projectID) {
        response = await createGetDocumentReport({
          promptValue: value,
          web_search: true,
          file_search: uploadAdditionalDocs || uploadSupportingFiles,
          templateId: selectedTemplate,
          temp_project_id: tempProjectID,
          uploaded_files: [
            ...uploadedOutlineFiles,
            ...uploadedDocuments.map((doc) => ({
              file_name: doc.file_name,
              file_path: doc.file_path,
              bucket: 'default', // Assuming a default bucket for supporting files
            })),
          ],
          researchType: 'research' as ResearchType,
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
          file_search: uploadAdditionalDocs || uploadSupportingFiles,
          templateId: selectedTemplate,
          temp_project_id: tempProjectID,
          uploaded_files: [
            ...uploadedOutlineFiles,
            ...uploadedDocuments.map((doc) => ({
              file_name: doc.file_name,
              file_path: doc.file_path,
              bucket: 'default', // Assuming a default bucket for supporting files
            })),
          ],
          projectId: project_id,
          researchType: 'research' as ResearchType,
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
                sections: response.sections || [],
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
    const nearBottom =
      scrollPosition >= document.documentElement.scrollHeight - 100;
    const isPageScrollable =
      document.documentElement.scrollHeight > window.innerHeight;
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
                {/* <p className="text-sm text-gray-500">
                  Choose between an industry standard checklist or your own custom checklist
                </p> */}
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
                  <h3 className="font-medium mb-1">
                    Omega Pre-Populated Checklist
                  </h3>
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
                  <p className="text-sm text-gray-500">
                    Upload your custom template
                  </p>
                  <Upload className="w-5 h-5 text-gray-500 mx-auto mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Optional Options */}
            <div className="space-y-4 mb-4">
              <h3 className="text-sm font-medium">Additional Options</h3>

              <div className="space-y-3">
                {/* First upload option - Outline Files */}
                <div
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setUploadAdditionalDocs(!uploadAdditionalDocs)}
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-gray-700" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Upload Checklist Documents</span>
                      <span className="text-xs text-gray-500">Upload templates to guide the structure and format of your report</span>
                    </div>
                  </div>
                  <Checkbox
                    checked={uploadAdditionalDocs}
                    onCheckedChange={() => setUploadAdditionalDocs(!uploadAdditionalDocs)}
                  />
                </div>

                {/* Second upload option - Supporting Files */}
                <div
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setUploadSupportingFiles(!uploadSupportingFiles)}
                >
                  <div className="flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-gray-700" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Upload Supporting Documents</span>
                      <span className="text-xs text-gray-500">Upload data files containing market information for AI to analyze and extract insights</span>
                    </div>
                  </div>
                  <Checkbox
                    checked={uploadSupportingFiles}
                    onCheckedChange={() => setUploadSupportingFiles(!uploadSupportingFiles)}
                  />
                </div>

                {/* Keep the data room option as a separate toggle */}
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
              </div>
            </div>

            {/* File Upload Sections */}
            <div className="space-y-6 mb-4">
              {/* First File Upload Section - Outline Files */}
              {uploadAdditionalDocs && (
                <Card className="border border-blue-100 bg-blue-50/30">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-3">
                      Upload Checklist Documents
                    </h4>
                    <OutlineFileUpload
                      temp_project_id={tempProjectID}
                      setUploadedOutlineFiles={handleUploadedFiles}
                    />

                    {uploadedOutlineFiles.length > 0 && (
                      <div className="mt-3 text-sm text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {uploadedOutlineFiles.length} checklist file(s) uploaded
                        successfully
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Second File Upload Section - Supporting Files */}
              {uploadSupportingFiles && (
                <Card className="border border-blue-100 bg-blue-50/30">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-3">
                      Upload Supporting Documents
                    </h4>
                    <FileUpload
                      temp_project_id={tempProjectID}
                      setUploadedDocuments={handleUploadedDocuments}
                    />

                    {uploadedDocuments.length > 0 && (
                      <div className="mt-3 text-sm text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {uploadedDocuments.length} supporting file(s) uploaded
                        successfully
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

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
                <ReportBlock orderedData={conversation} />
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