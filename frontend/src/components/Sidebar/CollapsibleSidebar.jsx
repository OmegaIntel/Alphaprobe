import React, { useState } from "react";
import IndustryCheckboxes from "../MarketResearch/MarketResearchCheckbox";

const CollapsibleSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex h-full ">
      {/* Sidebar */}
      <div
        className={`bg-gray-900 z-[1000] text-white h-full transition-all duration-300 ${
          isOpen ? "w-96" : "w-0"
        } relative`}
      >
        <div className={`p-5 ${isOpen ? "block" : "hidden"}`}>
          <h2 className="text-xl font-bold"></h2>
          <IndustryCheckboxes />
        </div>

        {/* Toggle Button */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2 -left-8 bg-gray-800 hover:bg-gray-700 text-white cursor-pointer w-8 h-20 flex items-center justify-center rounded-l-lg group"
          onClick={toggleSidebar}
          title={isOpen ? "Collapse" : "Expand"}
        >
          <span className="text-lg">{isOpen ? ">" : "<"}</span>
          {/* Tooltip on hover */}
          <div className="absolute left-8 w-auto py-1 px-3 text-sm text-white bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {isOpen ? "Collapse" : "Expand"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSidebar;
