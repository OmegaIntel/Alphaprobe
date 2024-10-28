import React from "react";
import { useSelector } from "react-redux";
import ReportDropdown from "./ReportDropdown"; // Adjust the import path if necessary


const YourComponent = () => {
  const industryState = useSelector((state) => state);
  const summaryData = useSelector((state) => state.industry.summaryData);
 
  console.log("Summary state:", summaryData.result); 

  return (
    <div className="mb-20 pb-10 rounded-lg">
      <div className="px-10 py-5">
        {summaryData && summaryData !== "Select an industry to view report" ? (
          <>
          
          <ReportDropdown data={summaryData.result} />
         
          
          </>
        ) : (
          <p>Loading data... Please select an industry.</p>
        )}
      </div>
      <div className="mt-4">
        <button
          type="submit"
          className="bg-white hover:bg-[#151518] font-semibold hover:border-white my-10 mx-20 hover:border hover:text-white transition-all ease-out duration-300 text-[#151518] px-4 py-2 rounded"
          style={{ float: "right" }}
          disabled={!summaryData || summaryData === "Select an industry to view report"}
        >
          Download Report
        </button>
      </div>
    </div>
  );
};


export default YourComponent;
