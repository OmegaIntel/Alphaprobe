import React from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const RadarChartComponent = ({ metrics }) => {
  // Extract the "Market" aspect data
  const marketAspect = metrics.find((aspect) => aspect.Aspect === "Market");

  // Prepare data for the radar chart
  const data = {
    labels: marketAspect.Scores.map((score) => score.Category),
    datasets: [
      {
        label: "Market Score",
        data: marketAspect.Scores.map((score) => score.Score),
        backgroundColor: "rgba(194, 183, 31, 0.6)",
        borderColor: "rgba(255, 225, 0,0.8)",
        borderWidth: 3,
        pointBackgroundColor: "#fffff",
      },
    ],
  };

  // Options for the radar chart
  const options = {
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          display: false,
        },
        grid: {
          circular: true, // Ensure the grid lines are circular
          color: "rgba(255, 255, 255, 0.2)", // Customize grid line color if needed
          lineWidth: 2, // Increase this value to make the circle lines thicker
        },
        pointLabels: {
             // Ensures labels are displayed at each point around the chart
            font: {
              size: 12 // Adjusts font size as desired
            },
            color: "#ffffff" // Sets color for the labels
          }
      },
    },
  };

  return (
    <div className="shadow-md md::w-[25rem] rounded-lg ">
      <Radar data={data} options={options} />
    </div>
  );
};

export default RadarChartComponent;
