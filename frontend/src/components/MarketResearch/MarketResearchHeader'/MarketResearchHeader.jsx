import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setSummaryData,
  setError,
  setLoading,
} from "../../../redux/industrySlice";
import EditIcon from "@mui/icons-material/Edit";
import DoneIcon from "@mui/icons-material/Done";
import { API_BASE_URL, token } from "../../../services";
import FuzzySearch from "../../SearchBox/FuzzySearch";

const IndustryHeader = () => {
  const dispatch = useDispatch();
  const formResponse = useSelector((state) => state.formResponse.data);
  const [activeIndustry, setActiveIndustry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [industries, setIndustries] = useState(formResponse?.result || []);

  if (!formResponse || !formResponse.result) return null;

  const sendIndustryDataToApi = async (industryCode, industryName) => {
    dispatch(setLoading());
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
    setActiveIndustry((prev) => (prev === industryCode ? null : industryCode));
    sendIndustryDataToApi(industryCode, industryName);
  };

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  const handleRemoveIndustry = (industryCode) => {
    setIndustries((prev) =>
      prev.filter((industry) => industry.industry_code !== industryCode)
    );
  };
 console.log(industries);
  return (
    <div className="h-screen flex flex-col">
      {/* Header section */}
      <div className="p-4 bg-[#09090A]">
        <div>
          <img src="/images/LogoCompany.png" alt="Company Logo" className="my-4"/>
        </div>
        
        <div className="flex justify-between items-center my-2">
          <h1 className="text-xl font-bold text-white">Industries</h1>
          <button
            className="text-white hover:text-gray-400"
            title={isEditing ? "Done" : "Edit"}
            onClick={handleEditToggle}
          >
            {isEditing ? <DoneIcon /> : <EditIcon />}
          </button>
        </div>
        {isEditing && (
          <div className="my-5">
            <FuzzySearch section={"Search Industry"} industry={industries} />
          </div>
        )}
      </div>

      {/* Scrollable industry list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-slate-950">
        <div className="p-3 flex flex-col space-y-4">
          {industries.map((industry) => (
            <div
              key={industry.industry_code}
              className={`flex items-center space-x-3 industry-button text-white rounded-md truncate transition-colors duration-300 
              ${
                activeIndustry === industry.industry_code
                  ? "bg-[#252525]"
                  : "bg-gray-950 hover:bg-[#252525]"
              } 
              h-12`}
            >
              <button
                className="flex-1 text-left px-3 text-xs py-2 truncate"
                title={`${industry.industry_code} - ${industry.industry_name}`}
                onClick={() =>
                  handleButtonClick(
                    industry.industry_code,
                    industry.industry_name
                  )
                }
              >
                {industry.industry_name}
              </button>
              {isEditing && (
                <button
                  className="text-red-500 hover:text-red-700 px-2"
                  title="Remove"
                  onClick={() => handleRemoveIndustry(industry.industry_code)}
                >
                  ➖
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IndustryHeader;
