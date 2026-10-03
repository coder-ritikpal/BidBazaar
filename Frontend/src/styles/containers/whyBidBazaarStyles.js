export const getWhyBidBazaarClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    // Removed background classes to allow parent component's background to show through
    whySection: `py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300`,
    whyTitle: `text-3xl sm:text-4xl font-bold text-center mb-10 ${isDark ? 'text-white' : 'text-gray-800'}`,
    // Specific class for the colorful "BidBazaar" part of the title
    whyTitleBidBazaar: `${isDark ? 'bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] ' : 'bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-blue-700 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)] '}`,
    whyGrid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mx-auto`, // Removed max-w-6xl
    whyCard: `flex flex-col items-center text-center p-6 rounded-lg shadow-lg ${
      isDark ? 'bg-[#0f0c29]/60 backdrop-blur-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(168,85,247,0.15)]  border border-purple-700 text-gray-100' : 'bg-white border border-gray-200 text-gray-800'
    } transition-all duration-300 hover:shadow-xl hover:scale-105`,
    whyIconWrapper: `mb-4 p-3 rounded-full ${isDark ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-700'}`,
    whyCardTitle: `text-xl font-semibold mb-2 ${isDark ? 'text-purple-300' : 'text-purple-800'}`,
    whyCardDesc: `text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`,
  };
};