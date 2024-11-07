import React from "react";

const ScorecardComponent = ({ metrics }) => {
  // Filter to only "Market" aspect
  const marketMetrics = metrics.filter((aspect) => aspect.Aspect === "Market");

  // Calculate the average score for all scores in the "Market" aspect
  const calculateOverallAverageScore = () => {
    const totalScore = marketMetrics.reduce(
      (acc, aspect) =>
        acc + aspect.Scores.reduce((sum, score) => sum + score.Score, 0),
      0
    );
    const totalItems = marketMetrics.reduce(
      (acc, aspect) => acc + aspect.Scores.length,
      0
    );
    return (totalScore / totalItems).toFixed(2); // Average score rounded to 2 decimals
  };

  return (
    <div className="rounded-lg p-4 shadow-md -mt-4 text-gray-400 flex flex-col space-y-4">
      {/* Display the overall average score */}
      {/* <div className="text-center text-2xl font-semibold text-white">
        Market Aspect Average Score: {calculateOverallAverageScore()}/5
      </div> */}

      {/* Display the table with scores */}
      {marketMetrics.map((aspect, index) => (
        <div
          key={index}
          className="mb-6 border-[3px] rounded-md border-[#2b5ba2]"
        >
          <div className="overflow-auto">
            <h4 className="text-xl p-3 text-white font-semibold mb-2">
              {aspect.Aspect} Score
            </h4>
            <div className="flex flex-row font-semibold p-3 text-white">
              <div className="w-2 h-14 mr-3  bg-blue-500"></div>
              <div>
                <p className="text-green-400 text-xl font-semibold">
                  {" "}
                  {calculateOverallAverageScore()}/5
                </p>
                <p className="text-gray-500 text-sm ">
                  Industry Attractiveness
                </p>
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
