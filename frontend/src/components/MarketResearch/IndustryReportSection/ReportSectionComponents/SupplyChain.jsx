import React from "react";

// Subcomponent for rendering a tier section
const TierSection = ({ title, items }) => {
  return (
    <div className="border rounded-lg border-gray-600 bg-[#0D0D0D] p-4 shadow-md">
      <div className="flex">
        <div className="w-2 h-10 mr-7 bg-blue-500"></div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
      </div>
      {items.length > 0 ? (
        <ul className="mt-10">
          {items.map((item, index) => (
            <div>
              <li key={index} className="mb-1 border-b border-gray-500">
                {item}
              </li>
            </div>
          ))}
        </ul>
      ) : (
        <p>No {title} available.</p>
      )}
    </div>
  );
};

// Main SupplyChain component
const SupplyChain = ({ supplyChain }) => {
  return (
    <div className="p-6 px-52">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-400 p-20">
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
