import React from "react";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { Switch, Tooltip } from "antd";

const ChatHeader = ({
  toggleSidebar,
  isGlobalData,
  setIsGlobalData,
  toggleChat,
  adminCollectionExists
}) => (
  <div className="p-1 flex flex-col justify-center gap-2 items-center">
    <div className="flex justify-between w-full">
      <MenuOutlined
        className="text-white cursor-pointer"
        onClick={() => toggleSidebar()}
      />
      <span className="text-base font-semibold">Omega Copilot</span>
      <div className="flex items-center space-x-2">
        <CloseOutlined
          className="text-white text-sm cursor-pointer"
          onClick={() => toggleChat(true)}
        />
      </div>
    </div>
    <div className="flex items-center w-full justify-start">
      <div className="flex justify-center items-center gap-4">
        <label className="text-white text-sm">Global Data</label>
        <Tooltip title={!adminCollectionExists?"No docs uploaded for global data!": ""}>
          <Switch
            checked={isGlobalData}
            onChange={(checked) => setIsGlobalData(checked)}
            className="ml-2"
            disabled={!adminCollectionExists}
          />
        </Tooltip>
      </div>
    </div>
  </div>
);

export default ChatHeader;
