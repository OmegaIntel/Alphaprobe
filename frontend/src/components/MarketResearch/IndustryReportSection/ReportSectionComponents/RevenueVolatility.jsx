import React, { useState } from "react";

const RevenueVolatility = ({ revenueVolatility }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400">
      <h3 className="text-xl font-semibold mb-4 text-white">Revenue Volatility</h3>

      <div className="mb-4 flex justify-between">
        <p className="text-lg">
          <span className="font-semibold">Volatility Level: </span>
          {revenueVolatility.volatility_level}
        </p>
        <p className="text-lg">
          <span className="font-semibold">Trend: </span>
          {revenueVolatility.volatility_trend}
        </p>
      </div>

      <div className="space-y-4">
        {revenueVolatility.volatility_points.map((point, index) => (
          <div
            key={index}
            className=" rounded-lg p-3 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 shadow-sm hover:bg-gray-400/20"
          >
            <div
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h4 className="font-semibold text-lg">{point.volatility_title}</h4>
              {/* <span className="text-lg">{openIndex === index ? "-" : "+"}</span> */}
            </div>
            {openIndex === index && (
              <p className="mt-2 text-gray-300">{point.volatility_description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueVolatility;
