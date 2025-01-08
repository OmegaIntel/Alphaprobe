import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../services';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const verifyToken = async (currentToken) => {
    if (!currentToken) return;

    try {
      const formData = new FormData();
      formData.append('token', currentToken);

      const response = await fetch(`${API_BASE_URL}/api/token/verify`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // If the server returns an error, treat as invalid token
        clearToken();
        return;
      }

      const data = await response.json();
      if (data.valid === false) {
        // Token expired or invalid, clear it
        clearToken();
      } else {
        // Token is valid
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      // If verification fails (e.g., network error), assume invalid
      clearToken();
    }
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    // On initial load, verify the token if it exists
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white transition-shadow duration-300">
      {/* Logo and Title */}
      <div className="flex items-center gap-2">
        <img src="/images/logo.svg" alt="Omega Intelligence Logo" className="h-8 w-8" />
        <span className="text-lg font-semibold text-gray-800">Omega Intelligence</span>
      </div>

      {/* Navigation Links and Buttons */}
      <div className="flex items-center gap-4">
        <a href="#" className="text-gray-600 hover:text-gray-800">How it works</a>
        <a href="#" className="text-gray-600 hover:text-gray-800">Solutions</a>
        <a href="https://calendly.com/chetan-omegaintelligence " className="text-gray-600 hover:text-gray-800">Schedule a demo</a>

        {isAuthenticated ? (
          // If authenticated, show Dashboard
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-800 transition-colors"
          >
            Dashboard
          </button>
        ) : (
          // If not authenticated, show Login and Register buttons
          <>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-md border border-slate-700 text-slate-700 bg-white hover:bg-slate-100 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
