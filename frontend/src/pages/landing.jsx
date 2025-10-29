import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Import your images from the assets folder
import videoCallImage1 from '../utils/images/l.png';
import videoCallImage2 from '../utils/images/p.png';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="py-4 px-6 md:px-12 flex justify-between items-center relative">
        <div className="flex items-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-wider">VideoCaller Pro</h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-gray-400 hover:text-white">Features</a>
          <a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a>
          <button
            onClick={() => navigate('/signup')}
            className="bg-orange-500 px-4 py-2 rounded-md font-semibold hover:bg-orange-600"
          >
            Sign Up
          </button>
        </nav>

        {/* Mobile Menu Icon */}
        <div className="md:hidden">
          <button
            className="text-white focus:outline-none"
            aria-label="Toggle Navigation"
            onClick={toggleMenu}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-gray-900 md:hidden z-50 shadow-lg">
            <nav className="flex flex-col p-4 space-y-4">
              <a
                href="#features"
                className="text-gray-400 hover:text-white py-2 border-b border-gray-700"
                onClick={toggleMenu}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-400 hover:text-white py-2 border-b border-gray-700"
                onClick={toggleMenu}
              >
                Pricing
              </a>
              <button
                onClick={() => {
                  toggleMenu();
                  navigate('/signup');
                }}
                className="bg-orange-500 px-4 py-2 rounded-md font-semibold hover:bg-orange-600 text-center"
              >
                Sign Up
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col md:flex-row items-center justify-between px-6 md:px-12 text-center md:text-left py-10">
        {/* Text Section */}
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            <span className="text-orange-500">Instant</span> Video Calling
          </h2>
          <p className="text-gray-400 mt-4 text-lg md:text-xl">
            Reach friends & colleagues anywhere, anytime. Experience high-quality, secure video communication with VideoCaller Pro.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="bg-orange-500 mt-8 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-orange-600 transition duration-300"
          >
            Try Now
          </button>
          <p className="mt-4 text-gray-500">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-orange-500 hover:text-orange-400 font-semibold"
            >
              Login
            </button>
          </p>
        </div>

        {/* Image Section - Separated Images */}
        <div className="md:w-1/2 flex items-center justify-center gap-4 md:gap-6">
          <img
            src={videoCallImage1}
            alt="Video Call Mobile UI 1"
            className="w-40 md:w-56 lg:w-64 rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300"
          />
          <img
            src={videoCallImage2}
            alt="Video Call Mobile UI 2"
            className="w-40 md:w-56 lg:w-64 rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300"
          />
        </div>
      </main>
    </div>
  );
}

export default LandingPage;
