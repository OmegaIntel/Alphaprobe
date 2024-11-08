import React, { useState } from "react";

const DemandDeterminants = ({ demandDeterminants }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-lg p-4 px-10 shadow-md text-gray-400">
      <h3 className="text-2xl font-semibold mb-4 text-white">Demand Determinants</h3>

      <div className="grid grid-cols-2 gap-12">
        {demandDeterminants.map((determinant, index) => (
          <div
            key={index}
            className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6  shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
          >
            <div
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h4 className="text-lg text-[#b9bbbe] font-medium">{determinant.determinant_title}</h4>
              <span className="text-lg">{openIndex === index ? "-" : "+"}</span>
            </div>
            {openIndex === index && (
              <p className="mt-2 font-normal text-[#a8a8a8]">{determinant.determinant_description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemandDeterminants;
