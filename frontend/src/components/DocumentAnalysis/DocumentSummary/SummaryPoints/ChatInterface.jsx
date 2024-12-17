import React, { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useDispatch } from "react-redux";
import {
  addInteraction,
  updateInteractionResponse,
} from "../../../../redux/chatSlice";
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL, token } from "../../../../services/index";
import { Search } from "@mui/icons-material";

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
  //   <div>
  //  {hasFirstQueryBeenMade ? (<div className="flex justify-center items-center w-full ">
  //   <div className="inline-flex">
  //           <input
  //              type="text"
  //              value={searchQuery}
  //              onChange={(e) => setSearchQuery(e.target.value)}
  //              onKeyDown={handleKeyDown} // Trigger search on Enter key
  //              placeholder="Type your message..."
  //             className="p-2 rounded-xl w-[30rem] border border-gray-600 h-11 bg-gray-800 text-sm text-white"
  //           />
  //           <button
  //             type="button"
  //             onClick={handleSearch}
  //             className="ml-2 p-2 bg-gray-800 text-white rounded-xl h-11 w-11 hover:bg-[#121212] hover:text-[#fcfcfc] transition-all duration-200 ease-out"
  //           >
  //             <Search className="text-white" />
  //           </button>
  //         </div>
  //   </div>) : (
      
  //     <div className="flex flex-col items-center py-32 h-screen bg-stone-950 text-white">
  //         {/* Search Bar */}
  //         <div className="inline-flex">
  //           <input
  //              type="text"
  //              value={searchQuery}
  //              onChange={(e) => setSearchQuery(e.target.value)}
  //              onKeyDown={handleKeyDown} // Trigger search on Enter key
  //              placeholder="Type your message..."
  //             className="p-2 rounded-xl w-[30rem] border border-gray-600 h-11 bg-gray-800 text-sm text-white"
  //           />
  //           <button
  //             type="button"
  //             onClick={handleSearch}
  //             className="ml-2 p-2 bg-gray-800 text-white rounded-xl h-11 w-11 hover:bg-[#121212] hover:text-[#fcfcfc] transition-all duration-200 ease-out"
  //           >
  //             <Search className="text-white" />
  //           </button>
  //         </div>
  //       </div>)}
    
     
  //   </div>
  <div className="flex justify-center items-center w-full ">
    <div className="inline-flex bg-stone-950 px-10 py-4">
            <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyDown={handleKeyDown} // Trigger search on Enter key
               placeholder="Type your message..."
              className="p-2 rounded-xl w-[30rem] border border-gray-600 h-11  bg-gray-800 text-sm text-white"
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

export default ChatInterface;

