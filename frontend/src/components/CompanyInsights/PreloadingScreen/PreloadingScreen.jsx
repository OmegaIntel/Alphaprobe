import React, { useState, useEffect } from "react";
import { Search } from "@mui/icons-material";
import { API_BASE_URL, token } from "../../../services";
import {
  fetchCompanyInsightFailure,
  fetchCompanyInsightSuccess,
} from "../../../redux/companyInsightsSlice";
import { useDispatch } from "react-redux";

const PreloadingScreen = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(() => {
    // Load saved results from local storage on mount
    const savedResults = localStorage.getItem("searchResults");
    return savedResults ? JSON.parse(savedResults) : [];
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false); // State for generating data animation
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    // Determine if this is the first visit
    const savedResults = localStorage.getItem("searchResults");
    return !savedResults; // If no saved results, it’s the first visit
  });
  const dispatch = useDispatch();

  useEffect(() => {
    // Save results to local storage whenever they change
    if (results.length > 0) {
      localStorage.setItem("searchResults", JSON.stringify(results));
    }
  }, [results]);

  const handleSearch = async () => {
    if (!query.trim()) {
      console.error("Query cannot be empty.");
      return;
    }

    const encodedQuery = encodeURIComponent(query.trim());
    const apiUrl = `${API_BASE_URL}/api/companies?query=${encodedQuery}`;
    setLoading(true); // Start spinner
    setIsFirstVisit(false); // No longer the first visit

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

  const handleCompanySelection = async (company) => {
    setGenerating(true); // Start generating animation
    const payload = {
      data: {
        company_name: company,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/company-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Search payload:", payload);
        dispatch(fetchCompanyInsightSuccess(result));
        console.log("Search Response:", result);
      } else {
        const error = await response.text();
        dispatch(fetchCompanyInsightFailure(error));
        console.error("API Error:", error);
      }
    } catch (error) {
      dispatch(fetchCompanyInsightFailure(error.toString()));
      console.error("Network Error:", error);
    } finally {
      setGenerating(false); // Stop generating animation
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
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
          placeholder="Search for a company..."
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

      {/* Results Section */}
      <div className="w-1/2 p-4 rounded-md flex flex-col">
        <h3 className="text-lg font-semibold mb-4 text-center">
          Search Results
        </h3>
        {loading ? (
          <div className="flex justify-center items-center">
            {/* Spinner */}
            <div className="w-6 h-6 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
          </div>
        ) : generating ? (
          <div className="text-center animate-pulse text-gray-300">
            Generating data for the selected company...
          </div>
        ) : isFirstVisit ? (
          <p className="text-center">Search for a company to begin.</p>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {results.map((company, index) => (
              <div
                key={index}
                className="bg-gray-700 p-2 rounded-md text-center cursor-pointer hover:bg-gray-600"
                onClick={() => handleCompanySelection(company)}
              >
                {company}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center">
            No companies found. Try searching for other domains or niches.
          </p>
        )}
      </div>
    </div>
  );
};

export default PreloadingScreen;
