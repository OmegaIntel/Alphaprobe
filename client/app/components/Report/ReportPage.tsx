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

const ReportPage: FC = () => {
  const [promptValue, setPromptValue] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatBoxSettings, setChatBoxSettings] = useState<ChatBoxSettings>({
    report_source: 'web',
    report_type: 'deep',
    tone: 'Objective',
    domains: [],
    defaultReportType: 'deep',
  });
  const [question, setQuestion] = useState('');
  const [orderedData, setOrderedData] = useState<Data[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isStopped, setIsStopped] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const { history, saveResearch, getResearchById, deleteResearch } =
    useResearchHistory();

  const { socket, initializeWebSocket } = useWebSocket(
    setOrderedData,
    setAnswer,
    setLoading
  );

  const handleChat = async (message: string) => {
    if (socket) {
      setShowResult(true);
      setQuestion(message);
      setLoading(true);
      setPromptValue('');
      setAnswer('');

      const questionData: QuestionData = { type: 'question', content: message };
      setOrderedData((prevOrder) => [...prevOrder, questionData]);

      socket.send(`start${JSON.stringify({ message })}`);
    }
  };

  const handleDisplayResult = async (newQuestion: InitialFormData) => {
    setShowResult(true);
    setLoading(true);
    setQuestion(newQuestion.promptValue);
    setPromptValue('');
    setAnswer('');
    setOrderedData((prevOrder) => [
      ...prevOrder,
      { type: 'question', content: newQuestion.promptValue },
    ]);

    // const storedConfig = localStorage.getItem('apiVariables');
    // const apiVariables = storedConfig ? JSON.parse(storedConfig) : {};
    // const langgraphHostUrl = apiVariables.LANGGRAPH_HOST_URL;

    // if (chatBoxSettings.report_type === 'multi_agents' && langgraphHostUrl) {
    //   let { streamResponse, host, thread_id } = await startLanggraphResearch(newQuestion, chatBoxSettings.report_source, langgraphHostUrl);
    //   const langsmithGuiLink = `https://smith.langchain.com/studio/thread/${thread_id}?baseUrl=${host}`;
    //   setOrderedData((prevOrder) => [...prevOrder, { type: 'langgraphButton', link: langsmithGuiLink }]);

    //   let previousChunk = null;
    //   for await (const chunk of streamResponse) {
    //     if (chunk.data.report != null && chunk.data.report != "Full report content here") {
    //       setOrderedData((prevOrder) => [...prevOrder, { ...chunk.data, output: chunk.data.report, type: 'report' }]);
    //       setLoading(false);
    //     } else if (previousChunk) {
    //       const differences = findDifferences(previousChunk, chunk);
    //       setOrderedData((prevOrder) => [...prevOrder, { type: 'differences', content: 'differences', output: JSON.stringify(differences) }]);
    //     }
    //     previousChunk = chunk;
    //   }
    // } else {
    initializeWebSocket(newQuestion);
    //}
  };

  const reset = () => {
    // Reset UI states
    setShowResult(false);
    setPromptValue('');
    setIsStopped(false);

    // Clear previous research data
    setQuestion('');
    setAnswer('');
    setOrderedData([]);
    setAllLogs([]);

    // Reset feedback states
    // setShowHumanFeedback(false);
    // setQuestionForHuman(false);

    // Clean up connections
    if (socket) {
      socket.close();
    }
    setLoading(false);
  };

  const handleClickSuggestion = (value: string) => {
    setPromptValue(value);
    const element = document.getElementById('input-area');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Handles stopping the current research
   * - Closes WebSocket connection
   * - Stops loading state
   * - Marks research as stopped
   * - Preserves current results
   */
  const handleStopResearch = () => {
    if (socket) {
      socket.close();
    }
    setLoading(false);
    setIsStopped(true);
  };

  /**
   * Handles starting a new research
   * - Clears all previous research data and states
   * - Resets UI to initial state
   * - Closes any existing WebSocket connections
   */

  // Save completed research to history
  useEffect(() => {
    // Only save when research is complete and not loading
    if (
      showResult &&
      !loading &&
      answer &&
      question &&
      orderedData.length > 0
    ) {
      // Check if this is a new research (not loaded from history)
      //@ts-ignore
      const isNewResearch = !history.some(
        (item) => item.question === question && item.answer === answer
      );

      if (isNewResearch) {
        saveResearch(question, answer, orderedData);
      }
    }
  }, [
    showResult,
    loading,
    answer,
    question,
    orderedData,
    history,
    saveResearch,
  ]);

  /**
   * Processes ordered data into logs for display
   * Updates whenever orderedData changes
   */
  useEffect(() => {
    const groupedData = preprocessOrderedData(orderedData);
    const statusReports = [
      'agent_generated',
      'starting_research',
      'planning_research',
      'error',
    ];

    const newLogs = groupedData.reduce((acc: any[], data) => {
      // Process accordion blocks (grouped data)
      if (data.type === 'accordionBlock') {
        const logs = data.items.map((item: any, subIndex: any) => ({
          header: item.content,
          text: item.output,
          metadata: item.metadata,
          key: `${item.type}-${item.content}-${subIndex}`,
        }));
        return [...acc, ...logs];
      }
      // Process status reports
      else if (statusReports.includes(data.content)) {
        return [
          ...acc,
          {
            header: data.content,
            text: data.output,
            metadata: data.metadata,
            key: `${data.type}-${data.content}`,
          },
        ];
      }
      return acc;
    }, []);

    setAllLogs(newLogs);
  }, [orderedData]);

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
                  orderedData={orderedData}
                  response={answer}
                  allLogs={allLogs}
                  chatBoxSettings={chatBoxSettings}
                  handleClickSuggestion={handleClickSuggestion}
                />
              </div>
            </div>
          </div>
        )}
        {showResult && (
          <div className="bottom-8 flex items-center w-full pb-8 md:pb-10">
            {loading ? (
              <Loader />
            ) : (
              <InputComponent
                promptValue={promptValue}
                setPromptValue={setPromptValue}
                handleSubmit={handleChat}
                handleSecondary={(value: string) => {
                  const pref = JSON.parse(
                    localStorage.getItem('promtPreferance') || ''
                  );
                  if (value) {
                    handleDisplayResult({ ...pref, promptValue: value });
                  }
                }}
                disabled={loading}
                reset={reset}
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
