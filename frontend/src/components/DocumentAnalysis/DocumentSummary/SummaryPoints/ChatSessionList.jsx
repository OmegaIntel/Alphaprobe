import React, { useState, useEffect } from "react";
import { API_BASE_URL, token } from "../../../../services/index";

const ChatSession = ({ onSessionSelect }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
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

  const handleSessionSelect = async (sessionId) => {
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
      console.log("Active session set:", data);
  
      // Set the active session ID in state
      setActiveSessionId(sessionId);
  
      // Update session ID in local storage
      localStorage.setItem("rag_session_id", sessionId);
  
      // Notify parent component of the selected session
      if (onSessionSelect) {
        onSessionSelect(data);
      }
    } catch (err) {
      console.error("Error setting active session:", err);
    }
  };
  
  

  const groupSessionsByDate = (sessions) => {
    const now = new Date();
    const grouped = {
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

      if (diffInDays === 1) {
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
  };

  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="fixed top-14 left-0 w-1/5 h-full bg-gray-800 text-white p-4 shadow-lg overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
      <h2 className="text-lg font-bold mb-4">Chat Sessions</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div>
          {Object.keys(groupedSessions)
            .filter((timeRange) => groupedSessions[timeRange].length > 0) // Only show headings with sessions
            .map((timeRange) => (
              <div key={timeRange} className="mb-6">
                <h3 className="text-md font-semibold mb-2">{timeRange}</h3>
                {groupedSessions[timeRange].map((session, index) => (
                  <div
                    key={index}
                    className={`mb-4 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-all duration-200 ${
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
  );
};

export default ChatSession;
