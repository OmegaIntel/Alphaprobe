import React from "react";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";

const MarketShareConcentration = ({ concentrationData = {} }) => {
  // Set default values for top_companies and concentration_points if undefined
  const {
    concentration_level = "N/A",
    concentration_trend = "N/A",
    concentration_points = [],
    top_companies = [],
  } = concentrationData;

  // Prepare data for the donut chart for top companies
  const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];
  const chartData = {
    labels: top_companies.map((company) => company.company_name),
    datasets: [
      {
        data: top_companies.map((company) => company.company_percentage),
        backgroundColor: colors,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-300">
      <h3 className="text-2xl font-semibold mb-4 text-white">Market Share Concentration</h3>

      <div className="mb-6 flex justify-between my-10">
        <p>
          <strong className="text-[#e1e1e1]">Concentration Level:</strong> {concentration_level}
        </p>
        <p>
          <strong className="text-[#e1e1e1]">Concentration Trend:</strong> {concentration_trend}
        </p>
      </div>

      {/* Concentration Points */}
      <div className="bg-[#1b1b1b] border border-[#2e2e2e] rounded-xl p-5">

      <ul className="space-y-4 text-sm text-gray-300">
        {concentration_points.map((point, index) => (
          <li key={index} className="p-4">
            <h4 className="text-lg font-semibold">
              {point.concentration_title}
            </h4>
            <p className="text-[#a8a8a8]">{point.concentration_description}</p>
          </li>
        ))}
      </ul>
      </div>
     <div className="mt-20 p-5">

      <h4 className="text-2xl font-semibold text-white">Key Players</h4>
      {/* Leading Companies Section */}
      <div className="flex flex-col-reverse sm:flex-row sm:space-x-8 items-start my-6 pt-10 ">        
          {/* Donut Chart */}
          <div className="w-80 h-80 mt-10 sm:mt-0 mr-40 ">
            <Doughnut
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "50%",
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.label}: ${context.raw}%`,
                    },
                  },
                  legend: {
                    display: false, // Hide legend to keep the chart compact
                  },
                },
              }}
            />
          </div>
          
          {/* Company List */}
          <div className="flex-1 space-y-4 bg-[#1b1b1b] border border-[#2e2e2e] rounded-xl p-5 ml-10">
            <ul className="space-y-2 text-sm text-gray-300">
              {top_companies.map((company, index) => (
                <li
                  key={index}
                  className="rounded-lg p-4 flex items-start space-x-2"
                >
                  {/* Color Box */}
                  <span
                    className="w-4 h-4 mr-2 rounded"
                    style={{ backgroundColor: colors[index % colors.length] }} // Ensure it cycles if there are more companies than colors
                  ></span>
                  <span>{company.company_name}</span>
                  {/* <span className="font-semibold text-green-500 ml-auto">
                  {company.company_percentage}%
                </span> */}
                </li>
              ))}
            </ul>
          </div>
          
       
      </div>
     </div>

    </div>
  );
};

export default MarketShareConcentration;
