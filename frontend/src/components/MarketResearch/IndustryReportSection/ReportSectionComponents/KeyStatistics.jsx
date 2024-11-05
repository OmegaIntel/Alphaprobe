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
      <div className="w-72">
        <div className="mb-4 w-full mx-2  rounded-lg flex bg-gray-500/20">
          <div className="w-2 h-14 bg-blue-500"></div>
          <div className="px-3">
            <h4 className="font-semibold text-gray-400">Revenue</h4>
            <p>
              <strong className="text-gray-300">
                {formatCurrency(statistics.revenue.revenue_dollars)}
              </strong>
            </p>
          </div>
          {/* <p>
            CAGR (2005-2024):{" "}
            <strong className="text-green-500">
              {statistics.revenue.revenue_cagr_historical.revenue_cagr_value}%
            </strong>
          </p> */}
          {/* <p>
            Projected CAGR (2024-2030):{" "}
            <strong className="text-green-500">
              {statistics.revenue.revenue_cagr_projected.revenue_cagr_value}%
            </strong>
          </p> */}
        </div>
        <div className="mb-4 w-full mx-2  rounded-lg flex bg-gray-500/20">
          <div className="w-2 h-14 bg-blue-500"></div>
          <div className="px-3" >
            <p className="text-gray-400 flex flex-col">
              Historical CAGR (2005-2024):{" "}
              <strong className="text-gray-300">
                {statistics.revenue.revenue_cagr_historical.revenue_cagr_value}%
              </strong>
            </p>
          </div>
        </div>
        <div className="mb-4 w-full mx-2 rounded-lg flex bg-gray-500/20">
        <div className="w-2 h-14 bg-blue-500">

        </div>
        <div className="px-3">
          <p className="text-gray-400 flex flex-col">
            Projected CAGR (2024-2030):{" "}
            <strong className="text-gray-300">
              {statistics.revenue.revenue_cagr_projected.revenue_cagr_value}%
            </strong>
          </p>
        </div>
        </div>
        <div className="mb-4 w-full mx-2 rounded-lg flex bg-gray-500/20">
          {/* <h4 className="font-semibold">Profit Margins</h4> */}
          <div className="w-2 h-14 bg-blue-500">
          </div>
          <div className="px-3">
            <p className="text-gray-400 flex flex-col">
              Profit Margin {" "}
              <strong className="text-gray-300">
                {statistics.profit_margins.profit_margins_percentage}%
              </strong>
            </p>
            {/* <p>
          CAGR (2005-2024): <strong className="text-green-500">{statistics.profit_margins.profit_margins_cagr_historical.profit_margins_cagr_value}%</strong>
        </p> */}
          </div>
        </div>
      </div>

      {/* <div className="mb-4">
        <h4 className="font-semibold text-xl text-gray-400 my-10">Industry Overview</h4>
        <div className="flex gap-5">
        <p className="p-4 bg-gray-400/20 w-60 rounded-lg font-semibold">Enterprises: <strong  className="text-green-500">{statistics.enterprises}</strong></p>
        <p className="p-4 bg-gray-400/20 w-60 rounded-lg font-semibold">Establishments: <strong className="text-green-500">{statistics.establishments}</strong></p>
        <p className="p-4 bg-gray-400/20 w-60 rounded-lg font-semibold">Employees: <strong className="text-green-500">{statistics.employees}</strong></p>
        <p className="p-4 bg-gray-400/20 w-60 rounded-lg font-semibold">Wages: <strong className="text-green-500">{formatCurrency(statistics.wages)}</strong></p>
        <p className="p-4 bg-gray-400/20 w-60 rounded-lg font-semibold">Value Added: <strong className="text-green-500">{formatCurrency(statistics.industry_value_added)}</strong></p>
        <p className="p-4 bg-gray-400/20 w-60 rounded-lg font-semibold">Imports: <strong className="text-green-500">{formatCurrency(statistics.imports)}</strong></p>
        <p className="p-4 bg-gray-400/20 w-60 rounded-lg font-semibold">Exports: <strong className="text-green-500">{formatCurrency(statistics.exports)}</strong></p>
        </div>
      </div> */}
    </div>
  );
};

export default KeyStatistics;
