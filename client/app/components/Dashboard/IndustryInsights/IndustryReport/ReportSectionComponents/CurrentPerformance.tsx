import { useState } from "react";

interface PerformancePoint {
  current_performance_point_title?: string;
  current_performance_point_description?: string;
}

interface CurrentPerformanceProps {
  currentPerformance?: PerformancePoint[]; // Allow undefined
}

export function CurrentPerformanceComponent({
  currentPerformance = [], // Provide a default value if currentPerformance is undefined
}: CurrentPerformanceProps) {
  const [allOpen, setAllOpen] = useState<boolean>(false);

  const toggleAllAccordions = (): void => {
    setAllOpen(!allOpen);
  };

  return (
    <div className="p-10 text-gray-400 bg-[#171717] border rounded-xl border-[#2e2e2e]">
      <h3 className="text-xl font-semibold mb-4 text-[#e1e1e1]">Performance Insights</h3>
      {currentPerformance.length > 0 ? (
        <div className="grid grid-cols-2 gap-12">
          {currentPerformance.map((point, index) => (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <div
                onClick={toggleAllAccordions}
                className="flex justify-between items-center cursor-pointer"
              >
                <h4 className="text-lg text-[#b9bbbe] font-medium">
                  {point.current_performance_point_title || "Untitled Insight"}
                </h4>
                <span className="text-lg">{allOpen ? "-" : "+"}</span>
              </div>
              {allOpen && (
                <p className="mt-2 font-normal text-[#a8a8a8]">
                  {point.current_performance_point_description ||
                    "No description available."}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No performance insights available.</p>
      )}
    </div>
  );
}

export default CurrentPerformanceComponent;
