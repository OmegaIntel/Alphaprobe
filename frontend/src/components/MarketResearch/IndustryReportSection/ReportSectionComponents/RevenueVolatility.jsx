import React, { useState } from "react";

const RevenueVolatility = ({ revenueVolatility }) => {
  const [openIndex, setOpenIndex] = useState(null);

  // Error handling: Check if revenueVolatility is valid
  if (!revenueVolatility || !revenueVolatility.volatility_points || !Array.isArray(revenueVolatility.volatility_points)) {
    return (
      <div className="text-red-500 text-center">
        <p>Error: Invalid revenue volatility data</p>
      </div>
    );
  }

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="p-4 shadow-md px-10 text-gray-400 mb-20">
      <h3 className="text-2xl font-semibold my-10 text-white">Revenue Volatility</h3>

      {/* Error handling for missing volatility_level or volatility_trend */}
      {revenueVolatility.volatility_level ? (
        <div className="mb-4 flex justify-between">
          <p className="text-lg">
            <span className="font-semibold text-[#e1e1e1]">Volatility Level: </span>
            {revenueVolatility.volatility_level}
          </p>
          <p className="text-lg">
            <span className="font-semibold text-[#e1e1e1]">Trend: </span>
            {revenueVolatility.volatility_trend}
          </p>
        </div>
      ) : (
        <div className="mb-4 flex justify-between text-red-500">
          <p className="text-lg">Error: Missing volatility level or trend data</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-12">
        {revenueVolatility.volatility_points.map((point, index) => {
          // Error handling: Check if volatility point has required fields
          if (!point.volatility_title || !point.volatility_description) {
            return (
              <div key={index} className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md">
                <p className="text-red-500">Error: Missing volatility title or description</p>
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
                <h4 className="text-lg text-[#b9bbbe] font-medium">{point.volatility_title}</h4>
                <span className="text-lg">{openIndex === index ? "-" : "+"}</span>
              </div>
              {openIndex === index && (
                <p className="mt-2 font-normal text-[#a8a8a8]">{point.volatility_description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RevenueVolatility;
