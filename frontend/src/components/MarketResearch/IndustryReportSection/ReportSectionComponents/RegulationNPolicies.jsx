import React, { useState } from "react";

const RegulationsAndPolicies = ({ regulations }) => {
  const [openIndex, setOpenIndex] = useState(null);

  // Error handling: Check if regulations is valid
  if (!regulations || !regulations.regulations_points || !Array.isArray(regulations.regulations_points)) {
    return (
      <div className="text-red-500 text-center">
        <p>Error: Invalid regulations data</p>
      </div>
    );
  }

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="p-4 shadow-md px-10 text-gray-400 mb-20">
      <h3 className="text-2xl font-semibold my-10 text-white">Regulations and Policies</h3>

      {/* Error handling for missing regulations_level or regulations_trend */}
      {regulations.regulations_level ? (
        <div className="mb-4 flex justify-between">
          <p className="text-lg">
            <span className="font-semibold text-[#e1e1e1]">Regulation Level: </span>
            {regulations.regulations_level}
          </p>
          <p className="text-lg">
            <span className="font-semibold text-[#e1e1e1]">Trend: </span>
            {regulations.regulations_trend}
          </p>
        </div>
      ) : (
        <div className="mb-4 flex justify-between text-red-500">
          <p className="text-lg">Error: Missing regulation level or trend data</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-12">
        {regulations.regulations_points.map((point, index) => {
          // Error handling: Check if regulation point has required fields
          if (!point.regulation_title || !point.regulation_description) {
            return (
              <div key={index} className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md">
                <p className="text-red-500">Error: Missing regulation title or description</p>
              </div>
            );
          }

          return (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <div
                onClick={() => toggleAccordion(index)}
                className="flex justify-between items-center cursor-pointer"
              >
                <h4 className="text-lg text-[#b9bbbe] font-medium">{point.regulation_title}</h4>
                <span className="text-lg">{openIndex === index ? "-" : "+"}</span>
              </div>
              {openIndex === index && (
                <p className="mt-2 font-normal text-[#a8a8a8]">{point.regulation_description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RegulationsAndPolicies;
