import React, { useState } from "react";

const DemandDeterminants = ({ demandDeterminants = [] }) => {
  const [allOpen, setAllOpen] = useState(false); // Track whether all accordions are open

  // Ensure demandDeterminants is an array, fallback to an empty array if undefined or incorrect type
  const determinantsData = Array.isArray(demandDeterminants) ? demandDeterminants : [];

  // Toggle all accordions
  const toggleAllAccordions = () => {
    setAllOpen(!allOpen);
  };

  return (
    <div className="rounded-lg p-4 px-10 shadow-md text-gray-400">
      <h3 className="text-2xl font-semibold mb-4 text-white">Demand Determinants</h3>

      {determinantsData.length > 0 ? (
        <div className="grid grid-cols-2 gap-12">
          {determinantsData.map((determinant, index) => (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <div
                onClick={toggleAllAccordions} // Toggle all accordions when clicked
                className="flex justify-between items-center cursor-pointer"
              >
                <h4 className="text-lg text-[#b9bbbe] font-medium">
                  {determinant.determinant_title || "Untitled Determinant"}
                </h4>
                <span className="text-lg">{allOpen ? "-" : "+"}</span>
              </div>
              {allOpen && (
                <p className="mt-2 font-normal text-[#a8a8a8]">
                  {determinant.determinant_description || "No description available."}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No demand determinants available.</p>
      )}
    </div>
  );
};

export default DemandDeterminants;
