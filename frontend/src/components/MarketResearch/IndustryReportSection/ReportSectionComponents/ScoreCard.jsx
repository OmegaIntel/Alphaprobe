import React from "react";

const ScorecardComponent = ({ metrics }) => {
  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400">
      <h3 className="text-xl font-semibold mb-4">Scorecard</h3>

      {metrics.map((aspect, index) => (
        <div key={index} className="mb-6">
          <h4 className="text-lg font-semibold mb-2">{aspect.Aspect}</h4>

          <div className="overflow-auto">
            <table className="w-full bg-gray-800 rounded-lg">
              <thead>
                <tr className="text-left bg-gray-700">
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold">Weight</th>
                  <th className="p-3 font-semibold">Result</th>
                  <th className="p-3 font-semibold">Score</th>
                  <th className="p-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {aspect.Scores.map((score, idx) => (
                  <tr key={idx} className="odd:bg-gray-700 even:bg-gray-600">
                    <td className="p-3">{score.Category}</td>
                    <td className="p-3">{score.Weight}</td>
                    <td className="p-3">{score.Result}</td>
                    <td className="p-3">{score.Score}</td>
                    <td className="p-3">{score.Total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-2 text-right font-semibold text-gray-300">
            Total: {aspect.Total}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScorecardComponent;