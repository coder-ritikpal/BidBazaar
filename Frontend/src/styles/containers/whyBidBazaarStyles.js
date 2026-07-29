export const getWhyBidBazaarClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    // Removed background classes to allow parent component's background to show through
    whySection: `py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300`,
    whyTitle: `text-3xl sm:text-4xl font-bold text-center mb-10 ${isDark ? 'text-white' : 'text-gray-800'}`,
    // Specific class for the colorful "BidBazaar" part of the title
    whyTitleBidBazaar: `${isDark ? 'text-purple-400' : 'text-purple-700'}`,
    whyGrid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mx-auto`, // Removed max-w-6xl
    whyCard: `flex flex-col items-center text-center p-6 rounded-lg shadow-lg ${
      isDark ? 'bg-gray-800 border border-purple-700 text-gray-100' : 'bg-white border border-gray-200 text-gray-800'
    } transition-all duration-300 hover:shadow-xl hover:scale-105`,
    whyIconWrapper: `mb-4 p-3 rounded-full ${isDark ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-700'}`,
    whyCardTitle: `text-xl font-semibold mb-2 ${isDark ? 'text-purple-300' : 'text-purple-800'}`,
    whyCardDesc: `text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`,
  };
};