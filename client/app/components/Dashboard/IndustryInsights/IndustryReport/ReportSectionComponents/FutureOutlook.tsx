import { useState } from "react";

interface OutlookPoint {
  future_outlook_point_title?: string; // Optional to handle missing fields
  future_outlook_point_description?: string; // Optional to handle missing fields
}

interface FutureOutlookProps {
  futureOutlook?: OutlookPoint[]; // Allow undefined
}

export function FutureOutlookComponent({
  futureOutlook = [], // Provide a default empty array if futureOutlook is undefined
}: FutureOutlookProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="p-10 bg-[#171717] border rounded-xl border-[#2e2e2e] text-gray-400">
      <h3 className="text-xl font-semibold mb-4 text-[#e1e1e1]">
        Future Outlook
      </h3>

      <div className="grid grid-cols-2 gap-12">
        {futureOutlook.map((point, index) => (
          <div
            key={index}
            className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
          >
            <h4 className="font-medium text-lg text-[#b9bbbe]">
              {point.future_outlook_point_title || "Untitled Outlook"}
            </h4>
            {isExpanded && (
              <p className="mt-2 text-[#a8a8a8]">
                {point.future_outlook_point_description ||
                  "No description available."}
              </p>
            )}
          </div>
        ))}
      </div>

      {futureOutlook.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full sm:w-1/5 bg-[#1d2a41] text-white border-2 border-[#404040] py-2 rounded-full font-medium hover:bg-gray-600 transition duration-200"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
}

export default FutureOutlookComponent;
