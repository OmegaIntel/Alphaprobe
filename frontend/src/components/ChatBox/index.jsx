import {
  CloseOutlined,
  LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Alert, notification, Select } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { RobotOutlined, SendButtonIcon } from "../../constants/IconPack";
import { fetchAllDocument } from "../../services/uploadService";
import {
  addToWorkSpace,
  createChatSession,
  deleteChatSession,
  sendChatMessage,
} from "../../services/chatService";
import { categoryList } from "../../constants";
import { useModal } from "../UploadFilesModal/ModalContext";
import Markdown from "react-markdown";

const { Option } = Select;

const ChatBox = () => {
  const { dealId, deals, selectedCategory } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const [selectDeal, setSelectDeal] = useState(dealId);
  const [selectCategory, setSelectCategory] = useState(selectedCategory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentChatSession, setCurrentChatSession] = useState(null);
  const [messages, setMessages] = useState([]); // State to store messages
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [inputMessage, setInputMessage] = useState(""); // State to store user input

  const resetState = useCallback(async () => {
    if (currentChatSession) {
      try {
        const response = await deleteChatSession(currentChatSession);
        console.log(response);
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    }
    setError(null);
    setCurrentChatSession(null);
    setMessages([]);
    setInputMessage("");
  }, [currentChatSession]);

  const toggleChat = () => {
    if (isOpen) {
      resetState();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const fetchDealDocuments = async () => {
      setLoading(true);
      try {
        const response = await fetchAllDocument(selectDeal);
        if (response.documents?.length > 0) {
          if (selectCategory) {
            const res = await createChatSession(selectDeal);
            setCurrentChatSession(res.id);
            setError(null);
          } else {
            setCurrentChatSession(null);
            setError("Please Select the category");
          }
        } else {
          setCurrentChatSession(null);
          setError("No documents available for this deal.");
        }
      } catch (error) {
        setError("No documents available for this deal.");
      } finally {
        setLoading(false);
      }
    };
    fetchDealDocuments();
  }, [selectCategory, selectDeal]);

  useEffect(() => {
    if (dealId) {
      setSelectDeal(dealId);
    } else {
      setSelectDeal(null);
    }
  }, [dealId]);

  useEffect(() => {
    if (
      selectedCategory &&
      categoryList.slice(0, 4).includes(selectedCategory)
    ) {
      setSelectCategory(selectedCategory);
    } else {
      setSelectCategory(null);
    }
  }, [selectedCategory]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { message: inputMessage, message_sender: "H" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    setInputMessage("");
    setIsLoadingMessage(true);
    try {
      const message = await sendChatMessage(
        currentChatSession,
        selectDeal,
        inputMessage
      );
      setIsLoadingMessage(false);
      const botReply = { message: message.response, message_sender: "A" };
      setMessages((prevMessages) => [...prevMessages, botReply]);
    } catch (error) {
      console.log("Error sending message:", error);
      setIsLoadingMessage(false);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleAddToWorkspace = async () => {
    try {
      const response = await addToWorkSpace(currentChatSession, selectCategory);
      if (response) notification.success({ message: response.message });
    } catch (error) {
      console.log("Error to add to current workspace:", error);
      setError("Failed to add to current workspace. Please try again.");
    }
  };

  return (
    <>
      <button
        onClick={() => toggleChat(true)}
        className="p-3 bg-[#1F1E23] text-left rounded font-bold"
      >
        Omega Terminal
      </button>
      <div className="fixed bottom-[20%] left-[15%] z-50 flex flex-col items-end">
        <div
          className={`chatbox-container ${
            isOpen ? "chatbox-open" : "chatbox-closed"
          }`}
        >
          <div className="bg-[#24242A] shadow-lg rounded-lg p-4 w-[36rem] h-[38rem] mb-4">
            <div className="p-1 flex flex-col justify-center gap-2 items-center">
              <div className="flex justify-between w-full">
                <span className="text-base font-semibold">Omega Copilot</span>
                <div className="flex items-center space-x-2">
                  <CloseOutlined
                    className="text-white text-sm cursor-pointer"
                    onClick={() => toggleChat(true)}
                  />
                </div>
              </div>
              <Select
                placeholder="Select Deal"
                className="w-full"
                onChange={(dealId) => setSelectDeal(dealId)}
                loading={loading}
                value={selectDeal}
              >
                {deals.map((deal, idx) => (
                  <Option value={deal.id} key={idx}>
                    {deal.name}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Select Category"
                className="w-full"
                onChange={(selectedCategory) =>
                  setSelectCategory(selectedCategory)
                }
                loading={loading}
                value={selectCategory}
              >
                {categoryList.slice(0, 4).map((category, idx) => (
                  <Option value={category} key={idx}>
                    {category}
                  </Option>
                ))}
              </Select>
            </div>
            {error && (
              <Alert message={error} type="warning" showIcon className="mt-4" />
            )}
            <hr className="h-px my-2 bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
            <div
              className={`chats-container ${
                messages.length === 0 && "justify-center"
              }`}
            >
              {!error && currentChatSession && messages.length > 0 ? (
                messages.map((ans, index) => (
                  <div
                    key={index}
                    className={`py-4 px-[14px] w-fit max-w-[55%] text-sm leading-5 bg-[#001529] ${
                      ans.message_sender === "A"
                        ? "rounded-[8px] rounded-bl-none"
                        : "rounded-[8px] rounded-br-none ml-auto"
                    }`}
                  >
                    <p>
                      <Markdown>{ans.message}</Markdown>
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center">
                  <div className="w-10 h-10 bg-purple-600 rounded-md flex items-center justify-center mx-auto mb-4">
                    <RobotOutlined className="text-white" />
                  </div>
                  <h2 className="text-base font-semibold mb-2">
                    Welcome to Omega Copilot
                  </h2>
                  <p className="text-sm mb-2 text-[#F6F6F6]">
                    Please select the Data Source for your Research
                  </p>
                  <p className="text-sm mb-2 text-[#F6F6F6]">
                    To chat with only specific widgets, use the icon.
                  </p>
                  <p className="text-sm mb-2 text-[#F6F6F6]">
                    For more information, see our{" "}
                    <span className="text-[#9C76DC] underline cursor-pointer ">
                      Copilot Documentation
                    </span>
                  </p>
                </div>
              )}
              {isLoadingMessage && (
                <div className="py-4 px-[14px] w-fit max-w-[50%] text-sm leading-5 bg-[#001529] rounded-[8px] rounded-bl-none">
                  <LoadingOutlined className="text-white" spin />
                </div>
              )}
            </div>
            {!error && currentChatSession && (
              <div className="flex w-full flex-col gap-4">
                <button
                  className="w-[50%] rounded bg-[#0088CC] disabled:bg-gray-600 disabled:cursor-not-allowed p-2"
                  onClick={handleAddToWorkspace}
                  disabled={messages.length === 0}
                >
                  <PlusOutlined />
                  <span className="ml-2">Add to current workspace</span>
                </button>
                <div className="flex relative items-center isolate">
                  <input
                    type="text"
                    className="break-words bg-[#212126] border border-[#303038] focus:outline-none w-full rounded py-2 px-3 mb-4"
                    placeholder="Ask a question"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    className="absolute right-2 top-2 bg-[#303038] rounded p-1 disabled:cursor-not-allowed"
                    onClick={handleSendMessage}
                    disabled={isLoadingMessage}
                  >
                    <SendButtonIcon
                      color={isLoadingMessage ? "#46464F" : "white"}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBox;
