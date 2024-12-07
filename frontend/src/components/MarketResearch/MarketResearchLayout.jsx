import React from "react";
import { useSelector } from "react-redux";
import IndustryHeader from "./MarketResearchHeader'/MarketResearchHeader";
import IndustryReport from "./IndustryReportSection/IndustryReport";
import MarketResearchPreload from "./MarketResearchPreload/MarketResearchPreload";


const MarketResearchLayout = () => {
  const formResponse = useSelector((state) => state.formResponse.data);
  return (
    <>    
    {formResponse ? (
     <div className="flex h-screen overflow-hidden">
      
     {/* Sidebar with fixed width and scrollable content */}
     <div className="w-60 flex-shrink-0 bg-[#09090A]">
       <IndustryHeader />
     </div>

     {/* Main content area */}
     <div className="flex-1 overflow-y-auto bg-[#111111] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-950">
       <IndustryReport />
     </div>
   </div>
    ) : (
      <div className="flex items-center justify-center h-full text-gray-300">
       <MarketResearchPreload />
      </div>
    )}
    </>    
  );
};

export default MarketResearchLayout;
