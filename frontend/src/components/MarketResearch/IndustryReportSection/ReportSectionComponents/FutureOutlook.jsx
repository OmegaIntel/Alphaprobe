import React, { useState } from "react";

const FutureOutlookComponent = ({ futureOutlook }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  // Display either the first 4 points or all points, depending on isExpanded state
  const displayedPoints = isExpanded ? futureOutlook : futureOutlook.slice(0, 4);

  // Toggle the description for a specific item
  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="p-10 text-gray-400">
      <h3 className="text-xl font-semibold mb-4 ">Future Outlook</h3>

      <div className="space-y-4">
        {displayedPoints.map((point, index) => (
          <div
            key={index}
            className="border border-gray-600 rounded-lg p-4 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
          >
            <div
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h4 className="font-semibold text-lg">{point.future_outlook_point_title}</h4>
            </div>
            {openIndex === index && (
              <p className="mt-2 text-gray-300">{point.future_outlook_point_description}</p>
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