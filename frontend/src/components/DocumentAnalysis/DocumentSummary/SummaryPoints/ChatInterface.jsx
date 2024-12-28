import React, { useState, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useDispatch } from "react-redux";
import {
  addInteraction,
  updateInteractionResponse,
} from "../../../../redux/chatSlice";
import { v4 as uuidv4 } from "uuid";
import { API_BASE_URL, token } from "../../../../services/index";
import { Search } from "@mui/icons-material";

const ChatInterface = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasFirstQueryBeenMade, setHasFirstQueryBeenMade] = useState(false);
  const [sessionId, setSessionId] = useState(
    localStorage.getItem("rag_session_id") || ""
  );

  const dispatch = useDispatch();

  // Sync sessionId state with localStorage
  useEffect(() => {
    const syncSessionIdWithLocalStorage = () => {
      const storedSessionId = localStorage.getItem("rag_session_id");
      if (storedSessionId && storedSessionId !== sessionId) {
        console.log(
          "Detected session ID change in localStorage:",
          storedSessionId
        );
        setSessionId(storedSessionId);
      }
    };

    // Check session ID on initial render
    syncSessionIdWithLocalStorage();

    // Add an event listener for localStorage changes
    window.addEventListener("storage", syncSessionIdWithLocalStorage);

    return () => {
      // Cleanup the event listener
      window.removeEventListener("storage", syncSessionIdWithLocalStorage);
    };
  }, [sessionId]);

  useEffect(() => {
    // If we have a session_id, verify it
    // If we don't, create a new one
    if (sessionId) {
      console.log("Verifying existing session:", sessionId);
      verifySession(sessionId);
    } else {
      createSession();
    }
  }, [sessionId]);

  const createSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "Failed to create session:",
          response.status,
          response.statusText
        );
        return;
      }

      const data = await response.json();
      if (data.session_id) {
        setSessionId(data.session_id);
        localStorage.setItem("rag_session_id", data.session_id);
      }
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const verifySession = async (existingSessionId) => {
    try {
      const endpoint = new URL(`${API_BASE_URL}/api/session/verify`);
      endpoint.searchParams.append("session_id", existingSessionId);

      const response = await fetch(endpoint.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Error verifying session:", response.statusText);
        return;
      }

      const data = await response.json();
      if (data.session_id) {
        // Update session_id if new
        if (data.session_id !== existingSessionId) {
          console.log(
            "Received new session:",
            data.session_id,
            "due to:",
            data.status
          );
          setSessionId(data.session_id);
          localStorage.setItem("rag_session_id", data.session_id);
        } else {
          console.log("Session verified and valid:", data.session_id);
        }
      }
    } catch (error) {
      console.error("Error verifying session:", error);
    }
  };

  const ensureValidSession = async () => {
    if (!sessionId) {
      await createSession();
      return;
    }
    // Verify the current session_id
    await verifySession(sessionId);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchQuery("");
    // Ensure we have a valid session before making the request
    await ensureValidSession();

    // Get the latest session ID from localStorage
    const latestSessionId = localStorage.getItem("rag_session_id");

    if (!latestSessionId) {
      console.error("No session available after verification.");
      return;
    }

    const interactionId = uuidv4();
    dispatch(addInteraction({ query: searchQuery, id: interactionId }));

    try {
      const endpoint = new URL(`${API_BASE_URL}/api/rag-search`);
      console.log("session_id:", latestSessionId);
      endpoint.searchParams.append("query", searchQuery);
      endpoint.searchParams.append("session_id", latestSessionId);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(endpoint.toString(), {
        method: "GET",
        headers,
      });

      if (response.status === 401) {
        // Session may have expired unexpectedly. Attempt to create a new session.
        console.warn(
          "Session may have expired. Attempting to create a new session..."
        );
        await createSession();
        const newSessionId = localStorage.getItem("rag_session_id");
        if (!newSessionId) {
          dispatch(
            updateInteractionResponse({
              id: interactionId,
              response: "Session expired. Please try again.",
            })
          );
          return;
        }
        // Retry the request with the new session_id
        endpoint.searchParams.set("session_id", newSessionId);
        const retryResponse = await fetch(endpoint.toString(), {
          method: "GET",
          headers,
        });
        if (!retryResponse.ok) {
          throw new Error(`Failed on retry: ${retryResponse.statusText}`);
        }
        const retryData = await retryResponse.json();
        dispatch(
          updateInteractionResponse({
            id: interactionId,
            response: retryData || "No response received.",
          })
        );
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch response: ${response.statusText}`);
      }

      const data = await response.json();
      dispatch(
        updateInteractionResponse({
          id: interactionId,
          response: data || "No response received.",
        })
      );
    } catch (error) {
      console.error("Error during search:", error);
      dispatch(
        updateInteractionResponse({
          id: interactionId,
          response: "Failed to fetch response.",
        })
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex justify-center items-center w-full">
      <div className="inline-flex bg-stone-950 px-10 py-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
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

export default ChatInterface;
