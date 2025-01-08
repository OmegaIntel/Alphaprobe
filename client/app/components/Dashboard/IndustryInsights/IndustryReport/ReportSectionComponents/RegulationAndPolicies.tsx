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
  const [areAllOpen, setAreAllOpen] = useState<boolean>(false); // Default to open all

  // Destructure and provide defaults for regulations
  const {
    regulations_level = "N/A",
    regulations_trend = "N/A",
    regulations_points = [],
  } = regulations;

  const toggleAllAccordions = () => {
    // Toggle the state: if any is clicked, toggle the state of all
    setAreAllOpen(!areAllOpen);
  };

  return (
    <div className="p-4 shadow-md px-10 text-gray-400 mb-20">
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
          // Destructure and provide defaults for individual points
          const {
            regulation_title = "Untitled Regulation",
            regulation_description = "No description available.",
          } = point;

          return (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <div
                onClick={toggleAllAccordions}
                className="flex justify-between items-center cursor-pointer"
              >
                <h4 className="text-lg text-[#b9bbbe] font-medium">
                  {regulation_title}
                </h4>
                <span className="text-lg">{areAllOpen ? "-" : "+"}</span>
              </div>
              {areAllOpen && (
                <p className="mt-2 font-normal text-[#a8a8a8]">
                  {regulation_description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RegulationsAndPolicies;
