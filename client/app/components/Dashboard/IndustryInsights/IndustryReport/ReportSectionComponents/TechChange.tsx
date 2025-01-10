import React, { useState } from "react";

// Define types for the props
interface TechnologicalChangePoint {
  technological_change_title: string;
  technological_change_description: string;
}

interface TechnologicalChangeData {
  technological_change_level: string;
  technological_change_trend: string;
  technological_change_points: TechnologicalChangePoint[];
}

interface TechnologicalChangeProps {
  technologicalChange?: TechnologicalChangeData; // Made optional
}

const TechnologicalChange: React.FC<TechnologicalChangeProps> = ({
  technologicalChange = {
    technological_change_level: "N/A",
    technological_change_trend: "N/A",
    technological_change_points: [],
  }, // Default value to prevent runtime errors
}) => {
  const [areAllOpen, setAreAllOpen] = useState<boolean>(false); // Default to all closed

  const toggleAllAccordions = () => {
    setAreAllOpen(!areAllOpen); // Toggle the state: open all or close all
  };

  return (
    <div className="p-4 bg-[#171717] border rounded-xl border-[#2e2e2e] shadow-md px-10 text-gray-400 mb-20">
      <h3 className="text-2xl font-semibold my-10 text-white">
        Technological Change
      </h3>

      {/* Display technological change level and trend */}
      <div className="mb-4 flex justify-between">
        <p className="text-lg">
          <span className="font-semibold text-[#e1e1e1]">
            Technological Change Level:{" "}
          </span>
          {technologicalChange.technological_change_level}
        </p>
        <p className="text-lg">
          <span className="font-semibold text-[#e1e1e1]">Trend: </span>
          {technologicalChange.technological_change_trend}
        </p>
      </div>

      {/* Render technological change points */}
      <div className="grid grid-cols-2 gap-12">
        {technologicalChange.technological_change_points.length > 0 ? (
          technologicalChange.technological_change_points.map((point, index) => (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <h4 className="text-lg text-[#b9bbbe] font-medium">
                {point.technological_change_title}
              </h4>
              {areAllOpen && (
                <p className="mt-2 font-normal text-[#a8a8a8]">
                  {point.technological_change_description}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No technological change points available.</p>
        )}
      </div>

      {/* Show More / Show Less Button */}
      {technologicalChange.technological_change_points.length > 0 && (
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

export default TechnologicalChange;
