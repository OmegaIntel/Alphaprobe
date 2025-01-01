import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  addInteraction,
  updateInteractionResponse,
  resetInteractions,
} from "../../../../redux/chatSlice"; // Ensure resetInteractions is imported
import { v4 as uuidv4 } from "uuid";
import { API_BASE_URL, token } from "../../../../services/index";
import { useNavigate } from "react-router-dom";

const ChatSession = ({ onSessionSelect, onFirstQueryMade }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [selectedSessionLoading, setSelectedSessionLoading] = useState(false);
  const [hasFirstQueryBeenMade, setHasFirstQueryBeenMade] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/user-sessions`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Filter sessions with at least one query
        const filteredSessions = data.sessions.filter(
          (session) => session.first_query
        );

        setSessions(filteredSessions);
      } catch (err) {
        setError("Failed to load sessions.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleStartNewConversation = async () => {
    try {
      dispatch(resetInteractions());  
      setActiveSessionId(null);
      localStorage.removeItem("rag_session_id");
  
      
      const response = await fetch(`${API_BASE_URL}/api/new-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
  
   
      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const { session_id } = await response.json();
    
      localStorage.setItem("rag_session_id", session_id);
      setActiveSessionId(session_id);
  
      if (onFirstQueryMade) {
        setHasFirstQueryBeenMade(false);
        onFirstQueryMade();
      }
    } catch (error) {
      console.error("Error creating a new session:", error);
    }
  };

  const handleSessionSelect = async (sessionId) => {
    const currentSessionId = localStorage.getItem("rag_session_id");

    // If the selected session is already active, skip the API call and reset
    if (sessionId === currentSessionId) {
      return;
    }

    // Reset interactions for a new session
    dispatch(resetInteractions());

    setSelectedSessionLoading(true);

    try {
      const url = new URL(`${API_BASE_URL}/api/session/set-active`);
      url.searchParams.append("session_id", sessionId);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();

      setActiveSessionId(sessionId);
      localStorage.setItem("rag_session_id", sessionId);

      if (onSessionSelect) {
        onSessionSelect(data);
      }

      const sessionHistory = data.history || [];
      sessionHistory.forEach((entry) => {
        const interactionId = uuidv4();
        dispatch(
          addInteraction({
            id: interactionId,
            query: entry.query,
          })
        );
        dispatch(
          updateInteractionResponse({
            id: interactionId,
            response: {
              agent_response: entry.response.agent_response,
              metadata_content_pairs: entry.response.metadata_content_pairs,
            },
          })
        );
      });

      // If this is the first query being processed, trigger the parent callback
      if (!hasFirstQueryBeenMade) {
        setHasFirstQueryBeenMade(true);
        if (onFirstQueryMade) {
          onFirstQueryMade();
        }
      }
    } catch (err) {
      console.error("Error setting active session:", err);
    } finally {
      setSelectedSessionLoading(false);
    }
  };

  const groupedSessions = useMemo(() => {
    const now = new Date();
    const grouped = {
      Today: [],
      Yesterday: [],
      "Last 7 Days": [],
      "Last Month": [],
      Older: [],
    };

    sessions.forEach((session) => {
      const sessionDate = new Date(session.last_access_time);
      const diffInDays = Math.floor(
        (now - sessionDate) / (1000 * 60 * 60 * 24)
      );

      if (now.toDateString() === sessionDate.toDateString()) {
        grouped.Today.push(session);
      } else if (diffInDays === 1) {
        grouped.Yesterday.push(session);
      } else if (diffInDays <= 7) {
        grouped["Last 7 Days"].push(session);
      } else if (diffInDays <= 30) {
        grouped["Last Month"].push(session);
      } else {
        grouped.Older.push(session);
      }
    });

    return grouped;
  }, [sessions]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <div className="fixed top-14 left-0 bottom-0 w-1/6 h-[93%] bg-stone-900 text-gray-300 flex flex-col">
      {/* Fixed Header */}
      <div className="p-4 shadow-lg border-b border-gray-700">
        <h2 className="text-lg font-bold">Chat Sessions</h2>
      </div>

      {/* Start New Conversation Button */}
      <div className="p-2 bg-stone-900 hover:bg-stone-950 border-b transition-all duration-200 border-gray-700">
        <button
          onClick={handleStartNewConversation}
          className="w-full text-white rounded text-sm"
        >
          New Conversation
        </button>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 px-4 py-2">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div>
            {Object.keys(groupedSessions)
              .filter((timeRange) => groupedSessions[timeRange].length > 0)
              .map((timeRange) => (
                <div key={timeRange} className="mb-6">
                  <h3 className="text-md font-semibold mb-2">{timeRange}</h3>
                  {groupedSessions[timeRange].map((session, index) => (
                    <div
                      key={index}
                      className={`mb-4 rounded-lg px-2 py-1 cursor-pointer hover:bg-gray-600 transition-all duration-200 ${
                        activeSessionId === session.session_id
                          ? "border-2 border-blue-500"
                          : ""
                      }`}
                      onClick={() => handleSessionSelect(session.session_id)}
                    >
                      <p className="text-sm">{session.first_query}</p>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom Div */}
      <div className="p-4 border-t border-gray-700 bg-stone-900 shadow-md">
        <button
          onClick={handleLogout}
          className="w-full bg-stone-800 text-white py-2 rounded-md text-sm hover:bg-stone-950 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ChatSession;
