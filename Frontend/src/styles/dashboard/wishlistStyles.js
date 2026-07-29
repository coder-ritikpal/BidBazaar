export const getWishlistStyles = (theme) => {
  const isDark = theme === 'dark';
  return {
    loadingContainer: `min-h-screen flex items-center justify-center ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`,
    container: `min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`,
    itemCount: `text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    emptyStateContainer: `text-center py-20 rounded-2xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`,
    emptyStateText: `mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    itemCard: `group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`,
    label: `text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`,
    viewButton: `${isDark ? 'border-purple-500 text-purple-400 hover:bg-purple-900' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}`,
  };
};