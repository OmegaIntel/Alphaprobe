import React, { useState } from "react";

// Define types for the props
interface VolatilityPoint {
  volatility_title?: string;
  volatility_description?: string;
}

interface RevenueVolatilityData {
  volatility_level?: string;
  volatility_trend?: string;
  volatility_points?: VolatilityPoint[];
}

interface RevenueVolatilityProps {
  revenueVolatility?: RevenueVolatilityData;
}

const RevenueVolatility: React.FC<RevenueVolatilityProps> = ({
  revenueVolatility,
}) => {
  const [areAllOpen, setAreAllOpen] = useState<boolean>(false); // Default to open all

  // Error handling: Check if revenueVolatility is valid
  if (
    !revenueVolatility ||
    !Array.isArray(revenueVolatility.volatility_points)
  ) {
    return (
      <div className="text-red-500 text-center">
        <p>Error: Invalid revenue volatility data</p>
      </div>
    );
  }

  const toggleAllAccordions = () => {
    // Toggle the state: if any is clicked, toggle the state of all
    setAreAllOpen(!areAllOpen);
  };

  return (
    <div className="p-4 shadow-md px-10 text-gray-400 mb-20">
      <h3 className="text-2xl font-semibold my-10 text-white">
        Revenue Volatility
      </h3>

      {/* Error handling for missing volatility_level or volatility_trend */}
      {revenueVolatility.volatility_level ? (
        <div className="mb-4 flex justify-between">
          <p className="text-lg">
            <span className="font-semibold text-[#e1e1e1]">
              Volatility Level:{" "}
            </span>
            {revenueVolatility.volatility_level}
          </p>
          <p className="text-lg">
            <span className="font-semibold text-[#e1e1e1]">Trend: </span>
            {revenueVolatility.volatility_trend}
          </p>
        </div>
      ) : (
        <div className="mb-4 flex justify-between text-red-500">
          <p className="text-lg">
            Error: Missing volatility level or trend data
          </p>
        </div>
      )}

      {/* Render volatility points */}
      <div className="grid grid-cols-2 gap-12">
        {revenueVolatility.volatility_points.map((point, index) => {
          // Destructure and provide defaults for individual points
          const {
            volatility_title = "Untitled Volatility",
            volatility_description = "No description available.",
          } = point;

          return (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <div
                onClick={toggleAllAccordions} // Clicking on any title toggles all accordions
                className="flex justify-between items-center cursor-pointer"
              >
                <h4 className="text-lg text-[#b9bbbe] font-medium">
                  {volatility_title}
                </h4>
                <span className="text-lg">{areAllOpen ? "-" : "+"}</span>
              </div>
              {areAllOpen && (
                <p className="mt-2 font-normal text-[#a8a8a8]">
                  {volatility_description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RevenueVolatility;
