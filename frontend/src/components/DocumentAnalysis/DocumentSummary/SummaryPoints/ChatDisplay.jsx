import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import TypingAnimation from "./TypingAnimation";
import PulsingIndicator from "./PulsingIndicator";
import Sidebar from "./ChatSidebar";

const ChatDisplay = () => {
  const interactions = useSelector((state) => state.chat.interactions);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentRefs, setCurrentRefs] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [interactions]);

  const handleShowReferences = (references) => {
    setCurrentRefs(references);
    setIsSidebarOpen(true);
  };

  // Helper function to format text with newline characters
  const formatText = (text) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const renderResponse = (response) => {
    if (typeof response === "string") {
      return formatText(response); // Use the formatText function for plain strings
    }
    if (response && typeof response === "object" && response.agent_response) {
      return (
        <>
          <div className="flex justify-start">
            {formatText(response.agent_response)} {/* Apply formatting here */}
          </div>
          <button
            onClick={() =>
              handleShowReferences(response.metadata_content_pairs)
            }
            className="text-blue-500 underline mt-2 cursor-pointer"
          >
            Show References
          </button>
        </>
      );
    }
    return <PulsingIndicator />;
  };

  return (
    <>
      <div className="chat-display px-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800 h-[calc(100vh-120px)]">
        <div className="flex justify-center">
          <div className="w-2/5 pt-10">
            {interactions.length > 0 ? (
              <ul>
                {interactions.map((interaction, index) => (
                  <li key={index} className="mb-4">
                    <div className="flex flex-col items-start">
                      <div className="user-message bg-stone-800 text-white p-2 rounded-lg max-w-xs">
                        {interaction.query}
                      </div>
                      <div className="response-message text-white p-2 rounded-lg max-w-xl mt-2">
                        {renderResponse(interaction.response)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex justify-center items-center h-96">
                <p className="text-stone-300 font-medium text-2xl animate-pulse">No interactions yet. Start a conversation!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        data={currentRefs}
      />
    </>
  );
};

export default ChatDisplay;
