import React, { useState } from "react";

const CostFactors = ({ costFactors }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400">
      <h3 className="text-xl font-semibold mb-4">Cost Factors</h3>

      <div className="space-y-4">
        {costFactors.map((factor, index) => (
          <div
            key={index}
            className="rounded-lg p-3 bg-gray-300/20 shadow-sm"
          >
            <div
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h4 className="font-semibold text-lg">{factor.cost_factor_title}</h4>
              {/* <span className="text-lg">{openIndex === index ? "-" : "+"}</span> */}
            </div>
            {openIndex === index && (
              <p className="mt-2 text-gray-300">{factor.cost_factor_description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostFactors;
