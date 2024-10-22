import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setFormResponse } from "../../../redux/formResponseSlice"; // Adjust the import path

const ThesisSummaryCard = ({ thesisSummary, industries }) => {
  const dispatch = useDispatch();
  
  // Local state to manage selected industries
  const [selectedIndustries, setSelectedIndustries] = useState({});

  const handleInputChange = (industry) => {
    const { industry_code, industry_name } = industry;
    // Toggle selection in local state
    setSelectedIndustries((prevSelected) => ({
      ...prevSelected,
      [industry_code]: !prevSelected[industry_code]
    }));
  };

  const handleUpdateState = () => {
    const formattedData = {
      result: Object.keys(selectedIndustries)
        .filter(code => selectedIndustries[code]) // Filter selected industries
        .map(code => ({
          industry_code: code,
          industry_name: industries.find(ind => ind.industry_code === code).industry_name // Get name from industries array
        }))
    };

    dispatch(setFormResponse(formattedData)); 
  };

  return (
    <div className="bg-white bg-opacity-5 backdrop-blur-lg text-white rounded-lg shadow-md p-4 max-w-full my-10">
      <h2 className="text-xl font-bold mb-2">Thesis Summary</h2>
      <p className="mb-3 mt-2">{thesisSummary}</p>
      <h3 className="text-lg font-semibold mb-10 text-left p-2 bg-[#1f1e23] shadow-lg rounded-lg border-none text-white">
        Suggested Industries
      </h3>
      <div className="grid grid-flow-row xl:grid-cols-3 md:grid-cols-2 grid-cols-1">
        {industries.map((industry) => (
          <div
            key={industry.industry_code}
            className="flex items-center mb-2 mx-4 bg-gray-800 h-16 px-2 py-1 rounded-lg"
          >
            <input
              type="checkbox"
              id={industry.industry_code}
              checked={selectedIndustries[industry.industry_code] || false}
              onChange={() => handleInputChange(industry)}
              className={`mr-1 h-[20px] w-[20px] transition-colors duration-300 ${
                selectedIndustries[industry.industry_code]
                  ? "bg-white"
                  : "bg-[#151518] border-gray-500"
              }`}
              style={{
                appearance: "none",
                border: "2px solid #6b7280",
                borderRadius: "4px",
                outline: "none",
              }}
            />
            <label
              htmlFor={industry.industry_code}
              className="cursor-pointer ml-5 w-80"
            >
              {industry.industry_name}
            </label>
          </div>
        ))}
      </div>
      <button
        onClick={handleUpdateState}
        className="bg-white hover:bg-[#151518] font-semibold hover:border-white my-10 mx-5 hover:border hover:text-white transition-all ease-out duration-300 text-[#151518] px-4 py-2 rounded"
        style={{ float: "right" }}
      >
        Proceed to Market Research
      </button>
    </div>
  );
};

export default ThesisSummaryCard;
