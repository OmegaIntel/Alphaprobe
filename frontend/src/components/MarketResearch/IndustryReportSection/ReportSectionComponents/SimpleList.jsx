import React, { useState } from "react";

const IndustryDetail = ({ data, title, levelKey, trendKey, pointsKey, defaultVisiblePoints = 3 }) => {
  // Extract relevant data keys dynamically
  const level = data[levelKey];
  const trend = data[trendKey];
  const points = data[pointsKey] || [];

  const [expanded, setExpanded] = useState(false); // Controls the expand all accordions state
  const [showAllPoints, setShowAllPoints] = useState(false); // Controls "Show More" button

  // Toggle all accordions open/close
  const handleExpandAll = () => setExpanded(!expanded);

  // Toggle show more points
  const handleShowMore = () => setShowAllPoints(!showAllPoints);

  // Points to display based on "Show More" button state
  const visiblePoints = showAllPoints ? points : points.slice(0, defaultVisiblePoints);

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-300 mb-6">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>

      {/* Level and Trend Display */}
      <div className="mb-4">
        <p>
          <strong>Level:</strong> {level || "N/A"}
        </p>
        <p>
          <strong>Trend:</strong> {trend || "N/A"}
        </p>
      </div>

      {/* Expand All Button */}
      <button
        className="bg-blue-500 text-white rounded px-4 py-2 mb-4"
        onClick={handleExpandAll}
      >
        {expanded ? "Collapse All" : "Expand All"}
      </button>

      {/* Points Section with Accordion */}
      <ul className="space-y-4 text-sm text-gray-300">
        {visiblePoints.map((point, index) => (
          <li key={index} className="rounded-lg p-4 bg-gray-300/20">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold">{point[`${pointsKey.slice(0, -1)}_title`]}</h4>
              <button
                className="text-blue-400"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Hide" : "Show"}
              </button>
            </div>
            {/* Conditionally show content based on expand state */}
            {expanded && (
              <p className="text-gray-200 mt-2">
                {point[`${pointsKey.slice(0, -1)}_description`]}
              </p>
            )}
          </li>
        ))}
      </ul>

      {/* Show More Button if there are more points than defaultVisiblePoints */}
      {points.length > defaultVisiblePoints && (
        <button
          className="bg-green-500 text-white rounded px-4 py-2 mt-4"
          onClick={handleShowMore}
        >
          {showAllPoints ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
};

export default IndustryDetail;
