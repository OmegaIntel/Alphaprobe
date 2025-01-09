import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const Navbar: FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();

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
        <a
          href="https://calendly.com/chetan-omegaintelligence"
          className="text-gray-600 hover:text-gray-800"
        >
          Schedule a demo
        </a>

        {isAuthenticated ? (
          // If authenticated, show Dashboard button
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
