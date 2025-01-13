import React, { useState } from "react";

// Define types for props and regulation points
interface RegulationPoint {
  regulation_title?: string;
  regulation_description?: string;
}

interface Regulations {
  regulations_level?: string;
  regulations_trend?: string;
  regulations_points?: RegulationPoint[];
}

interface RegulationsAndPoliciesProps {
  regulations?: Regulations;
}

const RegulationsAndPolicies: React.FC<RegulationsAndPoliciesProps> = ({
  regulations = {},
}) => {
  const [areAllOpen, setAreAllOpen] = useState<boolean>(false);

  // Destructure and provide defaults for regulations
  const {
    regulations_level = "N/A",
    regulations_trend = "N/A",
    regulations_points = [],
  } = regulations;

  const toggleAllAccordions = () => {
    setAreAllOpen(!areAllOpen);
  };

  return (
    <div className="p-4 bg-[#171717] border rounded-xl border-[#2e2e2e] shadow-md px-10 text-gray-400 mb-20">
      <h3 className="text-2xl font-semibold my-10 text-white">
        Regulations and Policies
      </h3>

      {/* Regulation level and trend */}
      <div className="mb-4 flex justify-between">
        <p className="text-lg">
          <span className="font-semibold text-[#e1e1e1]">
            Regulation Level:{" "}
          </span>
          {regulations_level}
        </p>
        <p className="text-lg">
          <span className="font-semibold text-[#e1e1e1]">Trend: </span>
          {regulations_trend}
        </p>
      </div>

      {/* Render regulation points */}
      <div className="grid grid-cols-2 gap-12">
        {regulations_points.map((point, index) => {
          const {
            regulation_title = "Untitled Regulation",
            regulation_description = "No description available.",
          } = point;

          return (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <h4 className="text-lg text-[#b9bbbe] font-medium">
                {regulation_title}
              </h4>
              {areAllOpen && (
                <p className="mt-2 font-normal text-[#a8a8a8]">
                  {regulation_description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Show More / Show Less button */}
      {regulations_points.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={toggleAllAccordions}
            className="mt-12 mb-6 w-1/5 bg-[#1d2a41] text-white border-2 border-[#404040] py-2 rounded-full font-medium hover:bg-gray-600 transition duration-200"
          >
            {areAllOpen ? "Show Less" : "Show More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default RegulationsAndPolicies;
