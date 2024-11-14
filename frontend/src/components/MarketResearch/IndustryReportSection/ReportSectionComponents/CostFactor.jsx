import React, { useState } from "react";

const CostFactors = ({ costFactors = [] }) => {
  const [openIndex, setOpenIndex] = useState(null);

  // Ensures costFactors is an array, defaulting to an empty array if undefined or incorrect type
  const validatedCostFactors = Array.isArray(costFactors) ? costFactors : [];

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400">
      <h3 className="text-xl font-semibold mb-4">Cost Factors</h3>

      <div className="space-y-4">
        {validatedCostFactors.length > 0 ? (
          validatedCostFactors.map((factor, index) => (
            <div
              key={index}
              className="rounded-lg p-3 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 shadow-sm"
            >
              <div
                onClick={() => toggleAccordion(index)}
                className="flex justify-between items-center cursor-pointer"
              >
                <h4 className="font-semibold text-lg">{factor.cost_factor_title || "Untitled Factor"}</h4>
                {/* <span className="text-lg">{openIndex === index ? "-" : "+"}</span> */}
              </div>
              {openIndex === index && (
                <p className="mt-2 text-gray-300">{factor.cost_factor_description || "No description available."}</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No cost factors available.</p>
        )}
      </div>
    </div>
  );
};

export default CostFactors;
