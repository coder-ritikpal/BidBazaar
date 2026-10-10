// src/styles/profileSidebarStyles.js
export const getProfileSidebarClasses = (theme, isProfileSidebarOpen) => {
  const isDark = theme === 'dark';
  const baseClasses = "fixed top-0 bottom-0 right-0 h-[100dvh] max-h-[100dvh] w-80 max-w-[85vw] shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out z-50 backdrop-blur-xl overflow-hidden";
  const openClass = "translate-x-0";
  const closedClass = "translate-x-full";

  const background = isDark 
    ? 'bg-gray-900/95 border-l border-gray-800 text-gray-100' 
    : 'bg-white/95 border-l border-gray-200 text-gray-900';

  return {
    sidebarClasses: `${baseClasses} ${background} ${isProfileSidebarOpen ? openClass : closedClass}`,
    headerClasses: `flex items-center justify-between px-4 py-3 border-b shrink-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`,
    avatarClasses: `w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm bg-linear-to-tr from-purple-600 to-indigo-500 shrink-0`,
    userNameClasses: `font-semibold text-xs sm:text-sm leading-tight truncate text-gray-900 dark:text-white`,
    userEmailClasses: `text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[170px]`,
    closeButtonClasses: `p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer`,
    navContainerClasses: `flex-1 overflow-y-auto overscroll-contain px-3 py-2.5 space-y-3`,
    sectionTitleClasses: `px-2 text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 mb-1`,
    navGroupClasses: `space-y-1`,
    getNavLinkClasses: (isActive) => `flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
      isActive 
        ? (isDark ? 'bg-purple-600/20 text-purple-300 shadow-sm font-semibold' : 'bg-purple-50 text-purple-700 shadow-sm font-semibold')
        : (isDark ? 'text-gray-300 hover:bg-gray-800/70 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
    }`,
    badgeClasses: `px-1.5 py-0.2 text-[10px] font-semibold rounded-full ${
      isDark ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' : 'bg-purple-100 text-purple-700'
    }`,
    themeToggleClasses: `w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
      isDark ? 'text-gray-300 hover:bg-gray-800/70 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`,
    footerClasses: `p-3 border-t shrink-0 ${isDark ? 'border-gray-800 bg-gray-950/90' : 'border-gray-100 bg-gray-50/95'} pb-[max(0.75rem,env(safe-area-inset-bottom))]`,
    logoutButtonClasses: `w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200/80 dark:border-red-900/40 transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer active:scale-95`,
  };
};