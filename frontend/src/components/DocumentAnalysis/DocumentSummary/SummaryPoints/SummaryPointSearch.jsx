import React, { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";

const SummaryPointSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = async () => {
    if (!searchQuery.trim()) return; // Prevent empty searches
    try {
      const response = await fetch("https://api.example.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();
      console.log("Search results:", data);
    } catch (error) {
      console.error("Error during search:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex justify-center items-center w-full  p-4">
      <div className="relative w-full max-w-md">
        <SearchIcon
          className="absolute left-3 top-[0.8rem] text-gray-400 cursor-pointer"
          onClick={handleSearch}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown} // Trigger search on Enter key
          placeholder="Search summary points..."
          className="w-full pl-10 pr-4 py-2 bg-gray-900 text-gray-200 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
};

export default SummaryPointSearch;
