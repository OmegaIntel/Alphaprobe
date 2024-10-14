import React, { useCallback, useEffect, useState } from "react";
import { Alert, notification } from "antd";
import { fetchAllDocument } from "../../services/uploadService";
import {
  addMessageToWorkspace,
  addToWorkSpace,
  createChatSession,
  deleteChatSession,
  fetchPreviousMessages,
  fetchPreviousSessions,
  sendChatMessage,
} from "../../services/chatService";
import { categoryList } from "../../constants";
import { useModal } from "../UploadFilesModal/ModalContext";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatActions from "./ChatActions";

const ChatBox = () => {
  const { dealId, deals, selectedCategory } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const [selectCategory, setSelectCategory] = useState(selectedCategory);
  const [isGlobalData, setIsGlobalData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentChatSession, setCurrentChatSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [previousSessions, setPreviousSessions] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleChat = () => {
    if (deals.length > 0 && dealId) {
      if (isOpen) {
        // resetState();
        setIsGlobalData(false);
      }
      setIsOpen(!isOpen);
    } else {
      notification.warning({ message: "Please Select or Create Deal to Chat" });
    }
  };

  const resetState = useCallback(async () => {
    if (dealId) {
      try {
        await deleteChatSession(dealId);
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    }
    setCurrentChatSession(null);
    setMessages([]);
    setInputMessage("");
  }, [dealId]);

  const fetchDealDocuments = async () => {
    setLoading(true);
    resetState();
    try {
      if (!isGlobalData) {
        const response = await fetchAllDocument(dealId);
        if (response.documents?.length > 0) {
          if (selectCategory) {
            const res = await createChatSession(dealId, isGlobalData);
            setCurrentChatSession(res.id);
            setError(null);
            setIsSidebarOpen(false)
          } else {
            setCurrentChatSession(null);
            setError("Please Select the category");
          }
        } else {
          setCurrentChatSession(null);
          setError("No documents available for this deal.");
        }
      } else {
        try {
          const res = await createChatSession(dealId, isGlobalData);
          setCurrentChatSession(res.id);
          setError(null);
          setIsSidebarOpen(false)
        } catch (error) {
          setCurrentChatSession(null);
          setError("Try again later");
        }
      }
    } catch (error) {
      setError("No documents available for this deal.");
    } finally {
      setLoading(false);
    }
  };
  const loadPreviousMessages = async (sessionId) => {
    setLoading(true);
    try {
      const previousMessages = await fetchPreviousMessages(sessionId);
      if (previousMessages) {
        setMessages(previousMessages);
      } else {
        setMessages([]);
      }
      setCurrentChatSession(sessionId);
      setError(null);
    } catch (error) {
      setError("Failed to load previous messages.");
    } finally {
      setLoading(false);
    }
    setIsSidebarOpen(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { content: inputMessage, role: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    setInputMessage("");
    setIsLoadingMessage(true);
    try {
      await sendChatMessage(
        currentChatSession,
        dealId,
        inputMessage,
        isGlobalData
      );
      const previousMessages = await fetchPreviousMessages(currentChatSession);
      if (previousMessages) {
        setMessages(previousMessages);
      } else {
        setMessages([]);
        setError("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.log("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleAddToWorkspace = async () => {
    try {
      const response = await addToWorkSpace(
        currentChatSession,
        selectCategory,
        dealId
      );
      if (response) notification.success({ message: response.message });
    } catch (error) {
      console.log("Error to add to current workspace:", error);
      setError("Failed to add to current workspace. Please try again.");
    }
  };

  const handleAddMessageToWorkSpace = async (messageId) => {
    try {
      const response = await addMessageToWorkspace(
        messageId,
        selectCategory,
        dealId
      );
      if (response) notification.success({ message: response.message });
    } catch (error) {
      console.log("Error to add to current workspace:", error);
      setError("Failed to add to current workspace. Please try again.");
    }
  };

  useEffect(() => {
    if (isOpen) fetchDealDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, isOpen]);

  useEffect(() => {
    if (
      selectedCategory &&
      categoryList.slice(0, 4).includes(selectedCategory)
    ) {
      setSelectCategory(selectedCategory);
    } else {
      setSelectCategory("Investment Thesis");
    }
  }, [selectedCategory]);

  useEffect(() => {
    const loadPreviousSessions = async () => {
      try {
        const sessions = await fetchPreviousSessions(dealId); // Fetch the previous chat sessions
        if (Array.isArray(sessions)) {
          setPreviousSessions(sessions);
        } else {
          setPreviousSessions([]);
        }
      } catch (error) {
        console.error("Failed to load previous sessions:", error);
      }
    };

    if (isSidebarOpen) {
      loadPreviousSessions();
    }
  }, [dealId, isSidebarOpen, currentChatSession]);

  return (
    <>
      <button
        className="flex justify-center items-center"
        onClick={() => toggleChat(true)}
      >
        <img src="/images/logo.png" alt="" />
        <span className="text-xs font-bold">Omega Copilot</span>
      </button>
      <div className="fixed top-[7%] right-2 z-50 flex flex-col items-end">
        <div
          className={`chatbox-container ${
            isOpen ? "chatbox-open" : "chatbox-closed"
          }`}
        >
          <div
            className={`bg-[#24242A] shadow-lg rounded-lg p-4 mb-4 w-[32rem] h-[38rem]`}
          >
            <ChatSidebar
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              previousSessions={previousSessions}
              loadPreviousMessages={loadPreviousMessages}
              fetchDealDocuments={fetchDealDocuments}
            />
            <ChatHeader
              isGlobalData={isGlobalData}
              setIsGlobalData={setIsGlobalData}
              toggleChat={toggleChat}
              toggleSidebar={toggleSidebar}
            />
            {error && (
              <Alert message={error} type="warning" showIcon className="mt-4" />
            )}
            <hr className="h-px my-2 bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
            <div
              className={`chats-container ${
                messages.length === 0 && "justify-center"
              }`}
            >
              <ChatMessages
                currentChatSession={currentChatSession}
                error={error}
                isLoadingMessage={isLoadingMessage}
                loading={loading}
                messages={messages}
                handleAddMessageToWorkSpace={handleAddMessageToWorkSpace}
              />
            </div>
            {!error && currentChatSession && (
              <div className="flex w-full flex-col gap-4">
                <ChatActions
                  handleAddToWorkspace={handleAddToWorkspace}
                  messages={messages}
                />
                <ChatInput
                  inputMessage={inputMessage}
                  handleSendMessage={handleSendMessage}
                  isLoadingMessage={isLoadingMessage}
                  setInputMessage={setInputMessage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBox;
