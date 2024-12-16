import { documentAnalysisList } from "../../constants";
import React, { useState } from "react";
import DocumentAnalysis from "./DocumentAnalysis";
import DocumentSummary from "./DocumentSummary";

const DocumentNavbar = () => {
  const [activeCategory, setActiveCategory] = useState("Summary");

  return (
    <div>
      <div className="bg-gray-700">
        <div className="flex laptop:gap-2 largeDesktop:gap-0">
          {documentAnalysisList.map((data, index) => (
            <div
              key={index}
              onClick={() => setActiveCategory(data)}
              className={`relative p-1 text-center desktop:p-2 cursor-pointer text-sm transition-all duration-300 ${
                data === activeCategory
                  ? "text-blue-500"
                  : "text-gray-300 hover:text-gray-400"
              }`}
            >
              {data}
              {data === activeCategory && (
                <span
                  className="absolute left-0 bottom-0 h-[2px] w-full bg-blue-500 rounded-full animate-slide-in"
                  style={{ animationDuration: "300ms" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {activeCategory === "Document Analysis" ? (
        <div>
          <DocumentAnalysis />
        </div>
      ) : activeCategory === "Summary" ? (
        <div>
          <DocumentSummary />
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default DocumentNavbar;
