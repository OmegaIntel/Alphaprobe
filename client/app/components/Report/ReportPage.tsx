import { useRef, useState, useEffect, useCallback, FC } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useResearchHistory } from './hooks/useResearchHistory';
import {
  Data,
  ChatBoxSettings,
  QuestionData,
  preprocessOrderedData,
} from './reportUtils';
import ReportBlock from './ReportBlock';
import InputComponent from './InputBar/InputComponent';
import { MoveDown } from 'lucide-react';
import Loader from './Loader';
import InitialPage from './InitialPage';
import { InitialFormData } from './reportUtils';
import { getDocumentReport } from './api';
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

type ConversationData = {
  query: string;
  res: string;
  res_id?: string;
};

const ReportPage: FC = () => {
  const projectId = useSelector((state: RootState) => state.project.projectId);
  console.log(projectId)
  const [promptValue, setPromptValue] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationData[]>([]);
  const [isStopped, setIsStopped] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const { history, saveResearch, getResearchById, deleteResearch } =
    useResearchHistory();

  const { socket, initializeWebSocket } = useWebSocket(
    setLoading,
    setConversation
  );

  console.log('report--------------------------', conversation);

  const handleDisplayResult = async (newQuestion: InitialFormData) => {
    try {
      console.log('report--------------------------');
      setShowResult(true);
      setLoading(true);
      // setQuestion(newQuestion.promptValue);
      setPromptValue('');
      setConversation((prevOrder) => [
        ...prevOrder,
        {
          query: newQuestion.promptValue,
          res: '',
          res_id: `${conversation.length}`,
        },
      ]);
      // setOrderedData((prevOrder) => [
      //   ...prevOrder,
      //   { type: 'question', content: newQuestion.promptValue },
      // ]);
      const response: string = await getDocumentReport({
        promptValue: newQuestion.promptValue,
        web_search: newQuestion.preferences.web,
        file_search: newQuestion.preferences.file,
        templateId: newQuestion.reportType,
        projectId: projectId ? projectId : "none",
      });

      console.log('res----------------', response);

      if (response) {
        setConversation((prev: ConversationData[]) => {
          let lastCon = [...prev].pop();
          // console.log('lastCon', lastCon, prev)
          return prev.map((resData) => {
            if (resData.res_id === lastCon?.res_id) {
              return { ...resData, res: `${response}` };
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
    <div className="flex min-h-screen justify-center">
      <div
        //ref={mainContentRef}
        className="min-h-[100vh] max-w-[800px]"
      >
        {!showResult && (
          <InitialPage
            promptValue={promptValue}
            setPromptValue={setPromptValue}
            handleDisplayResult={(query) => {
              if (query.promptValue) {
                handleDisplayResult(query);
              }
            }}
          />
        )}

        {showResult && (
          <div
            ref={mainContentRef}
            className="flex h-[500px] w-full grow flex-col items-center justify-between overflow-x-auto"
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
          <div className="bottom-8 flex items-center w-full pb-8 md:pb-10 mr-4">
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
                    handleDisplayResult({ ...pref, promptValue: value });
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
      {showScrollButton && showResult && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-8 right-8 flex items-center justify-center w-12 h-12 text-gray-600 bg-gray-200 rounded-full hover:bg-gray-400 transform hover:scale-105 transition-all duration-200 shadow-lg z-50"
        >
          <MoveDown className="w-12 h-12" />
        </button>
      )}
    </div>
  );
};

export default ReportPage;
