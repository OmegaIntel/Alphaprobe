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
    <div className="rounded-lg p-4 px-10 shadow-md text-gray-400">
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
              <div
                onClick={toggleAllAccordions}
                className="flex justify-between items-center cursor-pointer"
              >
                <h4 className="text-lg text-[#b9bbbe] font-medium">
                  {determinant.determinant_title || "Untitled Determinant"}
                </h4>
                <span className="text-lg">{allOpen ? "-" : "+"}</span>
              </div>
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
    </div>
  );
}

export default DemandDeterminants;
