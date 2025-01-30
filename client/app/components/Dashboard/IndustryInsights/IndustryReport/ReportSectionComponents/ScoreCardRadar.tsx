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

// Register necessary chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// Define types for metrics and scores
interface Score {
  Category: string;
  Score?: number; // Allow undefined for compatibility
}

interface Metric {
  Aspect: string;
  Scores: Score[];
}

interface RadarChartComponentProps {
  metrics?: Metric[]; // Allow metrics to be optional
}

const RadarChartComponent: React.FC<RadarChartComponentProps> = ({
  metrics = [], // Default to an empty array if metrics is undefined
}) => {
  // Extract the "Market" aspect data
  const marketAspect = metrics.find((aspect) => aspect.Aspect === "Market");

  // Handle cases where "Market" aspect is not found or Scores are missing
  if (!marketAspect || !marketAspect.Scores || marketAspect.Scores.length === 0) {
    return (
      <div className="text-red-500 text-center">
        <p>Error: No market metrics available.</p>
      </div>
    );
  }

  // Prepare data for the radar chart
  const data = {
    labels: marketAspect.Scores.map((score) => score.Category),
    datasets: [
      {
        label: "Market Score",
        data: marketAspect.Scores.map((score) => score.Score || 0), // Fallback to 0 if Score is undefined
        backgroundColor: "rgba(194, 183, 31, 0.6)",
        borderColor: "rgba(255, 225, 0, 0.8)",
        borderWidth: 3,
        pointBackgroundColor: "#ffffff",
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
          circular: true,
          color: "rgba(255, 255, 255, 0.2)",
          lineWidth: 2,
        },
        pointLabels: {
          font: {
            size: 12,
          },
          color: "#ffffff",
        },
      },
    },
  };

  return (
    <div className="shadow-md md:w-[20rem] rounded-lg">
      <Radar data={data} options={options} />
    </div>
  );
};

export default RadarChartComponent;
