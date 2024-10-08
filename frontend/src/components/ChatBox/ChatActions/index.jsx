import React from "react";
import { PlusOutlined } from "@ant-design/icons";

const ChatActions = ({ handleAddToWorkspace, messages }) => (
  <button
    className="w-[40%] text-xs rounded bg-[#0088CC] disabled:bg-gray-600 disabled:cursor-not-allowed px-1 py-2"
    onClick={handleAddToWorkspace}
    disabled={messages.length === 0}
  >
    <PlusOutlined />
    <span className="ml-2">Add to current workspace</span>
  </button>
);

export default ChatActions;
