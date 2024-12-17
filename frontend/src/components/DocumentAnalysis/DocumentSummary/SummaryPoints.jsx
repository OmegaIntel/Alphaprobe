import React from "react";
import SummaryPointsCard from "./SummaryPoints/SummaryPointsCard";
import SummaryPointSearch from "./SummaryPoints/SummaryPointSearch";
import ChatInterface from "./SummaryPoints/ChatInterface";
import ChatDisplay from "./SummaryPoints/ChatDisplay";

const SummaryPoints = () => {
  return (
    <div className="w-full h-screen bg-[#0d0d0d] scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800 overflow-y-scroll px-3 py-2">
      <div>
        <div className="">
          <ChatDisplay />
        </div>
        <div className="fixed bottom-0 left-60 right-60">
          {/* <SummaryPointSearch /> */}
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};

export default SummaryPoints;
