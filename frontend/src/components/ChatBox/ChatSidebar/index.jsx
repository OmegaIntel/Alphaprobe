import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import React from "react";
import { truncateDescription } from "../../../utils/truncateDescription";

// Function to group sessions by type
const groupByType = (sessions) => {
  return sessions.reduce((acc, session) => {
    const { type } = session;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(session);
    return acc;
  }, {});
};

const ChatSidebar = ({
  isSidebarOpen,
  toggleSidebar,
  previousSessions,
  loadPreviousMessages,
  fetchDealDocuments,
}) => {
  // Group sessions by type
  const groupedSessions = groupByType(previousSessions);

  return (
    <div
      className={`w-[300px] shadow z-10 bg-[#151518] rounded absolute top-0 h-[38rem] transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "left-0" : "-left-[300px]"
      }`}
    >
      <div className="flex justify-between items-center p-4 border-b border-[#505059] text-white">
        <h2 className="font-bold">Previous Sessions</h2>
        <div className="flex gap-2">
          <PlusOutlined
            className="cursor-pointer"
            onClick={fetchDealDocuments}
          />
          <CloseOutlined className="cursor-pointer" onClick={toggleSidebar} />
        </div>
      </div>
      <div className="overflow-y-auto p-4 h-[80%]">
        {previousSessions.length > 0 ? (
          Object.keys(groupedSessions).map((type) => (
            <div key={type}>
              <h3 className="text-lg font-bold text-[white] mb-2">{type}</h3>
              {groupedSessions[type].map((session) => (
                <div
                  key={session.id}
                  className="mb-2 px-2 py-1 text-sm font-semibold bg-[#303038] cursor-pointer rounded shadow"
                  onClick={() => loadPreviousMessages(session.id)}
                >
                  {session.session_name
                    ? truncateDescription(session.session_name, 30)
                    : "New Chat Session"}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="h-full flex items-center text-center">
            <h2>You don't have any previous chat sessions</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
