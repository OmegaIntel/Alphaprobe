import { useState } from "react";

interface OutlookPoint {
  future_outlook_point_title?: string; // Made optional to handle missing fields
  future_outlook_point_description?: string; // Made optional to handle missing fields
}

interface FutureOutlookProps {
  futureOutlook?: OutlookPoint[]; // Allow undefined
}

export function FutureOutlookComponent({
  futureOutlook = [], // Provide a default empty array if futureOutlook is undefined
}: FutureOutlookProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [allOpen, setAllOpen] = useState<boolean>(false);

  // Display either the first 4 points or all points, depending on isExpanded state
  const displayedPoints: OutlookPoint[] = isExpanded
    ? futureOutlook
    : futureOutlook.slice(0, 4);

  const toggleAllAccordions = (): void => {
    setAllOpen(!allOpen);
  };

  return (
    <div className="p-10 text-gray-400">
      <h3 className="text-xl font-semibold mb-4 text-[#e1e1e1]">
        Future Outlook
      </h3>

      <div className="grid grid-cols-2 gap-12">
        {displayedPoints.map((point, index) => (
          <div
            key={index}
            className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
          >
            <div
              onClick={toggleAllAccordions}
              className="flex justify-between items-center cursor-pointer"
            >
              <h4 className="font-medium text-lg text-[#b9bbbe]">
                {point.future_outlook_point_title || "Untitled Outlook"}
              </h4>
              <span className="text-lg">{allOpen ? "-" : "+"}</span>
            </div>
            {allOpen && (
              <p className="mt-2 text-[#a8a8a8]">
                {point.future_outlook_point_description ||
                  "No description available."}
              </p>
            )}
          </div>
        ))}
      </div>

      {futureOutlook.length > 4 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 px-4 py-2 text-blue-500 font-medium hover:underline"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
}

export default FutureOutlookComponent;
