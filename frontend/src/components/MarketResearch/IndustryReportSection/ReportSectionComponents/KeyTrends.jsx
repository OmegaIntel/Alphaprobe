import React, { useState } from "react";

const KeyTrends = ({ keyTrends }) => {
  const initialVisibleTrends = 4; // Number of trends to display initially
  const [visibleTrends, setVisibleTrends] = useState(initialVisibleTrends);
  const [isExpanded, setIsExpanded] = useState(false);

  const showMore = () => {
    setVisibleTrends(keyTrends.length);
    setIsExpanded(true);
  };

  const showLess = () => {
    setVisibleTrends(initialVisibleTrends);
    setIsExpanded(false);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-6 text-gray-400">
        {keyTrends.slice(0, visibleTrends).map((trend, index) => (
          <div
            key={index}
            className="border border-gray-600 rounded-lg p-4 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
          >
            <p className="text-gray-300 hover:text-white">{trend}</p>
          </div>
        ))}
      </div>

      {keyTrends.length > initialVisibleTrends && (
        <button
          onClick={isExpanded ? showLess : showMore}
          className="mt-4 w-full bg-gray-700 text-white py-2 rounded-md font-semibold hover:bg-gray-600 transition duration-200"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
};

export default KeyTrends;
