import React, { useState } from "react";

const CurrentPerformanceComponent = ({ currentPerformance }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Ensure currentPerformance is an array, fallback to an empty array
  const performanceData = Array.isArray(currentPerformance) ? currentPerformance : [];

  return (
    <div className="p-10 text-gray-400">
      <h3 className="text-xl font-semibold mb-4 text-[#e1e1e1]">Insights</h3>
      <div className="grid grid-cols-2 gap-12">
        {performanceData.map((point, index) => (
          <div
            key={index}
            className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6  shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
          >
            <div
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h4 className="text-lg text-[#b9bbbe] font-medium">{point.current_performance_point_title}</h4>
              {/* Icon toggle: uncomment if needed */}
              <span className="text-lg">{openIndex === index ? "-" : "+"}</span>
            </div>
            {openIndex === index && (
              <p className="mt-2 font-normal text-[#a8a8a8]">{point.current_performance_point_description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrentPerformanceComponent;
