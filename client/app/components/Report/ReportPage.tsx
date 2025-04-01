import { useRef, useState, useEffect, useCallback, FC } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useResearchHistory } from './hooks/useResearchHistory';
import ReportBlock from './ReportBlock';
import InputComponent from './InputBar/InputComponent';
import { MoveDown } from 'lucide-react';
import Loader from './Loader';
import InitialPage from './InitialPage';
import { InitialFormData } from './reportUtils';
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

type ConversationData = {
  id?: string;
  query: string;
  res: string;
  res_id?: string;
  updated_at?: string;
};

const ReportPage: FC = () => {
  // console.log(projectId)
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

  // const { socket, initializeWebSocket } = useWebSocket(
  //   setLoading,
  //   setConversation
  // );

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
              const conv = res.map((item) => {
                return {
                  id: item.id,
                  query: item.query,
                  res: item.response,
                  res_id: item.id,
                  updated_at: item.updated_at,
                };
              });
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
  }, [location]);

  console.log('report--------------------------', conversation);

  const handleDisplayResult = async (newQuestion: InitialFormData) => {
    try {
      console.log('report--------------------------');
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
          res_id: `${conversation.length}`,
        },
      ]);

      let response: { report: string; project: any } | null = null;

      if (!projectID) {
        response = await createGetDocumentReport({
          promptValue: newQuestion.promptValue,
          web_search: newQuestion.preferences.web,
          file_search: newQuestion.preferences.file,
          templateId: newQuestion.reportType,
          temp_project_id: newQuestion.temp_project_id,
          uploaded_files: newQuestion.uploadedDocuments,
        });
        if (response?.project) {
          dispatch(setProject(response?.project));

          const generateReport: { project_id: string } = {
            project_id: response?.project?.id,
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
        });
      }

      console.log('res----------------', response);

      if (response) {
        setConversation((prev: ConversationData[]) => {
          let lastCon = [...prev].pop();
          // console.log('lastCon', lastCon, prev)
          return prev.map((resData) => {
            if (resData.res_id === lastCon?.res_id) {
              return { ...resData, res: `${response.report}` };
            }
            return resData;
          });
        });
      }
      setLoading(false);
      // setTimeout(()=>{
      //   initializeWebSocket(newQuestion);
      // },500)
    } catch (error) {
      setLoading(false);
      console.error('error-----------', error);
    }
  };

  /**
   * Handles stopping the current research
   * - Closes WebSocket connection
   * - Stops loading state
   * - Marks research as stopped
   * - Preserves current results
   */

  /**
   * Handles starting a new research
   * - Clears all previous research data and states
   * - Resets UI to initial state
   * - Closes any existing WebSocket connections
   */

  // Save completed research to history

  /**
   * Processes ordered data into logs for display
   * Updates whenever orderedData changes
   */

  const handleScroll = useCallback(() => {
    // Calculate if we're near bottom (within 100px)
    const scrollPosition = window.scrollY + window.innerHeight;
    const nearBottom =
      scrollPosition >= document.documentElement.scrollHeight - 100;

    // Show button if we're not near bottom and page is scrollable
    const isPageScrollable =
      document.documentElement.scrollHeight > window.innerHeight;
    setShowScrollButton(isPageScrollable && !nearBottom);
  }, []);

  // Add ResizeObserver to watch for content changes
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
      <div
        //ref={mainContentRef}
        className="h-full max-w-[800px] space-y-2"
      >
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
                <ReportBlock
                  orderedData={conversation}
                  // response={answer}
                  // allLogs={allLogs}
                  // chatBoxSettings={chatBoxSettings}
                  // handleClickSuggestion={handleClickSuggestion}
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
                promptValue={promptValue}
                setPromptValue={setPromptValue}
                handleSubmit={(value: string) => {
                  const pref = JSON.parse(
                    localStorage.getItem('promtPreferance') || ''
                  );
                  if (value) {
                    handleDisplayResult({ ...pref, promptValue: value, temp_project_id: activeProjectId?.temp_project_id });
                  }
                }}
                // handleSecondary={}
                disabled={loading}
                // reset={reset}
                isStopped={isStopped}
              />
            )}
          </div>
        )}
      </div>
      {/* {showScrollButton && showResult && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-4 right-8 flex items-center justify-center w-12 h-12 text-gray-600 bg-gray-200 rounded-full hover:bg-gray-400 transform hover:scale-105 transition-all duration-200 shadow-lg z-50"
        >
          <MoveDown className="w-12 h-12" />
        </button>
      )} */}
    </div>
  );
};

export default ReportPage;
