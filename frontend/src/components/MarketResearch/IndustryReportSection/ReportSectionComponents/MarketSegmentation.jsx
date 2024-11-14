import React from "react";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";

const MarketSegmentation = ({ marketSegmentation }) => {
  // Error handling: Check if marketSegmentation is valid and is an array
  if (!Array.isArray(marketSegmentation)) {
    return (
      <div className="text-red-500 text-center">
        <p>Error: Invalid market segmentation data</p>
      </div>
    );
  }

  // If marketSegmentation is empty
  if (marketSegmentation.length === 0) {
    return (
      <div className="text-yellow-500 text-center">
        <p>No data available for market segmentation.</p>
      </div>
    );
  }

  // Error handling for missing or invalid data in marketSegmentation
  const hasInvalidData = marketSegmentation.some(
    (segment) =>
      typeof segment.segment_percentage !== "number" ||
      segment.segment_percentage < 0 ||
      segment.segment_percentage > 100
  );

  if (hasInvalidData) {
    return (
      <div className="text-red-500 text-center">
        <p>Error: One or more segments have invalid data (percentage must be a number between 0 and 100).</p>
      </div>
    );
  }

  // Calculate the total percentage of provided segments
  const totalPercentage = marketSegmentation.reduce(
    (sum, segment) => sum + segment.segment_percentage,
    0
  );

  // Check if "Others" is already included in the data
  const hasOthers = marketSegmentation.some(
    (segment) => segment.segment.toLowerCase() === "others"
  );

  // Add "Others" segment if total is less than 100% and "Others" is not already present
  const updatedSegments =
    totalPercentage < 100 && !hasOthers
      ? [
          ...marketSegmentation,
          {
            segment: "Others",
            segment_percentage: 100 - totalPercentage,
            segment_description: "Other market segments",
          },
        ]
      : marketSegmentation;

  // Prepare data for the donut chart
  const chartData = {
    labels: updatedSegments.map((segment) => segment.segment),
    datasets: [
      {
        data: updatedSegments.map((segment) => segment.segment_percentage),
        backgroundColor: [
          "#4CAF50", "#FF9800", "#2196F3", "#9C27B0",
          "#64B5F6", "#CE93D8", "#388E3C", "#F57C00", 
          "#1E88E5", "#8E24AA"
        ],
        borderWidth: 0.5,
      },
    ],
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-300 ">
      <div className="flex flex-col-reverse sm:flex-row sm:space-x-8 items-center">
        {/* Segment Details */}
        <div className="bg-[#1b1b1b] border border-[#2e2e2e] rounded-xl p-5">
          <ul className="space-y-4 text-sm text-gray-300 flex-1">
            {updatedSegments.map((segment, index) => (
              <li key={index} className="rounded-lg p-4 flex items-start space-x-2">
                {/* Color Indicator */}
                <span
                  className="w-4 h-6"
                  style={{
                    backgroundColor: chartData.datasets[0].backgroundColor[index],
                  }}
                ></span>
                {/* Segment Details */}
                <div>
                  <h4 className="text-lg font-semibold">{segment.segment}</h4>
                  <p className="text-[#a8a8a8]">{segment.segment_description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {/* Donut Chart */}
        <div className="w-96 h-96 mb-6 sm:mb-0">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "50%",
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.label}: ${context.raw.toFixed(2)}%`,
                  },
                },
                legend: {
                  position: "bottom",
                  labels: {
                    color: "#fff",
                    padding: 20, // Add margin around each legend label
                    boxWidth: 20, // Width of color box next to label
                    boxHeight: 15,
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarketSegmentation;
