import React, { useState } from "react";

const FutureOutlookComponent = ({ futureOutlook = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [allOpen, setAllOpen] = useState(false); // Track whether all accordions are open

  // Display either the first 4 points or all points, depending on isExpanded state
  const displayedPoints = isExpanded ? futureOutlook : futureOutlook.slice(0, 4);

  // Toggle all accordions
  const toggleAllAccordions = () => {
    setAllOpen(!allOpen);
  };

  return (
    <div className="p-10 text-gray-400">
      <h3 className="text-xl font-semibold mb-4 text-[#e1e1e1]">Future Outlook</h3>

      <div className="grid grid-cols-2 gap-12">
        {Array.isArray(displayedPoints) && displayedPoints.map((point, index) => (
          <div
            key={index}
            className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
          >
            <div
              onClick={toggleAllAccordions} // Toggle all accordions when clicked
              className="flex justify-between items-center cursor-pointer"
            >
              <h4 className="font-medium text-lg text-[#b9bbbe]">{point.future_outlook_point_title}</h4>
              <span className="text-lg">{allOpen ? "-" : "+"}</span>
            </div>
            {allOpen && (
              <p className="mt-2 text-[#a8a8a8]">{point.future_outlook_point_description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Toggle button to expand/collapse */}
      {futureOutlook.length > 4 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 px-4 py-2 text-blue-500 font-medium hover:underline"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );
};

export default FutureOutlookComponent;
