import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setFormResponse,
  updateSelectedIndustries,
 
} from "../../../redux/formResponseSlice";
import EditIcon from "@mui/icons-material/Edit";
import DoneIcon from "@mui/icons-material/Done";
import FuzzySearch from "../../SearchBox/FuzzySearch";
import { notification } from "antd";
import { setSummaryData } from "../../../redux/industrySlice";
import { API_BASE_URL , token } from "../../../services";
// Replace with your API base URL

const IndustryHeader = () => {
  const dispatch = useDispatch();
  const formResponse = useSelector((state) => state.formResponse.data);
  const selectedIndustries = useSelector(
    (state) => state.formResponse.selectedIndustries
  );
  const [isEditing, setIsEditing] = useState(false);
  const [industries, setIndustries] = useState(formResponse?.result || []);

  // Ensure industries is not empty even if formResponse is null
  useEffect(() => {
    if (!formResponse || !formResponse.result) {
      setIndustries([]);
    } else {
      setIndustries(formResponse.result);
    }
  }, [formResponse]);

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  const handleRemoveIndustry = (industryName) => {
    setIndustries((prev) =>
      prev.filter((industry) => industry.industry_name !== industryName)
    );
    dispatch(
      updateSelectedIndustries({
        industry_name: industryName,
        industry_code: null, // Assuming removal logic
      })
    );
  };

  const fetchIndustrySummary = async (industry) => {
    const payload = {
      data: {
        source: "IBIS",
        industry_name: industry.industry_name,
        industry_code: industry.industry_code,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/industry-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token, // Replace with your actual token
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.result || result.result.length === 0) {
        notification.error({
          message: "Invalid Industry",
          description:
            "There was an error fetching your request. Please enter a valid industry.",
        });
        return;
      }

      console.log("Response:", result);

      // Dispatch the data to Redux
      dispatch(setSummaryData(result));
    } catch (error) {
      console.error("Error:", error);
      
    }
  };

  const handleIndustryToggle = (industry) => {
    const isAlreadySelected = selectedIndustries.some(
      (i) => i.industry_code === industry.industry_code
    );

    if (isAlreadySelected) {
      // Remove from selected industries
      const updatedIndustries = selectedIndustries.filter(
        (i) => i.industry_code !== industry.industry_code
      );
      dispatch(updateSelectedIndustries(updatedIndustries));
    } else {
      // Add to selected industries and fetch data
      dispatch(
        updateSelectedIndustries([...selectedIndustries, industry])
      );
      fetchIndustrySummary(industry); // Call the API when adding a new industry
    }
  };

  // Update the Redux state whenever `industries` changes
  useEffect(() => {
    dispatch(setFormResponse({ result: industries }));
  }, [industries, dispatch]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header section */}
      <div className="p-4 bg-[#09090A]">
        <div>
          <img
            src="/images/LogoCompany.png"
            alt="Company Logo"
            className="my-4"
          />
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
            <FuzzySearch
              section={"Search Industry"}
              industry={industries}
              setIndustry={setIndustries}
            />
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
                selectedIndustries.some(
                  (i) => i.industry_code === industry.industry_code
                )
                  ? "bg-[#252525]"
                  : "bg-gray-950 hover:bg-[#252525]"
              } 
              h-12`}
            >
              <button
                className="flex-1 text-left px-3 text-xs py-2 truncate"
                title={`${industry.industry_code} - ${industry.industry_name}`}
                onClick={() => handleIndustryToggle(industry)}
              >
                {industry.industry_name}
              </button>
              {isEditing && (
                <button
                  className="text-red-500 hover:text-red-700 px-2"
                  title="Remove"
                  onClick={() => handleRemoveIndustry(industry.industry_name)}
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
