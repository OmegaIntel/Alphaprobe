import React from "react";

// Define types for metrics and scores
interface Score {
  Category: string;
  Result: string;
  Score?: number; // Optional score field
}

interface Metric {
  Aspect: string;
  Scores: Score[];
}

interface ScorecardComponentProps {
  metrics?: Metric[]; // Allow metrics to be optional
}

const ScorecardComponent: React.FC<ScorecardComponentProps> = ({
  metrics = [], // Provide a default empty array if metrics is undefined
}) => {
  // Error handling: Check if metrics is empty
  if (metrics.length === 0) {
    return (
      <div className="text-red-500 text-center">
        Error: Invalid or empty metrics data
      </div>
    );
  }

  // Filter to only "Market" aspect
  const marketMetrics = metrics.filter((aspect) => aspect.Aspect === "Market");

  // Error handling: Check if there are "Market" aspects
  if (marketMetrics.length === 0) {
    return (
      <div className="text-red-500 text-center">No Market metrics found</div>
    );
  }

  // Calculate the average score for all scores in the "Market" aspect
  const calculateOverallAverageScore = (): string => {
    const totalScore = marketMetrics.reduce(
      (acc, aspect) =>
        acc +
        aspect.Scores.reduce((sum, score) => sum + (score.Score || 0), 0), // Ensure Score exists
      0
    );
    const totalItems = marketMetrics.reduce(
      (acc, aspect) => acc + aspect.Scores.length,
      0
    );
    return totalItems > 0 ? (totalScore / totalItems).toFixed(2) : "0"; // Prevent division by zero
  };

  const overallAverageScore = calculateOverallAverageScore();

  return (
    <div className="rounded-lg p-4 shadow-md -mt-4 text-gray-400 flex flex-col space-y-4">
      {/* Display the table with scores */}
      {marketMetrics.map((aspect, index) => (
        <div
          key={index}
          className="-mb-4 border-[3px] rounded-md border-[#2b5ba2]"
        >
          <div className="overflow-auto">
            <h4 className="text-xl p-3 text-white font-semibold mb-2">
              {aspect.Aspect} Score
            </h4>
            <div className="flex flex-row font-semibold p-3 text-white">
              <div className="w-2 h-14 mr-3 bg-blue-500"></div>
              <div>
                <p className="text-green-400 text-xl font-semibold">
                  {overallAverageScore}/5
                </p>
                <p className="text-gray-500 text-sm">Industry Attractiveness</p>
              </div>
            </div>
            <table className="w-full bg-gray-800 rounded-lg">
              <tbody>
                {aspect.Scores.map((score, idx) => (
                  <tr key={idx} className="bg-[#0a0a0a]">
                    <td className="p-3">{score.Category}</td>
                    <td className="p-3">{score.Result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScorecardComponent;
