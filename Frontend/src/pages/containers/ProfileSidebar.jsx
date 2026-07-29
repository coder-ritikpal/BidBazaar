import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { CircleUserRound,Smile, Heart, LogOut, Sun, MoonStar, X, ShoppingCart, HelpCircle,Gavel,Tags} from 'lucide-react';
// Assuming a utility function for classes will be created, similar to getNavbarClasses
import { getProfileSidebarClasses } from '@/styles/containers/profileSidebarStyles'; // Placeholder

export const ProfileSidebar = ({ isProfileSidebarOpen, setIsProfileSidebarOpen }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  // Get all theme-dependent classes from the utility function
  const {
    sidebarClasses,
    closeButtonClasses,
    userInfoClasses,
    userNameClasses,
    navLinkClasses,
    themeToggleButtonClasses,
    logoutButtonClasses,
  } = getProfileSidebarClasses(theme, isProfileSidebarOpen); // Pass theme and open state

  const handleLogout = () => {
    logout();
    setIsProfileSidebarOpen(false); // Close sidebar after logout
    navigate('/'); // Redirect to home page
  };

  return (
    <aside className={sidebarClasses}>
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className={userInfoClasses}>
          <Smile className="inline-block mr-2" size={20} />
          Hello, <span className={userNameClasses}>{user?.fullName?.firstName || user?.email || 'User'}</span>!
        </h2>
        <button
          onClick={() => setIsProfileSidebarOpen(false)}
          className={closeButtonClasses}
          aria-label="Close profile sidebar"
        >
          <X size={24} />
        </button>
      </div>
      <nav className="flex flex-col p-4 space-y-2">
        <Link to="/profile" className={navLinkClasses} onClick={() => setIsProfileSidebarOpen(false)}>
          <CircleUserRound size={20} className="mr-2" /> My Profile
        </Link>
        <Link to="/wishlist" className={navLinkClasses} onClick={() => setIsProfileSidebarOpen(false)}>
          <Heart size={20} className="mr-2" /> Wishlist
        </Link>
        <Link to="/your-auctions" className={navLinkClasses} onClick={() => setIsProfileSidebarOpen(false)}>
          <Gavel size={20} className="mr-2" />  Auctions
        </Link>
        <Link to="/listed-items" className={navLinkClasses} onClick={() => setIsProfileSidebarOpen(false)}>
          <Tags size={20} className="mr-2" /> Listed Items
        </Link>
        <Link to="/orders" className={navLinkClasses} onClick={() => setIsProfileSidebarOpen(false)}>
          <ShoppingCart size={20} className="mr-2" /> Cart
        </Link>
        <Link to="/how-it-works" className={navLinkClasses} onClick={() => setIsProfileSidebarOpen(false)}>
          <HelpCircle size={20} className="mr-2" /> How It Works
        </Link>
        
        {/* Add more links as needed */}
        <button onClick={toggleTheme} className={themeToggleButtonClasses} title="Toggle Theme" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-500 fill-current mr-2" /> : <MoonStar className="h-5 w-5 text-blue-400 fill-current mr-2" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout} className={logoutButtonClasses}>
          <LogOut size={20} className="mr-2" /> Logout
        </button>
      </nav>
    </aside>
  );
};