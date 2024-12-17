import React, { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useDispatch } from 'react-redux';
import {
  addDocumentSearchResult,
  updateDocumentSearchResult,
  deleteDocumentSearchResult
} from "../../../../redux/documentSearchResultSlice";
import { API_BASE_URL, token } from "../../../../services/index";


const SummaryPointSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionId, setSessionId] = useState(localStorage.getItem("rag_session_id") || "");
  const dispatch = useDispatch();

  useEffect(() => {
    // Load session ID from localStorage when component mounts
    const storedSessionId = localStorage.getItem("rag_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return; // Prevent empty searches
    try {
      const endpoint = `${API_BASE_URL}/api/rag-search?query=${encodeURIComponent(searchQuery)}`;
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
      // Include the session ID in the request header only if it is available
      if (sessionId) {
        headers["Session-ID"] = sessionId;
      }
      const response = await fetch(endpoint, {
        method: "GET",
        headers: headers,
      });
      const data = await response.json();
      dispatch(addDocumentSearchResult(data));
      console.log("Search results:", data);
      // Update the session ID with new one from the response if it's different and exists
      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id);
        localStorage.setItem("rag_session_id", data.session_id);
      }
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
    <div className="flex justify-center items-center w-full p-4">
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
