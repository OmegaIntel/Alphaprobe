import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import "../App.css";
import UploadModal from "./UploadModal";
import { marked } from "marked";

const Chat = ({ setToken, updateSidebarSessions }) => {
  const { chatId } = useParams();
  const [companies, setCompanies] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [company, setCompany] = useState(
    localStorage.getItem("selectedCompany") || ""
  ); // Get company from localStorage or default to empty string
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Get token from localStorage
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!chatId) return; // Don't fetch messages if there's no chatId

    const fetchCompanies = async () => {
      try {
        const response = await axiosInstance.get("/companies", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCompanies(response.data.companies);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    fetchCompanies();
  }, [token, chatId]);

  useEffect(() => {
    if (!chatId) return; // Don't fetch messages if there's no chatId

    const fetchMessages = async () => {
      try {
        const response = await axiosInstance.get(`/chat/${chatId}/messages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setConversation(response.data.messages);
      } catch (error) {
        console.error("Error fetching chat messages:", error);
      }
    };
    fetchMessages();
  }, [chatId, token]);

  const sendMessage = async () => {
    if (!message.trim() || !company) return;

    const newMessage = { role: "user", content: message };
    setConversation((prevConversation) => [...prevConversation, newMessage]);
    setMessage("");
    setIsTyping(true);

    try {
      const response = await axiosInstance.post(
        `/chat/${chatId}/message`,
        {
          content: message,
          company, // Include the selected company in the request payload
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const aiResponse = response.data.response;
      setConversation((prevConversation) => [
        ...prevConversation,
        { role: "ai", content: aiResponse },
      ]);

      // Generate a summary for the session name
      const summary = generateSessionSummary([
        ...conversation,
        { role: "ai", content: aiResponse },
      ]);

      // Update session name in the database
      await updateSessionName(chatId, summary);

      // Update sidebar sessions
      updateSidebarSessions();
    } catch (error) {
      console.error("Error sending message:", error);
      setConversation((prevConversation) => [
        ...prevConversation,
        {
          role: "ai",
          content: "An error occurred while processing your request.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateSessionSummary = (conversation) => {
    // Simple logic to generate a summary based on the last few messages
    const lastFewMessages = conversation
      .slice(-3)
      .map((msg) => msg.content)
      .join(" ")
      .slice(0, 50);
    return lastFewMessages.length > 50
      ? `${lastFewMessages}...`
      : lastFewMessages;
  };

  const updateSessionName = async (sessionId, sessionName) => {
    try {
      await axiosInstance.put(
        `/chat/sessions/${sessionId}/name`,
        { session_name: sessionName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error updating session name:", error);
    }
  };

  useEffect(() => {
    const chatContainer = document.querySelector(".chat-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [conversation, isTyping]);

  const handleLogout = () => {
    setToken(""); // Clear the authentication token
    localStorage.removeItem("token"); // Clear the token from local storage
    navigate("/login"); // Redirect to the login page
  };

  const handleCreateSession = async () => {
    try {
      const response = await axiosInstance.post(
        "/chat/sessions",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const newSession = response.data;
      navigate(`/chat/${newSession.id}`);
      updateSidebarSessions();
    } catch (error) {
      console.error("Error creating new session:", error);
    }
  };

  const handleCompanyChange = (e) => {
    const selectedCompany = e.target.value;
    setCompany(selectedCompany);
    localStorage.setItem("selectedCompany", selectedCompany); // Store selected company in localStorage
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default behavior of Enter key
      sendMessage(); // Send the message
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault(); // Prevent default behavior of Enter key
      setMessage((prevMessage) => prevMessage + "\n"); // Add a new line to the message
    }
  };

  return (
    <div className="main-container">
      {!chatId ? (
        <div className="center-content">
          <button
            onClick={handleCreateSession}
            className="create-session-button"
          >
            Create New Session
          </button>
        </div>
      ) : (
        <>
          <div className="chat-container">
            <button onClick={handleLogout} className="logout-button">
              <i className="fas fa-sign-out-alt"></i>
            </button>
            {conversation.map((msg, index) => (
              <div key={index} className={`message ${msg.role}-message`}>
                {msg.role === "ai" ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: marked(msg.content) }}
                  />
                ) : (
                  <pre>{msg.content}</pre>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="message ai-message typing-animation">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
          <div className="input-container">
            <select onChange={handleCompanyChange} value={company}>
              <option value="" disabled>
                Select a company
              </option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown} // Handle keydown events
              placeholder="Ask any question about the company..."
              rows="1"
              disabled={isTyping}
            />
            <button onClick={sendMessage} disabled={isTyping}>
              {isTyping ? "Sending..." : "Send Message"}
            </button>
          </div>
        </>
      )}
      <UploadModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Chat;
