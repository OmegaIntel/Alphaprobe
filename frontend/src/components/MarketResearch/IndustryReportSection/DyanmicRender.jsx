import React from 'react';

// Utility function to format keys
const formatKey = (key) =>
  key
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letters

// Function to handle grid display for child items
const GridContainer = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {children}
  </div>
);

// Recursive component to render the data
export const DataRenderer = ({ data }) => {
  if (Array.isArray(data)) {
    // Handle array of objects differently
    if (data.length > 0 && typeof data[0] === 'object') {
      return (
        <GridContainer>
          {data.map((item, index) => (
            <div key={index} className="p-4 text-gray-200 rounded-lg shadow-md">
              <DataRenderer data={item} />
            </div>
          ))}
        </GridContainer>
      );
    } else {
      // Render arrays as lists if they aren't an array of objects
      return (
        <ul className="list-disc ml-6 space-y-2">
          {data.map((item, index) => (
            <li key={index} className="mb-2">
              <DataRenderer data={item} />
            </li>
          ))}
        </ul>
      );
    }
  } else if (typeof data === 'object' && data !== null) {
    // Render objects as key-value pairs
    return (
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col space-y-2">
            <span className="font-semibold text-gray-400">{formatKey(key)}:</span>
            <span>
              {typeof value === 'object' ? (
                <DataRenderer data={value} />
              ) : (
                value?.toString() || 'N/A'
              )}
            </span>
          </div>
        ))}
      </div>
    );
  } else {
    // Render primitive values directly
    return <span>{data?.toString() || 'N/A'}</span>;
  }
};