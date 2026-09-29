// src/styles/profileSidebarStyles.js
export const getProfileSidebarClasses = (theme, isProfileSidebarOpen) => {
  const isDark = theme === 'dark';
  const baseClasses = "fixed top-0 right-0 h-full w-80 max-w-[85vw] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out z-50 backdrop-blur-xl";
  const openClass = "translate-x-0";
  const closedClass = "translate-x-full";

  const background = isDark 
    ? 'bg-gray-900/95 border-l border-gray-800 text-gray-100' 
    : 'bg-white/95 border-l border-gray-200 text-gray-900';

  return {
    sidebarClasses: `${baseClasses} ${background} ${isProfileSidebarOpen ? openClass : closedClass}`,
    headerClasses: `flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`,
    avatarClasses: `w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shadow-md bg-gradient-to-tr from-purple-600 to-indigo-500`,
    userNameClasses: `font-bold text-base leading-tight truncate text-gray-900 dark:text-white`,
    userEmailClasses: `text-xs text-gray-500 dark:text-gray-400 truncate max-w-[170px]`,
    closeButtonClasses: `p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`,
    navContainerClasses: `flex-1 overflow-y-auto px-4 py-4 space-y-6`,
    sectionTitleClasses: `px-3 text-xs font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-500 mb-2`,
    navGroupClasses: `space-y-1`,
    getNavLinkClasses: (isActive) => `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive 
        ? (isDark ? 'bg-purple-600/20 text-purple-300 shadow-sm' : 'bg-purple-50 text-purple-700 shadow-sm font-semibold')
        : (isDark ? 'text-gray-300 hover:bg-gray-800/70 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
    }`,
    badgeClasses: `px-2 py-0.5 text-xs font-semibold rounded-full ${
      isDark ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' : 'bg-purple-100 text-purple-700'
    }`,
    themeToggleClasses: `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isDark ? 'text-gray-300 hover:bg-gray-800/70 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`,
    footerClasses: `p-4 border-t ${isDark ? 'border-gray-800 bg-gray-950/40' : 'border-gray-100 bg-gray-50/50'}`,
    logoutButtonClasses: `w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200/80 dark:border-red-900/40 transition-all duration-200 shadow-sm hover:shadow`,
  };
};