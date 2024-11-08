import React, { useState } from "react";

const BarriersToEntryComponent = ({ barriersToEntry }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400 bg-[#171717] border border-[#2e2e2e] px-10 ">
      <h3 className="text-2xl font-semibold mb-4 text-white">Barriers to Entry</h3>

      <div className="mb-4 flex justify-between">
        <p className="text-lg">
          <span className="font-semibold text-[#e1e1e1]">Barriers Level: </span>
          {barriersToEntry.barriers_level}
        </p>
        <p className="text-lg">
          <span className="font-semibold text-[#b8bbbe]">Trend: </span>
          {barriersToEntry.barriers_trend}
        </p>
      </div>

      <h4 className="font-semibold text-lg mb-2 text-[#e1e1e1]">Barrier Points</h4>
      <div className="grid grid-cols-2 gap-12">
        {barriersToEntry.barriers_points.map((point, index) => (
          <div key={index} className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6  shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200 ">
            <div
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h5 className="text-lg text-[#b9bbbe] font-medium">{point.barrier_title}</h5>
              {/* Icon toggle: uncomment if needed */}
              <span className="text-lg">{openIndex === index ? "-" : "+"}</span>
            </div>
            {openIndex === index && (
              <p className="mt-2 font-normal text-[#a8a8a8]">{point.barrier_description}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-around my-10">
        <div className="mt-6 w-[30rem] border-[#2b5ba2] border bg-[#0D0D0D] p-3 rounded-2xl">
          <div className="flex flex-row mx-4 mt-4 justify-start items-center">
          <div className="w-2 h-14 mr-3  bg-blue-500"></div>
          <h4 className="font-semibold text-xl mb-2">
            Factors Increasing Barriers
          </h4>
          </div>
          <ul className="list-disc ml-10 space-y-2 text-[#7a7a7a]  p-2">
            {barriersToEntry.factors_increased_barrier.map((factor, index) => (
              <li key={index}>{factor}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 w-[30rem] border border-[#2b5ba2] bg-[#0D0D0D] p-3 rounded-2xl">
          <div className="flex flex-row mx-4 mt-4 justify-start items-center">
          <div className="w-2 h-14 mr-3  bg-blue-500"></div>
          <h4 className="font-semibold text-xl mb-2">
            Factors Decreasing Barriers
          </h4>
          </div>
          <ul className="list-disc ml-10 space-y-2 text-[#7a7a7a] p-2">
            {barriersToEntry.factors_decreased_barrier.map((factor, index) => (
              <li key={index}>{factor}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BarriersToEntryComponent;
