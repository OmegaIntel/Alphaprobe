import React from "react";

// Subcomponent for rendering a tier section
const TierSection = ({ title, items = [] }) => {
  return (
    <div className="border rounded-2xl border-[#2b5ba2] bg-[#0D0D0D] p-4 shadow-md">
      <div className="flex flex-row mx-4 mt-4 justify-start items-center">
        <div className="w-2 h-14 mr-3 bg-blue-500"></div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
      </div>
      {items && items.length > 0 ? (
        <ul className="mt-10">
          {items.map((item, index) => (
            <div key={index}>
              <li className="list-disc ml-10 space-y-2 text-[#7a7a7a] p-2">
                {item}
              </li>
            </div>
          ))}
        </ul>
      ) : (
        <div>

          <p className="ml-10 space-y-2 text-[#7a7a7a] p-2">No {title} available.</p>
        </div>
      )}
    </div>
  );
};

// Main SupplyChain component
const SupplyChain = ({ supplyChain }) => {
  return (
    <div className="p-6 px-">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-32 text-gray-400 p-20">
        <TierSection title="Tier 1 Buyers" items={supplyChain.tier_1_buyers} />
        <TierSection
          title="Tier 1 Suppliers"
          items={supplyChain.tier_1_suppliers}
        />
        <TierSection title="Tier 2 Buyers" items={supplyChain.tier_2_buyers} />
        <TierSection
          title="Tier 2 Suppliers"
          items={supplyChain.tier_2_suppliers}
        />
      </div>
    </div>
  );
};

export default SupplyChain;
