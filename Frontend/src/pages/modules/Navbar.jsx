import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import Link, useLocation, and useNavigate
import { useThemeStore } from '@/store/themeStore'; // Import useThemeStore from the store index
import { User, Search, Heart, Sun, MoonStar } from 'lucide-react'; // Import additional Lucide icons (X is now only in ProfileSidebar)
import { ProfileSidebar } from '@/pages/containers/ProfileSidebar'; // Import the new ProfileSidebar component
import { useAuthStore } from '@/store/authStore'; // Import useAuthStore
import { getNavbarClasses } from '@/styles/modules/navbarStyles'; // Import the utility function

const Navbar = () => { // No longer receives theme and toggleTheme as props
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false); // State for profile sidebar
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore(); // Get theme and toggleTheme from Zustand store
  const navigate = useNavigate(); // For programmatic navigation after logout
  const { isLoggedIn, logout, loginMethod, user } = useAuthStore(); // Get isLoggedIn, logout, loginMethod, and user from auth store

  // Determine if current page is a login/register page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';

  // Close mobile search overlay if navigating to an auth page
  useEffect(() => {
    if (isAuthPage && isSearchOpen) {
      setIsSearchOpen(false);
    }
  }, [isAuthPage, isSearchOpen]);

  // Close profile sidebar if navigating to a new page
  useEffect(() => {
    if (isProfileSidebarOpen) {
      setIsProfileSidebarOpen(false);
    }
  }, [location.pathname]); // Close sidebar on route change

  // Get all theme-dependent classes from the utility function
  const {
    navClasses,
    mobileSearchOverlayClasses,
    mobileSearchInputClasses,
    mobileSearchCloseButtonClasses,
    logoLinkClasses,
    logoImageClasses,
    logoTextClasses,
    desktopSearchBarContainerClasses,
    desktopSearchInputClasses,
    rightSideButtonsContainerClasses,
    helpButtonClasses,
    mobileSearchTriggerButtonClasses,
    wishlistButtonClasses,
    themeToggleButtonClasses,
    joinButtonClasses,
    loginIconClasses, // Add loginIconClasses back to destructuring
    profileIconDesktopClasses, // New: Profile icon classes for desktop
    profileSidebarOverlayClasses, // New: Overlay classes for the sidebar
    profileIconMobileClasses, // New: Profile icon classes for mobile
  } = getNavbarClasses(theme, isAuthPage, isSearchOpen, isProfileSidebarOpen); // Pass isProfileSidebarOpen

  // Focus the search input when it becomes visible
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/auctions?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false); // Close mobile search on submit
    }
  };

  return (
    <nav className={navClasses}>
      {/* Mobile Search Overlay */}
      {/* Ensure overlay doesn't show on auth pages */}
      {isSearchOpen && !isAuthPage && ( // Increased vertical padding (py-4 to py-8) and gap (gap-2 to gap-4) for better spacing
        <div className={mobileSearchOverlayClasses}>
          <input
            as="form"
            onSubmit={handleSearch}
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            className={mobileSearchInputClasses}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className={mobileSearchCloseButtonClasses}
            title="Close search"
            aria-label="Close search"
            onClick={() => setIsSearchOpen(false)}
          >
            ✖️
          </button>
        </div>
      )}

      {/* Left Side: Logo Image */}
      <Link to="/" className={logoLinkClasses}>
        <img src="/icon.png" alt="BidBazaar Logo" className={logoImageClasses} />
        <h1 className={logoTextClasses}>BidBazaar</h1>
      </Link>

      {/* Middle: Search Bar (Desktop only, or mobile trigger) */}
      <div className={desktopSearchBarContainerClasses}>
        <form onSubmit={handleSearch} className="w-full max-w-md">
          <input
            type="text"
            placeholder="Search for items..."
            className={desktopSearchInputClasses}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Right Side: Buttons */}
      <div className={rightSideButtonsContainerClasses}>
        <Link to="/help" className={`${helpButtonClasses} hidden md:block`} aria-label="Help">
          Help
        </Link>
        <button
          className={mobileSearchTriggerButtonClasses}
          title="Search"
          aria-label="Open search"
          onClick={() => setIsSearchOpen(true)} // Use Lucide Search icon
        >
          <Search className="h-6 w-6 text-purple-500 " />
        </button>

        {/* Theme toggle button hidden on mobile, shown on desktop, but only if not logged in */}
        {!isLoggedIn && (
          <button onClick={toggleTheme} className={`${themeToggleButtonClasses} hidden md:block`} title="Toggle Theme" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-7 w-7 text-yellow-500 fill-current" /> : <MoonStar className="h-7 w-7 text-blue-800 fill-current" />}
          </button>
        )}

        {isLoggedIn ? ( // Show Profile icon and Logout if logged in
          <>
            {/* Profile icon for bigger screens */}
            {/* Changed to a button to open the sidebar on desktop as well */}
            <button
              onClick={() => setIsProfileSidebarOpen(true)}
              className={profileIconDesktopClasses}
              title="Open Profile Menu" aria-label="Open Profile Menu">
              <User />
            </button>
            {/* Removed user name from Navbar, it will be shown in ProfileSidebar */}
            <button
              onClick={() => setIsProfileSidebarOpen(true)}
              className={profileIconMobileClasses}
              title="Open Profile Menu"
              aria-label="Open Profile Menu"
            >
              <User /> {/* Already a Lucide icon */}
            </button>

            {/* Profile Sidebar Overlay */}
            <div
              className={profileSidebarOverlayClasses}
              onClick={() => setIsProfileSidebarOpen(false)}
              aria-hidden={!isProfileSidebarOpen} // Hide from screen readers when not visible
            ></div>

            {/* Render the ProfileSidebar component */}
            <ProfileSidebar
              isProfileSidebarOpen={isProfileSidebarOpen}
              setIsProfileSidebarOpen={setIsProfileSidebarOpen}
            />
          </>
        ) : ( // Show Join/Login if not logged in
          <>
            <Link to="/login" className={joinButtonClasses}>Join</Link>
            <Link to="/login" className={loginIconClasses} title="Login" aria-label="Login"><User /></Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
