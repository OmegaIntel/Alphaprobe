import React from "react";
import { Spin } from "antd";
import Markdown from "react-markdown";
import { RobotOutlined, LoadingOutlined } from "@ant-design/icons";

const ChatMessages = ({
  loading,
  error,
  messages,
  currentChatSession,
  isLoadingMessage,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!error && currentChatSession && messages.length > 0) {
    return (
      <>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`py-4 px-[14px] w-fit max-w-[80%] text-sm leading-5 bg-[#001529] ${
              msg.role === "ai"
                ? "rounded-[8px] rounded-bl-none"
                : "rounded-[8px] rounded-br-none ml-auto"
            }`}
          >
            <p>
              <Markdown>{msg.content}</Markdown>
            </p>
          </div>
        ))}
        {isLoadingMessage && (
          <div className="py-4 px-[14px] w-fit max-w-[50%] text-sm leading-5 bg-[#001529] rounded-[8px] rounded-bl-none">
            <LoadingOutlined className="text-white" spin />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="text-center">
      <div className="w-10 h-10 bg-purple-600 rounded-md flex items-center justify-center mx-auto mb-4">
        <RobotOutlined className="text-white" />
      </div>
      <h2 className="text-base font-semibold mb-2">Welcome to Omega Copilot</h2>
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
  );
};

export default ChatMessages;
