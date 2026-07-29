export const getNavbarClasses = (theme, isAuthPage, isSearchOpen, isProfileSidebarOpen) => {
  const isDark = theme === 'dark';

  // This class hides desktop elements when mobile search is open.
  // It should only apply when not on an auth page.
  const hideDesktopOnMobileSearch = isSearchOpen ? 'hidden md:flex' : '';
  // This class hides elements completely on auth pages.
  const hideOnAuthPage = isAuthPage ? 'hidden' : '';

  return {
    // Main navigation bar container
    navClasses: `flex items-center px-4 md:px-8 py-4 shadow-md transition-colors duration-300 gap-4 ${isAuthPage ? 'justify-center' : 'justify-between'} ${
      isDark ? 'bg-gray-900 border-b border-purple-800 text-white' : 'bg-gray-100 border-b border-gray-300 text-gray-900'
    } relative`,

    // Mobile search overlay
    mobileSearchOverlayClasses: `md:hidden absolute inset-0 flex items-center justify-between px-4 py-8 z-50 gap-4 ${
      isDark ? 'bg-black/95' : 'bg-white'
    }`,

    // Mobile search input field
    mobileSearchInputClasses: `flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
      isDark ? 'bg-gray-900 border-purple-700 text-white placeholder-gray-400 focus:border-purple-500' : 'bg-white border-gray-300 text-gray-900'
    }`,

    // Mobile search close button
    mobileSearchCloseButtonClasses: 'text-xl p-2 ml-2',

    // Logo container (Link)
    logoLinkClasses: `flex items-center gap-2 cursor-pointer shrink-0`, // Always visible, no conditional hiding here

    // Logo image
    logoImageClasses: 'h-10 md:h-12 w-auto',

    // Logo text (BidBazaar)
    logoTextClasses: 'text-xl md:text-3xl font-bold text-purple-600', // Always visible

    // Desktop search bar container
    desktopSearchBarContainerClasses: `flex-1 flex justify-center items-center ${hideOnAuthPage} ${hideDesktopOnMobileSearch}`,

    // Desktop search input field
    desktopSearchInputClasses: `hidden md:block md:w-full md:max-w-md px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
      isDark ? 'bg-gray-700 border-purple-700 text-white placeholder-gray-400 focus:border-purple-500' : 'bg-white border-gray-300 text-gray-900'
    }`,

    // Right side buttons container
    rightSideButtonsContainerClasses: `flex items-center gap-4 md:gap-6 ${hideOnAuthPage} ${hideDesktopOnMobileSearch}`,

    // "Help" button
    helpButtonClasses: `font-medium text-sm md:text-lg hidden md:block transition-colors ${
      isDark ? 'text-purple-300 hover:text-purple-400' : 'text-gray-600 hover:text-gray-800'
    }`,

    // Mobile search trigger button
    mobileSearchTriggerButtonClasses: 'md:hidden text-xl p-1',

    // Wishlist button
    wishlistButtonClasses: 'text-xl md:text-2xl hover:scale-110 transition-transform',

    // Theme toggle button
    themeToggleButtonClasses: 'text-xl md:text-2xl transition-transform',

    // Join button (desktop)
    joinButtonClasses: `hidden md:block py-2 px-4 rounded-md font-semibold transition-colors duration-300 ${
      isDark ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
    }`,

    // Login icon (mobile)
    loginIconClasses: 'md:hidden text-2xl',

    // Profile sidebar container (mobile only)
    profileSidebarContainerClasses: `fixed top-0 right-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out ${ // Removed md:hidden
      isDark ? 'bg-gray-800 border-l border-purple-800 text-white' : 'bg-white border-l border-gray-300 text-gray-900'
    } flex flex-col p-4 shadow-lg`,

    // Profile sidebar overlay for blurring background and closing on outside click
    profileSidebarOverlayClasses: `fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
      isProfileSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
    }`,
    // Profile sidebar item classes (for links/buttons inside the sidebar)
    profileSidebarItemClasses: `flex items-center gap-2 py-3 px-4 rounded-md text-lg font-medium transition-colors duration-200 w-full justify-start ${
      isDark ? 'hover:bg-purple-700 text-gray-200' : 'hover:bg-purple-700 text-gray-900'
    }`,

    // Profile sidebar close button
    profileSidebarCloseButtonClasses: `self-end text-2xl p-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`,

    // Profile icon for desktop (when logged in)
    // No background, light purple text, replaces the visual space of the join button
    profileIconDesktopClasses: `hidden md:flex items-center justify-center w-10 h-10 rounded-full text-2xl transition-colors duration-300 ${
      isDark ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
    }`,
    // Profile icon for mobile (when logged in)
    // No background, light purple text, replaces the visual space of the login icon
    profileIconMobileClasses: `md:hidden flex items-center justify-center w-10 h-10 rounded-full text-2xl transition-colors duration-300 ${
      isDark ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
    }`,
  };
};