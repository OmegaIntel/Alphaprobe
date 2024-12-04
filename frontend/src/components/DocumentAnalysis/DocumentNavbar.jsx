import { documentAnalysisList } from "../../constants";
import React, { useState } from "react";
import DocumentAnalysis from "./DocumentAnalysis";
import DocumentSummary from "./DocumentSummary";

const DocumentNavbar = () => {
  const [activeCategory, setActiveCategory] = useState("Summary");

  return (
    <div>
      <div className=" bg-gray-700">
        {" "}
        <div className="flex laptop:gap-2 largeDesktop:gap-0">
          {documentAnalysisList.map((data, index) => (
            <div
              id={index}
              className={`${
                data === activeCategory && "bg-[#212126] rounded-lg"
              } p-1 text-center desktop:p-2 cursor-pointer text-sm`}
              key={index}
              onClick={() => setActiveCategory(data)}
            >
              {data}
            </div>
          ))}
        </div>
      </div>
      {activeCategory === "Document Analysis" ? (
        <>
          <div>
            <DocumentAnalysis />
          </div>
        </>
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
