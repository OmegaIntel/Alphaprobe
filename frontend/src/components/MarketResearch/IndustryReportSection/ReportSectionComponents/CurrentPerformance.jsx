import React, { useState } from "react";

const CurrentPerformanceComponent = ({ currentPerformance }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="p-10 text-gray-400">
      <h3 className="text-xl font-semibold mb-4">Insights</h3>

      <div className="space-y-4">
        {currentPerformance.map((point, index) => (
          <div
            key={index}
            className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-lg p-4 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
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