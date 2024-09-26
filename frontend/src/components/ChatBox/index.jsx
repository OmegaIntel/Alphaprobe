import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Select } from "antd";
import React, { useState } from "react";
import { RobotOutlined, SendButtonIcon } from "../../constants/IconPack";

const { Option } = Select;

const ChatBox = ({ deals }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  const answers = [
    {
      message: "Hello! What can I do for you today?",
      message_sender: "A",
    },
    {
      message: "Hello",
      message_sender: "H",
    },
    {
      message: "Hello! How can I assist you today?",
      message_sender: "A",
    },
    {
      message: "Hello",
      message_sender: "H",
    },
    {
      message: "Hello! How can I assist you today?",
      message_sender: "A",
    },
    {
      message: "Hello",
      message_sender: "H",
    },
    {
      message: "Hello! How can I assist you today?",
      message_sender: "A",
    },
    {
      message: "Hello",
      message_sender: "H",
    },
    {
      message: "Hello! How can I assist you today?",
      message_sender: "A",
    },
    {
      message: "Hello",
      message_sender: "H",
    },
    {
      message: "Hello! How can I assist you today?",
      message_sender: "A",
    },
    {
      message: "Hello",
      message_sender: "H",
    },
    {
      message: "Hello! How can I assist you today?",
      message_sender: "A",
    },
    {
      message: "Hello",
      message_sender: "H",
    },
    {
      message: "Hello! How can I assist you today?",
      message_sender: "A",
    },
  ];
  return (
    <>
      <button
        onClick={toggleChat}
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
          <div className="bg-[#24242A] shadow-lg rounded-lg p-4 w-96 h-[36rem] mb-4">
            <div className="p-1 flex flex-col justify-center gap-2 items-center">
              <div className="flex justify-between w-full">
                <span className="text-base font-semibold">Omega Copilot</span>
                <div className="flex items-center space-x-2">
                  <PlusOutlined className="text-white text-sm cursor-pointer" />
                  <CloseOutlined
                    className="text-white text-sm cursor-pointer"
                    onClick={toggleChat}
                  />
                </div>
              </div>
              <Select placeholder="Select Project" className="w-full">
                {deals.map((deal, idx) => (
                  <Option value={deal.id} key={idx}>
                    {deal.name}
                  </Option>
                ))}
              </Select>
            </div>
            <hr className="h-px my-2 bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
            <div
              className={`chats-container ${
                answers.length === 0 && "justify-center"
              }`}
            >
              {answers.length > 0 ? (
                answers.map((ans, index) => (
                  <div
                    className={`py-4 px-[14px] w-fit max-w-[200px] text-sm leading-5 bg-[#001529] ${
                      ans.message_sender === "A"
                        ? "rounded-[8px] rounded-bl-none"
                        : "rounded-[8px] rounded-br-none ml-auto"
                    }`}
                  >
                    <p>{ans.message}</p>
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
            </div>
            <div className="flex w-full flex-col gap-4">
              <button className="w-[60%] rounded bg-[#0088CC] p-2">
                <PlusOutlined />
                <span className="ml-2">Add to current workspace</span>
              </button>
              <div className="flex relative items-center isolate">
                <input
                  type="text"
                  className="break-words bg-[#212126] border border-[#303038] focus:outline-none w-full rounded py-2 px-3 mb-4"
                  placeholder="Ask a question"
                />
                <button className="absolute right-2 top-2 bg-[#303038] rounded p-1 ">
                  <SendButtonIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBox;
