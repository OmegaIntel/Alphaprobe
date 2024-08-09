// components/Sidebar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UploadModal from './UploadModal';

const Sidebar = ({ setToken }) => { // Destructure setToken from props
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(''); // Clear the authentication token
    localStorage.removeItem('token'); // Clear the token from local storage
    navigate('/login'); // Redirect to the login page
  };

  return (
    <div className="sidebar">
      <h1>Chat sessions</h1>
      <ul>
        <li>
          <Link to="/chat">Chat</Link>
        </li>
        <li>
          <Link to="#" onClick={() => setIsModalOpen(true)}>Upload</Link>
        </li>
        <li>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </li>
      </ul>
      <UploadModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Sidebar;
