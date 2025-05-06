import { useRef, useState, useEffect, useCallback, FC } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useResearchHistory } from './hooks/useResearchHistory';
import ReportBlock from './ReportBlock';
import InputComponent from './InputBar/InputComponent';
import { MoveDown } from 'lucide-react';
import Loader from './Loader';
import InitialPage from './InitialPage';
import {
  InitialFormData,
  ConversationData,
  Citation,
  ResearchType,
} from './reportUtils';
import {
  createGetDocumentReport,
  updateGetDocumentReport,
  getReports,
} from './api';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { useLocation, useParams } from '@remix-run/react';
import { setProject } from '~/store/slices/sideBar';
import Query from './Query';

// 🔧 Helper: map route to workflow
const getWorkflowFromPath = (path: string): string => {
  if (path.includes('/due-diligence')) return 'due_diligence';
  if (path.includes('/market-research')) return 'market_research';
  if (path.includes('/valuation')) return 'valuation';
  if (path.includes('/company-house')) return 'sourcing';
  return 'general';
};

const ReportPage: FC = () => {
  const location = useLocation();
  const { id = null } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const [promptValue, setPromptValue] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationData[]>([]);
  const [isStopped, setIsStopped] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const { activeProjectId } = useSelector((state: RootState) => state.sidebar);

  // ✅ Derive workflow from path
  const workflow = getWorkflowFromPath(location.pathname).toUpperCase() as
    | 'DUE_DILIGENCE'
    | 'MARKET_RESEARCH'
    | 'SOURCING'
    | 'VALUATION';

  useEffect(() => {
    setTimeout(() => {
      if (id) {
        setLoading(true);
        setShowResult(true);
        const getSaved = async () => {
          let res = null;
          try {
            res = await getReports(id);
          } catch (err) {
            console.error('error-------', err);
            setLoading(false);
          } finally {
            if (res?.length) {
              const conv = res.map((item:any) => ({
                id: item.id,
                query: item.query,
                res: item.response,
                res_id: item.id,
                updated_at: item.updated_at,
                sections: item.sections,
                researchType: item.research,
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

  const handleDisplayResult = async (newQuestion: InitialFormData) => {
    try {
      //@ts-ignore
      const projectID = globalThis.reportGeneration.project_id || id;

      setShowResult(true);
      setLoading(true);
      setPromptValue('');
      setConversation((prevOrder) => [
        ...prevOrder,
        {
          query: newQuestion.promptValue,
          res: '',
          res_id: `${prevOrder.length}`,
          sections: [],
          researchType: newQuestion.researchType,
        },
      ]);

      let response: {
        report: string;
        sections?: Citation[];
        project: any;
        researchType: ResearchType;
      } | null = null;

      if (!projectID) {
        response = await createGetDocumentReport({
          promptValue: newQuestion.promptValue,
          web_search: newQuestion.preferences.web,
          file_search: newQuestion.preferences.file,
          templateId: newQuestion.reportType,
          temp_project_id: newQuestion.temp_project_id,
          uploaded_files: newQuestion.uploadedDocuments,
          researchType: newQuestion.researchType,
          workflow, 
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
          promptValue: newQuestion.promptValue,
          web_search: newQuestion.preferences.web,
          file_search: newQuestion.preferences.file,
          templateId: newQuestion.reportType,
          temp_project_id: newQuestion.temp_project_id,
          uploaded_files: newQuestion.uploadedDocuments || [],
          projectId: project_id,
          researchType: newQuestion.researchType,
          workflow, 
        });
      }

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

  return (
    <div className="flex h-[calc(100vh-80px)] justify-center">
      <div className="h-full max-w-[800px] space-y-2">
        {!showResult && (
          <InitialPage
            promptValue={promptValue}
            setPromptValue={setPromptValue}
            handleDisplayResult={(query: InitialFormData) => {
              if (query.promptValue) {
                handleDisplayResult(query);
              }
            }}
          />
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
                promptValue={promptValue}
                setPromptValue={setPromptValue}
                handleSubmit={(value: string) => {
                  const pref = JSON.parse(
                    localStorage.getItem('promtPreferance') || ''
                  );
                  if (value) {
                    handleDisplayResult({
                      ...pref,
                      promptValue: value,
                      temp_project_id: activeProjectId?.temp_project_id,
                    });
                  }
                }}
                disabled={loading}
                isStopped={isStopped}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;
