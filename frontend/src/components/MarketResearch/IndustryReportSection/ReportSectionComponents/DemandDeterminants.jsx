import React, { useState } from "react";

const DemandDeterminants = ({ demandDeterminants }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400">
      <h3 className="text-xl font-semibold mb-4 text-white">Demand Determinants</h3>

      <div className="space-y-4">
        {demandDeterminants.map((determinant, index) => (
          <div
            key={index}
            className="rounded-lg p-3 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 shadow-sm hover:bg-gray-400/20"
          >
            <div
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h4 className="font-semibold text-lg">{determinant.determinant_title}</h4>
              {/* <span className="text-lg">{openIndex === index ? "-" : "+"}</span> */}
            </div>
            {openIndex === index && (
              <p className="mt-2 text-gray-300">{determinant.determinant_description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemandDeterminants;
