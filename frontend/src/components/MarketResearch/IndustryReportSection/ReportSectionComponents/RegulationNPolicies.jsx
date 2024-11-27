import React, { useState } from "react";

const RegulationsAndPolicies = ({ regulations = {} }) => {
  const [areAllOpen, setAreAllOpen] = useState(false); // Default to open all

  // Error handling: Check if regulations is valid
  const regulationsLevel = regulations.regulations_level || "N/A";
  const regulationsTrend = regulations.regulations_trend || "N/A";
  const regulationsPoints = Array.isArray(regulations.regulations_points) ? regulations.regulations_points : [];

  const toggleAllAccordions = () => {
    // Toggle the state: if any is clicked, toggle the state of all
    setAreAllOpen(!areAllOpen);
  };

  return (
    <div className="p-4 shadow-md px-10 text-gray-400 mb-20">
      <h3 className="text-2xl font-semibold my-10 text-white">Regulations and Policies</h3>

      {/* Regulation level and trend */}
      <div className="mb-4 flex justify-between">
        <p className="text-lg">
          <span className="font-semibold text-[#e1e1e1]">Regulation Level: </span>
          {regulationsLevel}
        </p>
        <p className="text-lg">
          <span className="font-semibold text-[#e1e1e1]">Trend: </span>
          {regulationsTrend}
        </p>
      </div>

      {/* Render regulation points */}
      <div className="grid grid-cols-2 gap-12">
        {regulationsPoints.map((point, index) => {
          // Error handling: Check if regulation point has required fields
          const regulationTitle = point.regulation_title || "Untitled Regulation";
          const regulationDescription = point.regulation_description || "No description available.";

          return (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <div
                onClick={toggleAllAccordions}
                className="flex justify-between items-center cursor-pointer"
              >
                <h4 className="text-lg text-[#b9bbbe] font-medium">{regulationTitle}</h4>
                <span className="text-lg">{areAllOpen ? "-" : "+"}</span>
              </div>
              {areAllOpen && (
                <p className="mt-2 font-normal text-[#a8a8a8]">{regulationDescription}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RegulationsAndPolicies;
