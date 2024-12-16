import React, { useState } from "react";
import { Search } from "@mui/icons-material";
import { API_BASE_URL, token } from "../../../services";
import { setFormResponse } from "../../../redux/formResponseSlice";
import { useDispatch } from "react-redux";

const MarketResearchPreload = () => {
  const [query, setQuery] = useState("");
  const dispatch = useDispatch();

  const handleSearch = async () => {
    if (!query.trim()) {
      console.error("Query cannot be empty.");
      return;
    }

    const apiUrl = `${API_BASE_URL}/api/industries-for-userquery`; 
    try {
      const response = await fetch(apiUrl, {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, 
        },
        body: JSON.stringify({ search_query: query.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Search Results:", data);
        dispatch(setFormResponse(data));
        // Handle your search results here
      } else {
        console.error("Failed to fetch:", await response.text());
      }
    } catch (error) {
      console.error("Network Error:", error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col items-center py-32 h-screen bg-stone-950 text-white">
      {/* Search Bar */}
      <div className="inline-flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for any industry or sector..."
          className="p-2 rounded-xl w-[30rem] border border-gray-600 h-11 bg-gray-800 text-sm text-white"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="ml-2 p-2 bg-gray-800 text-white rounded-xl h-11 w-11 hover:bg-[#121212] hover:text-[#fcfcfc] transition-all duration-200 ease-out"
        >
          <Search className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default MarketResearchPreload;
