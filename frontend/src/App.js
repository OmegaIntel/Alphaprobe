// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Chat from './components/Chat';
import Register from './components/Register';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import './App.css';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const handleSetToken = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const isLoggedIn = Boolean(token);

  return (
    <Router>
      <div className="App">
        {isLoggedIn && <Sidebar setToken={handleSetToken} />} {/* Pass setToken as a prop */}
        <div className={`main-content ${isLoggedIn ? 'with-sidebar' : 'without-sidebar'}`}>
          <Routes>
            <Route path="/register" element={isLoggedIn ? <Navigate to="/chat" /> : <Register />} />
            <Route path="/login" element={isLoggedIn ? <Navigate to="/chat" /> : <Login setToken={handleSetToken} />} />
            <Route path="/chat" element={!isLoggedIn ? <Navigate to="/login" /> : <Chat />} />
            <Route path="/" element={!isLoggedIn ? <Navigate to="/login" /> : <Navigate to="/chat" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
