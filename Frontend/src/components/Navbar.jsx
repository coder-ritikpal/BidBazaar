import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'; // Import Link and useLocation

const Navbar = ({ theme, toggleTheme }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const location = useLocation(); // Get current location

  // Determine if current page is a login/register page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Close mobile search overlay if navigating to an auth page
  useEffect(() => {
    if (isAuthPage && isSearchOpen) {
      setIsSearchOpen(false);
    }
  }, [isAuthPage, isSearchOpen]);

  // Determine base visibility class for non-auth pages
  const baseVisibilityClass = isSearchOpen ? 'hidden md:flex' : '';

  // Focus the search input when it becomes visible
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <nav className={`flex justify-between items-center px-4 md:px-8 py-4 shadow-md transition-colors duration-300 gap-4 ${theme === 'dark' ? 'bg-gray-900/80 backdrop-blur-md border-b border-gray-700' : 'bg-white'} relative`}>
      {/* Mobile Search Overlay */}
      {/* Ensure overlay doesn't show on auth pages */}
      {isSearchOpen && !isAuthPage && ( // Increased vertical padding (py-4 to py-8) and gap (gap-2 to gap-4) for better spacing
        <div className={`md:hidden absolute inset-0 flex items-center justify-between px-4 py-8 z-50 gap-4 ${theme === 'dark' ? 'bg-gray-900/95' : 'bg-white'}`}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            className={`flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
          />
          <button
            className="text-xl p-2 ml-2"
            title="Close search"
            aria-label="Close search"
            onClick={() => setIsSearchOpen(false)}
          >
            ✖️
          </button>
        </div>
      )}

      {/* Left Side: Logo Image */}
      <div className={`flex items-center gap-2 cursor-pointer shrink-0 ${isAuthPage ? 'hidden' : baseVisibilityClass}`}>
        <img src="/icon.png" alt="BidBazaar Logo" className="h-10 md:h-12 w-auto" />
        <h1 className="text-xl md:text-3xl font-bold text-purple-600">BidBazaar</h1>
      </div>

      {/* Middle: Search Bar (Desktop only, or mobile trigger) */}
      <div className={`flex-1 flex justify-center items-center ${isAuthPage ? 'hidden' : baseVisibilityClass}`}>
        {/* Mobile search trigger button */}
        {/* Desktop search input */}
        <input
          type="text"
          placeholder="Search..."
          className={`hidden md:block md:w-full md:max-w-md px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
        />
      </div>

      {/* Right Side: Buttons */}
      <div className={`flex items-center gap-3 md:gap-6 ${isAuthPage ? 'hidden' : baseVisibilityClass}`}>
        <button className={`font-medium text-sm md:text-lg hidden lg:block transition-colors ${theme === 'dark' ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'}`} aria-label="How it works?">
          How it works?
        </button>
         <button 
          className="md:hidden text-xl p-1" 
          title="Search"
          aria-label="Open search"
          onClick={() => setIsSearchOpen(true)}
        >
          🔍
        </button>
        <button className="text-xl md:text-2xl hover:scale-110 transition-transform" title="Wishlist" aria-label="Wishlist">
          ❤️
        </button>
        {/* Mobile search trigger button */}
       
        <button onClick={toggleTheme} className="text-xl md:text-2xl transition-transform" title="Toggle Theme" aria-label="Toggle theme">
          {theme === 'dark' ? '🌞' : '🌛'}
        </button>
        <Link to="/login" className="md:hidden text-2xl" title="Profile" aria-label="Profile">
          👤
        </Link>
        <Link to="/register" className={`hidden md:block py-2 px-4 rounded-md font-semibold transition-colors duration-300 ${theme === 'dark' ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
          Join
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
