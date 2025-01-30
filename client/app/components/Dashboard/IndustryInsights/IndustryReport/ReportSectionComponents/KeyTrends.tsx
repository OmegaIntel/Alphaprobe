import React, { useState } from "react";

// Define props type
interface KeyTrendsProps {
  keyTrends?: string[]; // Optional array of strings
}

const KeyTrends: React.FC<KeyTrendsProps> = ({ keyTrends }) => {
  const initialVisibleTrends = 4; // Number of trends to display initially
  const [visibleTrends, setVisibleTrends] = useState<number>(initialVisibleTrends);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const showMore = () => {
    setVisibleTrends(keyTrends?.length || 0); // Show all trends
    setIsExpanded(true);
  };

  const showLess = () => {
    setVisibleTrends(initialVisibleTrends); // Show only initial trends
    setIsExpanded(false);
  };

  // Ensure that keyTrends is defined and not empty
  if (!keyTrends || keyTrends.length === 0) {
    return <p className="text-gray-400">No key trends available.</p>;
  }

  return (
    <div>
      <div className="gap-6 text-gray-400">
        {keyTrends.slice(0, visibleTrends).map((trend, index) => (
          <div
            key={index} // Ideally use a unique identifier here if available
            className="mt-3 list-disc list-item shadow-md hover:shadow-lg transition duration-200"
          >
            <p className="text-gray-400 font-normal">{trend}</p>
          </div>
        ))}
      </div>

      {keyTrends.length > initialVisibleTrends && (
        <div className="flex justify-center">
          <button
            onClick={isExpanded ? showLess : showMore}
            className="mt-12 mb-6 w-full sm:w-1/5 bg-[#1d2a41] text-white border-2 border-[#404040] py-2 rounded-full font-medium hover:bg-gray-600 transition duration-200"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default KeyTrends;
