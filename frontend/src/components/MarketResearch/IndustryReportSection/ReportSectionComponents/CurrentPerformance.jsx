import React, { useState } from "react";

const CurrentPerformanceComponent = ({ currentPerformance = [] }) => {
  const [openIndex, setOpenIndex] = useState(null);

  // Ensure currentPerformance is an array, fallback to an empty array if undefined or incorrect type
  const performanceData = Array.isArray(currentPerformance) ? currentPerformance : [];

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="p-10 text-gray-400">
      <h3 className="text-xl font-semibold mb-4 text-[#e1e1e1]">Insights</h3>
      {performanceData.length > 0 ? (
        <div className="grid grid-cols-2 gap-12">
          {performanceData.map((point, index) => (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <div
                onClick={() => toggleAccordion(index)}
                className="flex justify-between items-center cursor-pointer"
              >
                <h4 className="text-lg text-[#b9bbbe] font-medium">
                  {point.current_performance_point_title || "Untitled Insight"}
                </h4>
                <span className="text-lg">{openIndex === index ? "-" : "+"}</span>
              </div>
              {openIndex === index && (
                <p className="mt-2 font-normal text-[#a8a8a8]">
                  {point.current_performance_point_description || "No description available."}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No performance insights available.</p>
      )}
    </div>
  );
};

export default CurrentPerformanceComponent;
