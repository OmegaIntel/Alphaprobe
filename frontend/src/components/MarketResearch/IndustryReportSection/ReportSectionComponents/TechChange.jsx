import React, { useState } from "react";

const TechnologicalChange = ({ technologicalChange }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="p-4 shadow-md px-10 text-gray-400 mb-20">
      <h3 className="text-2xl font-semibold my-10  text-white">Technological Change</h3>

      <div className="mb-4 flex justify-between">
        <p className="text-lg">
          <span className="font-semibold text-[#e1e1e1]">Technological Change Level: </span>
          {technologicalChange.technological_change_level}
        </p>
        <p className="text-lg">
          <span className="font-semibold text-[#e1e1e1]">Trend: </span>
          {technologicalChange.technological_change_trend}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-12">
        {technologicalChange.technological_change_points.map((point, index) => (
          <div
            key={index}
            className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6  shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
          >
            <div
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h4 className="text-lg text-[#b9bbbe] font-medium">{point.technological_change_title}</h4>
              <span className="text-lg">{openIndex === index ? "-" : "+"}</span>
            </div>
            {openIndex === index && (
              <p className="mt-2 font-normal text-[#a8a8a8]">{point.technological_change_description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechnologicalChange;
