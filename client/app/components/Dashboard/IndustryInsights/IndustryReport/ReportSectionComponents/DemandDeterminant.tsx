import { useState } from "react";

interface Determinant {
  determinant_title?: string; // Optional title
  determinant_description?: string; // Optional description
}

interface DemandDeterminantsProps {
  demandDeterminants?: Determinant[]; // Allow undefined
}

export function DemandDeterminants({
  demandDeterminants = [], // Provide a default empty array if undefined
}: DemandDeterminantsProps) {
  const [allOpen, setAllOpen] = useState<boolean>(false);

  const toggleAllAccordions = (): void => {
    setAllOpen(!allOpen);
  };

  return (
    <div className="bg-[#171717] border rounded-xl border-[#2e2e2e] p-4 px-10 shadow-md text-gray-400">
      <h3 className="text-2xl font-semibold mb-4 text-white">
        Demand Determinants
      </h3>

      {demandDeterminants.length > 0 ? (
        <div className="grid grid-cols-2 gap-12">
          {demandDeterminants.map((determinant, index) => (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <h4 className="text-lg text-[#b9bbbe] font-medium">
                {determinant.determinant_title || "Untitled Determinant"}
              </h4>
              {allOpen && (
                <p className="mt-2 font-normal text-[#a8a8a8]">
                  {determinant.determinant_description ||
                    "No description available."}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No demand determinants available.</p>
      )}

      {demandDeterminants.length > 0 && (
        <button
          onClick={toggleAllAccordions}
          className="mt-4 w-full sm:w-1/5 bg-[#1d2a41] text-white border-2 border-[#404040] py-2 rounded-full font-medium hover:bg-gray-600 transition duration-200"
        >
          {allOpen ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
}

export default DemandDeterminants;
