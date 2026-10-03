export const getNavbarClasses = (theme, isAuthPage, isSearchOpen, isProfileSidebarOpen, isVisible = true) => {
  const isDark = theme === 'dark';

  // This class hides desktop elements when mobile search is open.
  // It should only apply when not on an auth page.
  const hideDesktopOnMobileSearch = isSearchOpen ? 'hidden md:flex' : '';
  // This class hides elements completely on auth pages.
  const hideOnAuthPage = isAuthPage ? 'hidden' : '';

  return {
    // Main navigation bar container (Smart Sticky: hides on scroll down, reveals on scroll back up)
    navClasses: `sticky top-0 z-30 flex items-center px-4 md:px-8 py-4 transition-all duration-300 ease-in-out gap-4 ${
      isAuthPage ? 'justify-center' : 'justify-between'
    } ${
      isDark
        ? 'bg-[#050510]/80 backdrop-blur-xl border-b border-purple-500/20 text-white shadow-[0_4px_30px_rgba(168,85,247,0.15)]'
        : 'bg-white/80 backdrop-blur-xl border-b border-purple-200 text-gray-900 shadow-[0_4px_30px_rgba(168,85,247,0.05)]'
    } ${isVisible ? 'translate-y-0' : '-translate-y-full'}`,

    // Mobile search overlay
    mobileSearchOverlayClasses: `md:hidden absolute inset-0 flex items-center justify-between px-4 py-8 z-50 gap-4 ${
      isDark ? 'bg-[#050510]/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'
    }`,

    // Mobile search input field
    mobileSearchInputClasses: `flex-1 px-4 py-2 rounded-full border transition-all duration-300 ${
      isDark 
        ? 'bg-[#0f0c29]/60 border-purple-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
        : 'bg-gray-50 border-purple-200 text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
    }`,

    // Mobile search close button
    mobileSearchCloseButtonClasses: 'text-xl p-2 ml-2 hover:scale-110 transition-transform',

    // Logo container (Link)
    logoLinkClasses: `flex items-center gap-2 cursor-pointer shrink-0 group`,

    // Logo image
    logoImageClasses: 'h-10 md:h-12 w-auto group-hover:scale-105 transition-transform duration-300',

    // Logo text (BidBazaar)
    logoTextClasses: 'text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]',

    // Desktop search bar container
    desktopSearchBarContainerClasses: `flex-1 flex justify-center items-center ${hideOnAuthPage} ${hideDesktopOnMobileSearch}`,

    // Desktop search input field
    desktopSearchInputClasses: `hidden md:block md:w-full md:max-w-md px-5 py-2.5 rounded-full border transition-all duration-300 ${
      isDark 
        ? 'bg-[#0f0c29]/60 border-purple-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
        : 'bg-gray-50 border-purple-200 text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
    }`,

    // Right side buttons container
    rightSideButtonsContainerClasses: `flex items-center gap-4 md:gap-6 ${hideOnAuthPage} ${hideDesktopOnMobileSearch}`,

    // "Help" button
    helpButtonClasses: `font-medium text-sm md:text-lg hidden md:block transition-all hover:scale-105 ${
      isDark ? 'text-purple-300 hover:text-purple-400 drop-shadow-[0_0_5px_rgba(216,180,254,0.5)]' : 'text-gray-600 hover:text-purple-600'
    }`,

    // Mobile search trigger button
    mobileSearchTriggerButtonClasses: 'md:hidden text-xl p-1 hover:scale-110 transition-transform',

    // Wishlist button
    wishlistButtonClasses: 'text-xl md:text-2xl hover:scale-110 transition-transform hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]',

    // Theme toggle button
    themeToggleButtonClasses: 'text-xl md:text-2xl transition-transform hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]',

    // Join button (desktop)
    joinButtonClasses: `hidden md:block py-2 px-6 rounded-full font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:scale-105 transition-all duration-300 border-none`,

    // Login icon (mobile)
    loginIconClasses: 'md:hidden text-2xl hover:scale-110 transition-transform text-purple-400',

    // Profile sidebar container (mobile only)
    profileSidebarContainerClasses: `fixed top-0 right-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out ${
      isDark ? 'bg-[#050510]/95 backdrop-blur-2xl border-l border-purple-500/20 text-white' : 'bg-white/95 backdrop-blur-2xl border-l border-purple-200 text-gray-900'
    } flex flex-col p-4 shadow-2xl`,

    // Profile sidebar overlay for blurring background and closing on outside click
    profileSidebarOverlayClasses: `fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
      isProfileSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
    }`,
    // Profile sidebar item classes (for links/buttons inside the sidebar)
    profileSidebarItemClasses: `flex items-center gap-2 py-3 px-4 rounded-xl text-lg font-medium transition-all duration-200 w-full justify-start ${
      isDark ? 'hover:bg-purple-900/50 hover:shadow-[0_0_10px_rgba(168,85,247,0.2)] text-gray-200' : 'hover:bg-purple-100 hover:shadow-sm text-gray-900'
    }`,

    // Profile sidebar close button
    profileSidebarCloseButtonClasses: `self-end text-2xl p-2 hover:scale-110 transition-transform ${isDark ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'}`,

    // Profile icon for desktop (when logged in)
    profileIconDesktopClasses: `hidden md:flex items-center justify-center w-10 h-10 rounded-full text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] hover:scale-110 transition-all duration-300 cursor-pointer`,
    
    // Profile icon for mobile (when logged in)
    profileIconMobileClasses: `md:hidden flex items-center justify-center w-10 h-10 rounded-full text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)] hover:scale-110 transition-all duration-300 cursor-pointer`,
  };
};