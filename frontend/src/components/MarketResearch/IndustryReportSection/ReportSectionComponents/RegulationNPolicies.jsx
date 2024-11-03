import React, { useState } from "react";

const RegulationsAndPolicies = ({ regulations }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400">
      <h3 className="text-xl font-semibold mb-4">Regulations and Policies</h3>

      <div className="mb-4 flex justify-between">
        <p className="text-lg">
          <span className="font-semibold">Regulation Level: </span>
          {regulations.regulations_level}
        </p>
        <p className="text-lg">
          <span className="font-semibold">Trend: </span>
          {regulations.regulations_trend}
        </p>
      </div>

      <div className="space-y-4">
        {regulations.regulations_points.map((point, index) => (
          <div
            key={index}
            className=" rounded-lg p-3 bg-gray-300/20 shadow-sm"
          >
            <div
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h4 className="font-semibold text-lg">{point.regulation_title}</h4>
              {/* <span className="text-lg">{openIndex === index ? "-" : "+"}</span> */}
            </div>
            {openIndex === index && (
              <p className="mt-2 text-gray-300">{point.regulation_description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegulationsAndPolicies;
