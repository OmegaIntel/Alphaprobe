import React from "react";

// Utility function to format numbers with suffixes
const formatCurrency = (value) => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toLocaleString()}`;
};

const KeyStatistics = ({ statistics }) => {
  return (
    <div className="rounded-lg p-4 shadow-md text-lg text-gray-300">
      <div className="w-full">
        {/* Revenue */}
        <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
          <div className="w-2 h-14 bg-blue-500"></div>
          <div className="px-3">
            <h4 className="font-semibold text-gray-400 text-base sm:text-lg md:text-xl">Revenue</h4>
            <p>
              <strong className="text-gray-300 text-sm sm:text-lg md:text-xl xl:text-lg">
                {formatCurrency(statistics?.revenue?.revenue_dollars || 0)}
              </strong>
            </p>
          </div>
        </div>

        {/* Historical CAGR */}
        <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
          <div className="w-2 h-14 bg-blue-500"></div>
          <div className="px-3">
            <p className="text-gray-400 flex flex-col text-sm sm:text-base md:text-lg">
              Historical CAGR (2005-2024){" "}
              <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                {statistics?.revenue?.revenue_cagr_historical?.revenue_cagr_value ?? "N/A"}%
              </strong>
            </p>
          </div>
        </div>

        {/* Projected CAGR */}
        <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
          <div className="w-2 h-14 bg-blue-500"></div>
          <div className="px-3">
            <p className="text-gray-400 flex flex-col text-sm sm:text-base md:text-lg">
              Projected CAGR (2024-2030){" "}
              <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                {statistics?.revenue?.revenue_cagr_projected?.revenue_cagr_value ?? "N/A"}%
              </strong>
            </p>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
          <div className="w-2 h-14 bg-blue-500"></div>
          <div className="px-3">
            <p className="text-gray-400 flex flex-col text-sm sm:text-base md:text-lg">
              Profit Margin{" "}
              <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                {statistics?.profit_margins?.profit_margins_percentage ?? "N/A"}%
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyStatistics;
