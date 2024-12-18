import React, { useState } from "react";
import ChatDisplay from "./SummaryPoints/ChatDisplay";
import ChatInterface from "./SummaryPoints/ChatInterface";

const SummaryPoints = () => {
  const [isFirstQueryMade, setIsFirstQueryMade] = useState(false);

  const handleFirstQuery = () => {
    setIsFirstQueryMade(true);
  };

  return (
    <div className="w-full h-screen bg-[#0d0d0d] scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800 overflow-y-scroll px-3 py-2">
      <div>
        <div className={`${isFirstQueryMade ? ' block' : 'hidden'}`}>
          <ChatDisplay />
        </div>
        <div className={`${isFirstQueryMade ? 'fixed bottom-0 left-60 right-60' : 'flex flex-col items-center py-32 h-screen bg-stone-950 text-white'}`}>
          <ChatInterface onFirstQueryMade={handleFirstQuery} />
        </div>
      </div>
    </div>
  );
};

export default SummaryPoints;

//"w-full h-screen bg-[#0d0d0d] scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800 overflow-y-scroll px-3 py-2"