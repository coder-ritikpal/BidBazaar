export const getFooterClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    footerContainer: `w-full py-8 px-4 sm:px-6 lg:px-8 mt-0 ${
      isDark ? 'bg-gradient-to-r from-slate-950 to-purple-900 text-green border-t border-purple-800' : 'bg-gradient-to-r from-gray-100 to-purple-200 text-gray-700 border-t border-gray-300'
    } transition-colors duration-300`,
    contentWrapper: 'max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8',
    sectionHeading: `text-lg font-semibold mb-4 ${
      isDark ? 'text-white' : 'text-gray-900'
    }`,
    linkList: 'space-y-2',
    linkItem: `block text-sm ${
      isDark ? 'text-gray-400 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
    } transition-colors duration-200`,
    socialIconsContainer: 'flex space-x-4 mt-4',
    socialIcon: `text-2xl ${
      isDark ? 'text-gray-400 hover:text-green-500' : 'text-gray-600 hover:text-gray-900'
    } transition-colors duration-200`,
    copyrightText: `text-center text-sm mt-8 ${
      isDark ? 'text-gray-300' : 'text-gray-900'
    }`,
    // Specific styles for the "About Us" description
    aboutUsDescription: `text-sm ${
      isDark ? 'text-gray-400' : 'text-gray-600'
    }`,
    // Styles for the app name in the footer
    appName: 'text-3xl font-semibold text-purple-600 ',
    footerLogo: 'h-12 w-auto',
    logoContainer: 'flex items-center gap-2 mb-4',
  };
};
