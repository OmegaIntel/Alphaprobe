import React from "react";

const KeyTrends = ({ keyTrends }) => {
  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400">
      <h3 className="text-xl font-semibold mb-4">Key Trends</h3>

      <ul className="list-disc list-inside space-y-2">
        {keyTrends.map((trend, index) => (
          <li key={index} className="text-gray-300">
            {trend}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KeyTrends;
