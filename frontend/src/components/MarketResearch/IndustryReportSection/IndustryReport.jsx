import React from "react";
import { useSelector } from "react-redux";
import ReportDropdown from "./ReportDropdown"; // Adjust the import path if necessary
import { DataRenderer } from "./DyanmicRender";



const YourComponent = () => {
  const summaryData = useSelector((state) => state.industry.summaryData);

  //summaryData.result
  return (
    <div className="mb-20 pb-10 rounded-lg">
      <div className="px-10 py-5">
        {summaryData && summaryData !== "Select an industry to view report" ? (
          <>
            <ReportDropdown data={summaryData.result} />
            {/* <DataRenderer data={data} /> */}
          </>
        ) : (
          <div className="text-center animate-pulse text-gray-300">
            Generating data for the selected company...
          </div>
        )}
      </div>
    </div>
  );
};

export default YourComponent;
