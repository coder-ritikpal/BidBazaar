import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useCartStore } from '@/store/cartStore';
import { 
  CircleUserRound, 
  Heart, 
  LogOut, 
  Sun, 
  MoonStar, 
  X, 
  ShoppingCart, 
  HelpCircle, 
  Gavel, 
  Tags,
  ChevronRight
} from 'lucide-react';
import { getProfileSidebarClasses } from '@/styles/containers/profileSidebarStyles';

export const ProfileSidebar = ({ isProfileSidebarOpen, setIsProfileSidebarOpen }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { wishlist } = useDashboardStore();
  const { myOrders } = useCartStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isProfileSidebarOpen) {
        setIsProfileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileSidebarOpen, setIsProfileSidebarOpen]);

  // Style classes
  const classes = getProfileSidebarClasses(theme, isProfileSidebarOpen);

  const handleLogout = async () => {
    setIsProfileSidebarOpen(false);
    await logout();
    navigate('/');
  };

  const initials = (user?.fullName?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const displayName = user?.fullName?.firstName 
    ? `${user.fullName.firstName} ${user.fullName.lastName || ''}`.trim() 
    : user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';

  const wishlistCount = wishlist?.length || 0;
  const cartCount = myOrders?.filter(o => o.status === 'pending_payment')?.length || 0;

  return (
    <aside className={classes.sidebarClasses} aria-label="Profile navigation sidebar">
      {/* Header with User Avatar */}
      <div className={classes.headerClasses}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={classes.avatarClasses}>
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className={classes.userNameClasses}>
              {displayName}
            </h2>
            {email && (
              <p className={classes.userEmailClasses} title={email}>
                {email}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsProfileSidebarOpen(false)}
          className={classes.closeButtonClasses}
          aria-label="Close profile sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className={classes.navContainerClasses}>
        {/* Section 1: Account */}
        <div>
          <p className={classes.sectionTitleClasses}>Account</p>
          <div className={classes.navGroupClasses}>
            <Link 
              to="/profile" 
              className={classes.getNavLinkClasses(location.pathname === '/profile')} 
              onClick={() => setIsProfileSidebarOpen(false)}
            >
              <div className="flex items-center gap-2.5">
                <CircleUserRound size={15} className="text-purple-500" />
                <span>My Profile</span>
              </div>
              <ChevronRight size={13} className="opacity-40" />
            </Link>
          </div>
        </div>

        {/* Section 2: Marketplace Activity */}
        <div>
          <p className={classes.sectionTitleClasses}>Activity</p>
          <div className={classes.navGroupClasses}>
            <Link 
              to="/your-auctions" 
              className={classes.getNavLinkClasses(location.pathname === '/your-auctions')} 
              onClick={() => setIsProfileSidebarOpen(false)}
            >
              <div className="flex items-center gap-2.5">
                <Gavel size={15} className="text-amber-500" />
                <span>Enrolled Auctions</span>
              </div>
              <ChevronRight size={13} className="opacity-40" />
            </Link>

            <Link 
              to="/listed-items" 
              className={classes.getNavLinkClasses(location.pathname === '/listed-items')} 
              onClick={() => setIsProfileSidebarOpen(false)}
            >
              <div className="flex items-center gap-2.5">
                <Tags size={15} className="text-emerald-500" />
                <span>My Listings</span>
              </div>
              <ChevronRight size={13} className="opacity-40" />
            </Link>

            <Link 
              to="/orders" 
              className={classes.getNavLinkClasses(location.pathname === '/orders')} 
              onClick={() => setIsProfileSidebarOpen(false)}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={15} className="text-blue-500" />
                <span>Cart & Orders</span>
              </div>
              {cartCount > 0 ? (
                <span className={classes.badgeClasses}>{cartCount}</span>
              ) : (
                <ChevronRight size={13} className="opacity-40" />
              )}
            </Link>

            <Link 
              to="/wishlist" 
              className={classes.getNavLinkClasses(location.pathname === '/wishlist')} 
              onClick={() => setIsProfileSidebarOpen(false)}
            >
              <div className="flex items-center gap-2.5">
                <Heart size={15} className="text-rose-500" />
                <span>Wishlist</span>
              </div>
              {wishlistCount > 0 ? (
                <span className={classes.badgeClasses}>{wishlistCount}</span>
              ) : (
                <ChevronRight size={13} className="opacity-40" />
              )}
            </Link>
          </div>
        </div>

        {/* Section 3: Preferences & Help */}
        <div>
          <p className={classes.sectionTitleClasses}>Preferences</p>
          <div className={classes.navGroupClasses}>
            <button 
              onClick={toggleTheme} 
              className={classes.themeToggleClasses} 
              aria-label="Toggle theme"
            >
              <div className="flex items-center gap-2.5">
                {theme === 'dark' ? (
                  <Sun size={15} className="text-yellow-400" />
                ) : (
                  <MoonStar size={15} className="text-indigo-500" />
                )}
                <span>Appearance</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>

            <Link 
              to="/how-it-works" 
              className={classes.getNavLinkClasses(location.pathname === '/how-it-works')} 
              onClick={() => setIsProfileSidebarOpen(false)}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle size={15} className="text-cyan-500" />
                <span>How It Works</span>
              </div>
              <ChevronRight size={13} className="opacity-40" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Pinned Footer with Logout */}
      <div className={classes.footerClasses}>
        <button onClick={handleLogout} className={classes.logoutButtonClasses}>
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};