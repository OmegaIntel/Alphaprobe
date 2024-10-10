import React from "react";
import { SendButtonIcon } from "../../../constants/IconPack";

const ChatInput = ({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isLoadingMessage,
}) => (
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
      <SendButtonIcon color={isLoadingMessage ? "#46464F" : "white"} />
    </button>
  </div>
);

export default ChatInput;
