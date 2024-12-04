import { Popsicle } from "lucide-react";
import React from "react";

const SummaryPointsCard = ({ description, sentiment, confidenceLevel }) => {
  return (
    <div className="spce-y-2 bg-stone-900 border-stone-800 border px-3 py-2 rounded-lg my-4">
      <div className="flex justify-between my-2">
        <div className="text-base font-medium">{description}</div>
      </div>
      <div className="flex items-center space-x-4">
        <div className={`px-2 py-1 rounded border ${
                sentiment === 'Positive' ? 'text-green-500 bg-green-700/15 border-green-500' :
                sentiment === 'Negative' ? 'text-red-500 bg-red-900/15 border-red-500' :
                'text-gray-500 bg-gray-100'
            }`} >{sentiment}</div>
        <div className="text-sm text-gray-400">Confidence: {confidenceLevel}%</div>
      </div>
    </div>
  );
};

export default SummaryPointsCard;
