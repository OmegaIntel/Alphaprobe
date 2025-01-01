import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 flex justify-between items-center p-4 bg-white transition-shadow duration-300 ${
        isScrolled ? 'shadow-md' : 'shadow-none'
      }`}
    >
      {/* Logo and Title */}
      <div className="flex items-center gap-2">
        <img
          src="/images/logo.svg"
          alt="Omega Intelligence Logo"
          className="h-8 w-8"
        />
        <span className="text-lg font-semibold text-gray-800">
          Omega Intelligence
        </span>
      </div>

      {/* Navigation Links and Buttons */}
      <div className="flex items-center gap-4">
        <a href="#" className="text-gray-600 hover:text-gray-800">
          How it works
        </a>
        <a href="#" className="text-gray-600 hover:text-gray-800">
          Solutions
        </a>
        <a href="#" className="text-gray-600 hover:text-gray-800">
          Schedule a demo
        </a>

        {/* Login Button (White with Border) */}
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 rounded-md border border-slate-700 text-slate-700 bg-white hover:bg-slate-100 transition-colors"
        >
          Login
        </button>

        {/* Register Button (Filled with Slate Color) */}
        <button
          onClick={() => navigate('/register')}
          className="px-4 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-800 transition-colors"
        >
          Register
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
