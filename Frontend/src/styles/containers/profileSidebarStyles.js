// src/styles/profileSidebarStyles.js
export const getProfileSidebarClasses = (theme, isProfileSidebarOpen) => {
  const baseClasses = "fixed top-0 right-0 h-full w-64 shadow-lg transform transition-transform duration-300 ease-in-out z-50";
  const openClass = "translate-x-0";
  const closedClass = "translate-x-full";

  // In light mode, set default text to full black.
  const background = theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-black';
  const border = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = 'hover:bg-purple-700'; // Ensure purple hover background for both dark and light modes

  // When hovering over the dark purple background (hover:bg-purple-700), the text should always be white for readability.
  const hoverTextColor = 'hover:text-white';

  return {
    sidebarClasses: `${baseClasses} ${background} ${isProfileSidebarOpen ? openClass : closedClass}`,
    closeButtonClasses: `p-2 rounded-full ${hoverBg} ${hoverTextColor} transition-colors duration-200`,
    userInfoClasses: `text-lg font-semibold flex items-center`,
    userNameClasses: `text-purple-500`,
    navLinkClasses: `flex items-center p-2 rounded-md ${hoverBg} ${hoverTextColor} transition-colors duration-200 group`, // Added group for potential icon color changes
    themeToggleButtonClasses: `flex items-center p-2 rounded-md ${hoverBg} ${hoverTextColor} transition-colors duration-200 w-full text-left group`, // Added group
    logoutButtonClasses: `flex items-center p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 mt-4 w-full`,
  };
};