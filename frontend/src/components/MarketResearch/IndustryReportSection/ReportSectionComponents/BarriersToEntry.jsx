import React, { useState } from "react";

const BarriersToEntryComponent = ({ barriersToEntry }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400 bg-gray-600/20">
      <h3 className="text-xl font-semibold mb-4">Barriers to Entry</h3>

      <div className="mb-4 flex justify-between">
        <p className="text-lg">
          <span className="font-semibold">Barriers Level: </span>
          {barriersToEntry.barriers_level}
        </p>
        <p className="text-lg">
          <span className="font-semibold">Trend: </span>
          {barriersToEntry.barriers_trend}
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-lg mb-2">Barrier Points</h4>
        {barriersToEntry.barriers_points.map((point, index) => (
          <div
            key={index}
            className="rounded-lg p-3 bg-gray-300/20 shadow-sm"
          >
            <div
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h5 className="font-semibold">{point.barrier_title}</h5>
              {/* Icon toggle: uncomment if needed */}
              {/* <span className="text-lg">{openIndex === index ? "-" : "+"}</span> */}
            </div>
            {openIndex === index && (
              <p className="mt-2 text-gray-300">{point.barrier_description}</p>
            )}
          </div>
        ))}
      </div>

<div className="flex justify-around my-10">

      <div className="mt-6 w-[30rem] bg-gray-700/30 p-3 rounded-lg">
        <h4 className="font-semibold text-xl mb-2">Factors Increasing Barriers</h4>
        <ul className="list-disc ml-6 space-y-2 text-gray-300">
          {barriersToEntry.factors_increased_barrier.map((factor, index) => (
            <li key={index}>{factor}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 w-[30rem] bg-gray-700/30 p-3 rounded-lg">
        <h4 className="font-semibold text-xl mb-2">Factors Decreasing Barriers</h4>
        <ul className="list-disc ml-6 space-y-2 text-gray-300">
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