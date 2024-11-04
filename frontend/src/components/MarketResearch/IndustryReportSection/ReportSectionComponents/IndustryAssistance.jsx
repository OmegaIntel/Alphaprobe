import React, { useState } from "react";

const IndustryAssistance = ({ industryAssistance }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400">
      <h3 className="text-xl font-semibold mb-4">Industry Assistance</h3>

      <div className="mb-4 flex justify-between">
        <p className="text-lg">
          <span className="font-semibold">Assistance Level: </span>
          {industryAssistance.assistance_level}
        </p>
        <p className="text-lg">
          <span className="font-semibold">Trend: </span>
          {industryAssistance.assistance_trend}
        </p>
      </div>

      <div className="space-y-4">
        {industryAssistance.assistance_points.map((point, index) => (
          <div
            key={index}
            className="rounded-lg p-3 bg-gray-300/20 shadow-sm"
          >
            <div
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h4 className="font-semibold text-lg">{point.assistance_title}</h4>
              {/* <span className="text-lg">{openIndex === index ? "-" : "+"}</span> */}
            </div>
            {openIndex === index && (
              <p className="mt-2 text-gray-300">{point.assistance_description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndustryAssistance;
