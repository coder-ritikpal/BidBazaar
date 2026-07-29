export const getListedItemsStyles = (theme) => {
  const isDark = theme === 'dark';
  return {
    loadingContainer: `min-h-screen flex items-center justify-center ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`,
    container: `min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`,
    header: `flex items-center justify-between mb-8`,
    title: `text-3xl font-bold flex items-center gap-2`,
    itemCount: `text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    emptyStateContainer: `text-center py-20 rounded-2xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`,
    emptyStateText: `mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`,
    card: `group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`,
    imageContainer: `relative h-48 overflow-hidden`,
    image: `w-full h-full object-cover transition-transform duration-500 group-hover:scale-110`,
    content: `p-4`,
    itemTitle: `font-bold text-lg mb-1 truncate`,
    label: `text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`,
    price: `text-purple-600 font-bold text-lg`,
    actionButton: `${isDark ? 'border-purple-500 text-purple-400 hover:bg-purple-900' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}`,
    statusBadge: `absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold uppercase`,
  };
};