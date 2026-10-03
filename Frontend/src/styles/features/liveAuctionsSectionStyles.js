export const getLiveAuctionsSectionStyles = (theme) => {
  const isDark = theme === 'dark';
  return {
    sectionContainer: `w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8`,
    sectionTitle: `text-3xl font-bold mb-8 text-center ${isDark ? 'bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] ' : 'bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-blue-700 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)] '}`,
    loadingMessage: `text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-600'}`,
    errorMessage: `text-center text-red-500 py-16`,
    emptyState: `text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-600'}`,
    auctionGrid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`,
    auctionCard: `group rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${isDark ? 'bg-[#0f0c29]/60 backdrop-blur-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(168,85,247,0.15)]  hover:shadow-purple-500/20' : 'bg-white hover:shadow-2xl'}`,
    auctionImage: `w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110`,
    auctionTitle: `px-4 pt-4 font-bold text-lg mb-1 truncate ${isDark ? 'text-gray-100' : 'text-gray-800'}`,
    auctionPrice: `px-4 font-semibold text-base ${isDark ? 'bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] ' : 'bg-clip-text text-transparent bg-linear-to-r from-purple-500 to-blue-600 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)] '}`,
    auctionTime: `px-4 pb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    statusBadge: `absolute top-2 left-2 z-10 px-2 py-1 text-xs font-bold text-white rounded`,
    seeMoreButton: `inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md ${isDark ? 'text-purple-300 bg-purple-800/50 hover:bg-purple-700/50' : 'bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-blue-700 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)]  bg-purple-100 hover:bg-purple-200'}`,
  };
};