import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import UploadModal from './UploadModal';
import axiosInstance from '../axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons'; // Import the delete icon

const Sidebar = ({ setToken }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  // Fetch token from localStorage
  const token = localStorage.getItem('token');

  // Function to fetch and sort sessions by time
  const fetchAndSortSessions = async () => {
    try {
      const response = await axiosInstance.get('/chat/sessions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const sortedSessions = response.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Sort sessions by time
      setSessions(sortedSessions);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  useEffect(() => {
    fetchAndSortSessions();

    // Set up an interval to refresh the list every 5 seconds
    const intervalId = setInterval(() => {
      fetchAndSortSessions();
    }, 5000);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [token]);

  const handleLogout = () => {
    if (setToken) {
      setToken(''); // Clear the authentication token
    }
    localStorage.removeItem('token'); // Clear the token from local storage
    navigate('/login'); // Redirect to the login page
  };

  const createNewSession = async () => {
    try {
      const response = await axiosInstance.post('/chat/sessions', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const newSession = response.data;
      setSessions([newSession, ...sessions]); // Add the new session at the top of the list
      navigate(`/chat/${newSession.id}`);
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };  

  const deleteSession = async (sessionId) => {
    try {
      await axiosInstance.delete(`/chat/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSessions(sessions.filter(session => session.id !== sessionId)); // Remove deleted session from the list
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  return (
    <div className="sidebar">
      <h1>Alphaprobe sessions</h1>
      <div className="sidebar-buttons">
        <button onClick={() => setIsModalOpen(true)} className="upload-link">Upload Files</button>
        <button onClick={createNewSession} className="new-session-button">New Chat Session</button>
      </div>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>
            <div className="session-item">
              <NavLink
                to={`/chat/${session.id}`}
                className={({ isActive }) => isActive ? 'active-session' : ''}
              >
                {session.name || `Session ${session.id}`}
              </NavLink>
              <FontAwesomeIcon 
                icon={faTrashAlt} 
                onClick={() => deleteSession(session.id)} 
                className="delete-session-icon" 
              />
            </div>
          </li>
        ))}
      </ul>
      <UploadModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Sidebar;
