import React, { useState } from "react";
import { Search } from "@mui/icons-material";
import { API_BASE_URL, token } from "../../../services";

const PreloadingScreen = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      console.error("Query cannot be empty.");
      return;
    }

    const encodedQuery = encodeURIComponent(query.trim());
    const apiUrl = `${API_BASE_URL}/api/companies?query=${encodedQuery}`;
    setLoading(true); // Start spinner

    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include the token if the API requires it
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data);
        setResults(data.companies || []); // Assuming the response has a "companies" array
      } else {
        console.error("API Error:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Network Error:", error);
    } finally {
      setLoading(false); // Stop spinner
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      {/* Search Bar */}
      <div className="flex items-center w-80 bg-gray-800 rounded-md px-4 py-2 mb-4">
        <Search className="cursor-pointer mr-3" onClick={handleSearch} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a company..."
          className="flex-grow bg-transparent outline-none text-white placeholder-gray-400"
        />
      </div>

      {/* Results Section */}
      <div className="w-80 bg-gray-800 p-4 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Search Results</h3>
        {loading ? (
          <div className="flex justify-center items-center">
            {/* Spinner */}
            <div className="w-6 h-6 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {results.map((company, index) => (
              <div
                key={index}
                className="bg-gray-700 p-2 rounded-md text-center"
              >
                {company}
              </div>
            ))}
          </div>
        ) : (
          <p>No results found</p>
        )}
      </div>
    </div>
  );
};

export default PreloadingScreen;
