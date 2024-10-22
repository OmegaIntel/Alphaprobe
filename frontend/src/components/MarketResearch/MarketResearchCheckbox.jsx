// src/components/IndustryCheckboxes.js
import React, { useState } from "react";
import { useSelector } from "react-redux";

const IndustryCheckboxes = () => {
  const responseData = useSelector((state) => state.formResponse.data); // Get the response data from the store
  const [selectedIndustry, setSelectedIndustry] = useState(null); // State to manage selected checkbox

  const handleCheckboxChange = (industryCode) => {
    setSelectedIndustry(
      (prevSelected) => (prevSelected === industryCode ? null : industryCode) // Allow only one checkbox to be selected
    );
  };

  // Check if the responseData and its result are available
  if (!responseData || !responseData.result) return null;

  return (
    <div className="industry-checkboxes">
      <h2 className="text-xl font-bold mb-4">Select Industries:</h2>
      <div className="checkbox-list">
        {responseData.result.map((industry) => (
          <div
            key={industry.industry_code}
            className="checkbox-item p-3 my-3 mx-2 bg-gray-800 h-16 rounded-lg"
          >
            <label className="flex items-center w-80">
              <input
                type="checkbox"
                checked={selectedIndustry === industry.industry_code}
                onChange={() => handleCheckboxChange(industry.industry_code)}
                style={{
                  appearance: "none",
                  border: "2px solid #6b7280",
                  borderRadius: "4px",
                  outline: "none",
                  width: "20px", // Adjust size here
                  height: "20px", // Adjust size here
                  backgroundColor:
                    selectedIndustry === industry.industry_code
                      ? "white"
                      : "#151518",
                  transition:
                    "background-color 0.3s ease, border-color 0.3s ease",
                }}
                className={`mr-2 transition-colors duration-300 ${
                  selectedIndustry === industry.industry_code
                    ? "bg-white"
                    : "bg-[#151518] border-gray-500"
                }`}
              />
              <div className="text-white w-80">
                {industry.industry_code} - {industry.industry_name}
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndustryCheckboxes;
