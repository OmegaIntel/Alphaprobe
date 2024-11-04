import React, { useState } from "react";

const CurrentPerformanceComponent = ({ currentPerformance }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400 bg-gray-500/30">
      <h3 className="text-xl font-semibold mb-4">Current Performance</h3>

      <div className="space-y-4">
        {currentPerformance.map((point, index) => (
          <div
            key={index}
            className="rounded-lg p-3 bg-gray-300/20 shadow-sm"
          >
            <div
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h4 className="font-semibold text-lg">{point.current_performance_point_title}</h4>
              {/* Icon toggle: uncomment if needed */}
              {/* <span className="text-lg">{openIndex === index ? "-" : "+"}</span> */}
            </div>
            {openIndex === index && (
              <p className="mt-2 text-gray-300">{point.current_performance_point_description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrentPerformanceComponent;