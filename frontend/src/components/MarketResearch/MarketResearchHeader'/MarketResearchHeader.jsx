// src/components/IndustryHeader.js
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSummaryData,setError,setLoading } from "../../../redux/industrySlice"; // Adjust the import path if necessary
import { API_BASE_URL, token } from "../../../services";

const IndustryHeader = () => {

  const dispatch = useDispatch(); // Initialize dispatch
  const responseData = useSelector((state) => state.formResponse.data); // Get the response data from the store
  const [activeIndustry, setActiveIndustry] = useState(null); // State to track the active button

  // Check if the responseData and its result are available
  if (!responseData || !responseData.result) return null;

  // Function to handle API call
  const sendIndustryDataToApi = async (industryCode, industryName) => {
    dispatch(setLoading()); // Set loading state before API call
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/industry-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            source: "IBIS",
            industry_name: industryName,
            industry_code: industryCode,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.result) {
        // Dispatch the actual data, not the action creator
        dispatch(setSummaryData(data));
      } else {
        dispatch(setError("No result found in API response"));
      }
    } catch (error) {
      console.error("Error sending data to API:", error);
      dispatch(setError(error.message));
    }
  };
  const handleButtonClick = (industryCode, industryName) => {
    // Toggle the active industry button
    setActiveIndustry((prev) => (prev === industryCode ? null : industryCode));

    // Send industry code and name to the backend
    sendIndustryDataToApi(industryCode, industryName);
  };

  return (
    <>
      <header className="industry-header px-4 pt-4 bg-gray-900 text-white">
        <h1 className="text-2xl font-bold">Industries</h1>

        {/* Scrollable container */}
        <div className="mt-4 overflow-x-auto scrollbar-thin scrollbar-track-slate-950 whitespace-nowrap">
          <div className="inline-flex space-x-4">
            {responseData.result.map((industry) => (
              <button
                key={industry.industry_code}
                className={`industry-button rounded-md transition-colors duration-300 
                ${
                  activeIndustry === industry.industry_code
                    ? "bg-gray-500" // Active button style
                    : "bg-gray-700 hover:bg-gray-600"
                } 
                w-3/5 h-12 flex-shrink-0`} // Fixed size for buttons
                title={`${industry.industry_code} - ${industry.industry_name}`}
                onClick={() =>
                  handleButtonClick(
                    industry.industry_code,
                    industry.industry_name
                  )
                } // Handle button click
              >
                <p className="w-[40rem]">
                  ({industry.industry_code}) - {industry.industry_name}
                </p>
              </button>
            ))}
          </div>
        </div>
      </header>
    </>
  );
};

export default IndustryHeader;
