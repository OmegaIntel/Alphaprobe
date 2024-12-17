import React, { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useDispatch } from "react-redux";
import {
  addInteraction,
  updateInteractionResponse,
} from "../../../../redux/chatSlice";
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL, token } from "../../../../services/index";

const ChatInterface = ({onFirstQueryMade}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasFirstQueryBeenMade, setHasFirstQueryBeenMade] = useState(false)
  const [sessionId, setSessionId] = useState(
    localStorage.getItem("rag_session_id") || ""
  );
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

    // Check if this is the first query
    if (!hasFirstQueryBeenMade) {
      setHasFirstQueryBeenMade(true);
      onFirstQueryMade();
  }

    const interactionId = uuidv4(); // Consistently use uuidv4 for ID generation
    dispatch(addInteraction({ query: searchQuery, id: interactionId }));

    try {
        const endpoint = `${API_BASE_URL}/api/rag-search?query=${encodeURIComponent(searchQuery)}`;
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(sessionId && { "Session-ID": sessionId })
        };

        const response = await fetch(endpoint, { method: "GET", headers });
        const data = await response.json();

        dispatch(updateInteractionResponse({
            id: interactionId,
            response: data || "No response received.",
        }));

        
        if (data.session_id && data.session_id !== sessionId) {
            setSessionId(data.session_id);
            localStorage.setItem("rag_session_id", data.session_id);
        }
    } catch (error) {
        console.error("Error during search:", error);
        dispatch(updateInteractionResponse({
            id: interactionId,
            response: "Failed to fetch response.",
        }));
    }
};


  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex justify-center items-center w-full p-4">
      <div className="relative w-full max-w-xl">
        <SearchIcon
          className="absolute left-3 top-[0.8rem] text-gray-400 cursor-pointer"
          onClick={handleSearch}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown} // Trigger search on Enter key
          placeholder="Type your message..."
          className="w-full pl-10 pr-4 py-2 bg-gray-900 text-gray-200 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
        />
      </div>
    </div>
  );
};

export default ChatInterface;
