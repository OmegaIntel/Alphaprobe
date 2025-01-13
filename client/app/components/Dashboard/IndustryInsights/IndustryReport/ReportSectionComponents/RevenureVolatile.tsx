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
  const [areAllOpen, setAreAllOpen] = useState<boolean>(false); // Default to all closed

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
    setAreAllOpen(!areAllOpen);
  };

  return (
    <div className="p-4 bg-[#171717] border rounded-xl border-[#2e2e2e] shadow-md px-10 text-gray-400 mb-20">
      <h3 className="text-2xl font-semibold my-10 text-white">
        Revenue Volatility
      </h3>

      {/* Volatility Level and Trend */}
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
        <div className="mb-4 text-red-500">
          <p>Error: Missing volatility level or trend data</p>
        </div>
      )}

      {/* Render Volatility Points */}
      <div className="grid grid-cols-2 gap-12">
        {revenueVolatility.volatility_points.map((point, index) => {
          const {
            volatility_title = "Untitled Volatility",
            volatility_description = "No description available.",
          } = point;

          return (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <h4 className="text-lg text-[#b9bbbe] font-medium">
                {volatility_title}
              </h4>
              {areAllOpen && (
                <p className="mt-2 font-normal text-[#a8a8a8]">
                  {volatility_description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Show More / Show Less Button */}
      {revenueVolatility.volatility_points.length > 0 && (
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

export default RevenueVolatility;
