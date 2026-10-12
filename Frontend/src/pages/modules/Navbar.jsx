import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import Link, useLocation, and useNavigate
import { useThemeStore } from '@/store/themeStore'; // Import useThemeStore from the store index
import { User, Search, Sun, MoonStar, X } from 'lucide-react'; // Import additional Lucide icons
import { ProfileSidebar } from '@/pages/containers/ProfileSidebar'; // Import the new ProfileSidebar component
import { useAuthStore } from '@/store/authStore'; // Import useAuthStore
import { getNavbarClasses } from '@/styles/modules/navbarStyles'; // Import the utility function

const Navbar = () => { // No longer receives theme and toggleTheme as props
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false); // State for profile sidebar
  const [isVisible, setIsVisible] = useState(true); // State for smart sticky navbar
  const lastScrollY = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore(); // Get theme and toggleTheme from Zustand store
  const navigate = useNavigate(); // For programmatic navigation after logout
  const { isLoggedIn } = useAuthStore();

  // Determine if current page is a login/register page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';

  // Smart sticky scroll: hide on scroll down, show when scrolling back up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;

      // Always show near top of page
      if (currentScrollY <= 80) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Keep visible if search or sidebar is active
      if (isProfileSidebarOpen || isSearchOpen) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Ignore rubber-band bounce past bottom of document on touch screens
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (currentScrollY > maxScroll) {
        return;
      }

      // If scrolling UP by any amount, reveal navbar immediately
      if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
      } else if (currentScrollY > lastScrollY.current + 8) {
        // If scrolling DOWN by more than threshold, hide navbar
        setIsVisible(false);
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isProfileSidebarOpen, isSearchOpen]);

  // Always reset navbar to visible on route change
  useEffect(() => {
    setIsVisible(true);
  }, [location.pathname]);

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
    themeToggleButtonClasses,
    joinButtonClasses,
    loginIconClasses, // Add loginIconClasses back to destructuring
    profileIconDesktopClasses, // New: Profile icon classes for desktop
    profileIconMobileClasses, // New: Profile icon classes for mobile
  } = getNavbarClasses(theme, isAuthPage, isSearchOpen, isProfileSidebarOpen, isVisible); // Pass isVisible

  // Focus the search input when it becomes visible
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearch = (e) => {
    if (e) {
      e.preventDefault();
    }
    if (searchQuery.trim()) {
      navigate(`/auctions?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false); // Close mobile search on submit
    }
  };

  return (
    <>
      <nav className={navClasses}>
        {/* Mobile Search Overlay */}
        {/* Ensure overlay doesn't show on auth pages */}
        {isSearchOpen && !isAuthPage && (
          <div className={mobileSearchOverlayClasses}>
            <form onSubmit={handleSearch} action="#" className="flex-1 flex items-center">
              <div className="relative w-full flex items-center">
                <input
                  ref={searchInputRef}
                  type="search"
                  enterKeyHint="search"
                  placeholder="Search for items..."
                  className={mobileSearchInputClasses}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  className="absolute right-2.5 p-1 text-purple-400 hover:text-purple-300"
                  aria-label="Search"
                  title="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
            <button
              type="button"
              className={mobileSearchCloseButtonClasses}
              title="Close search"
              aria-label="Close search"
              onClick={() => setIsSearchOpen(false)}
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-200" />
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
          <form onSubmit={handleSearch} action="#" className="w-full max-w-md">
            <input
              type="search"
              enterKeyHint="search"
              placeholder="Search for items..."
              className={desktopSearchInputClasses}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                }
              }}
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
              <button
                onClick={() => setIsProfileSidebarOpen(true)}
                className={profileIconDesktopClasses}
                title="Open Profile Menu" aria-label="Open Profile Menu">
                <User />
              </button>
              {/* Profile icon for mobile */}
              <button
                onClick={() => setIsProfileSidebarOpen(true)}
                className={profileIconMobileClasses}
                title="Open Profile Menu"
                aria-label="Open Profile Menu"
              >
                <User /> {/* Already a Lucide icon */}
              </button>
            </>
          ) : ( // Show Join/Login if not logged in
            <>
              <Link to="/login" className={joinButtonClasses}>Join</Link>
              <Link to="/login" className={loginIconClasses} title="Login" aria-label="Login"><User /></Link>
            </>
          )}
        </div>
      </nav>

      {/* Render the ProfileSidebar component outside nav to prevent CSS transform containment */}
      {isLoggedIn && (
        <ProfileSidebar
          isProfileSidebarOpen={isProfileSidebarOpen}
          setIsProfileSidebarOpen={setIsProfileSidebarOpen}
        />
      )}
    </>
  );
}

export default Navbar
