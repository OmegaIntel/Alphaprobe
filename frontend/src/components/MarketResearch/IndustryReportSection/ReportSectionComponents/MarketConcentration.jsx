import React from "react";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";

const MarketShareConcentration = ({ concentrationData }) => {
  // Prepare data for the donut chart for top companies
  const chartData = {
    labels: concentrationData.top_companies.map((company) => company.company_name),
    datasets: [
      {
        data: concentrationData.top_companies.map((company) => company.company_percentage),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-300">
      <h3 className="text-xl font-semibold mb-4">Market Share Concentration</h3>

      <div className="mb-6">
        <p>
          <strong>Concentration Level:</strong> {concentrationData.concentration_level}
        </p>
        <p>
          <strong>Concentration Trend:</strong> {concentrationData.concentration_trend}
        </p>
      </div>

      {/* Leading Companies Section */}
      <div className="flex flex-col sm:flex-row sm:space-x-8 items-start mb-6">
        {/* Company List */}
        <div className="flex-1 space-y-4">
          <h4 className="text-lg font-semibold">Leading Companies</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            {concentrationData.top_companies.map((company, index) => (
              <li key={index} className="flex justify-between border rounded-lg p-3 bg-gray-300/20">
                <span>{company.company_name}</span>
                <span className="font-semibold text-green-500">{company.company_percentage}%</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Donut Chart */}
        <div className="w-80 h-80 mt-6 sm:mt-0">
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
                  display: false, // Hide legend to keep the chart compact
                },
              },
            }}
          />
        </div>
      </div>

      {/* Concentration Points */}
      <ul className="space-y-4 text-sm text-gray-300">
        {concentrationData.concentration_points.map((point, index) => (
          <li key={index} className=" rounded-lg p-4 bg-gray-300/20">
            <h4 className="text-lg font-semibold">{point.concentration_title}</h4>
            <p className="text-gray-200">{point.concentration_description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MarketShareConcentration;
