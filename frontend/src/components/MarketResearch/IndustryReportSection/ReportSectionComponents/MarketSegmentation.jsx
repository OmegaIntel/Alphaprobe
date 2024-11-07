import React from "react";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";

const MarketSegmentation = ({ marketSegmentation }) => {
  // Prepare data for the single donut chart
  const chartData = {
    labels: marketSegmentation.map((segment) => segment.segment),
    datasets: [
      {
        data: marketSegmentation.map((segment) => segment.segment_percentage),
        backgroundColor: ["#4CAF50", "#FF9800", "#2196F3", "#9C27B0"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="rounded-lg p-4  shadow-md text-gray-300">
      <div className="flex flex-col-reverse sm:flex-row sm:space-x-8 items-center">
        {/* Segment Details */}
        <ul className="space-y-4 text-sm text-gray-300 flex-1">
          {marketSegmentation.map((segment, index) => (
            <li key={index} className="rounded-lg p-4 flex items-start space-x-2">
              {/* Color Indicator */}
              <span
                className="w-4 h-6 "
                style={{ backgroundColor: chartData.datasets[0].backgroundColor[index] }}
              ></span>
              {/* Segment Details */}
              <div>
                <h4 className="text-lg font-semibold">{segment.segment}</h4>
                <p className="text-gray-200">{segment.segment_description}</p>
                {/* <p className="mt-2 text-green-500 font-semibold">
                  {segment.segment_percentage}% of Market
                </p> */}
              </div>
            </li>
          ))}
        </ul>
        {/* Donut Chart */}
        <div className="w-96 h-96 mb-6 sm:mb-0">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "70%",
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.label}: ${context.raw}%`,
                  },
                },
                legend: {
                  position: "bottom",
                  labels: {
                    color: "#fff",
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
