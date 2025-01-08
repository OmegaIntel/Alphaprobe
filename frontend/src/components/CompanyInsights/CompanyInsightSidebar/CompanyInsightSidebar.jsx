import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { notification } from "antd";
import { API_BASE_URL, token } from "../../../services";
import { fetchCompanyInsightFailure, fetchCompanyInsightSuccess } from "../../../redux/companyInsightsSlice";

const CompanyInsightSidebar = () => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState([]);

  // Load items from localStorage on component mount
  useEffect(() => {
    const savedResults = localStorage.getItem("searchResults");
    if (savedResults) {
      setItems(JSON.parse(savedResults));
    }
  }, []);

  const handleEditToggle = () => {
    setIsEditing(prev => !prev);
  };

  const handleRemoveItem = (itemName) => {
    const updatedItems = items.filter(item => item.name !== itemName);
    setItems(updatedItems);
    localStorage.setItem("searchResults", JSON.stringify(updatedItems));
  };

  const handleSelectItem = async (companyName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/company-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: { company_name: companyName } })
      });

      if (response.ok) {
        const result = await response.json();
        dispatch(fetchCompanyInsightSuccess(result));
        console.log("Search Response:", result);
      } else {
        const error = await response.text();
        dispatch(fetchCompanyInsightFailure(error));
        notification.error({
          message: "API Error",
          description: error
        });
      }
    } catch (error) {
      dispatch(fetchCompanyInsightFailure(error.toString()));
      notification.error({
        message: "Network Error",
        description: error.toString()
      });
    }
  };

  return (
    <div className="h-screen w flex flex-col">
      <div className="p-4 bg-[#09090A]">
        <img src="/images/LogoCompany.png" alt="Company Logo" className="my-4" />
        <div className="flex justify-between items-center my-2">
          <h1 className="text-xl font-bold text-white">Companies</h1>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-slate-950">
        <div className="p-3 flex flex-col space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 bg-gray-950 hover:bg-[#252525] text-white rounded-md truncate transition-colors duration-300 h-12 px-3"
              onClick={() => handleSelectItem(item)}
            >
              <span className="flex-1 text-xs py-2 font-semibold text-white truncate">
                {item}
              </span>
              {isEditing && (
                <button
                  className="text-red-500 hover:text-red-700"
                  title="Remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(item.name);
                  }}
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

export default CompanyInsightSidebar;
