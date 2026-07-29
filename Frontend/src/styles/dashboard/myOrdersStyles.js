export const getMyOrdersStyles = (theme) => {
  const isDark = theme === 'dark';
  return {
    loadingContainer: `min-h-screen flex items-center justify-center ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`,
    container: `min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`,
    header: `flex items-center justify-between mb-8`,
    title: `text-3xl font-bold flex items-center gap-2`,
    refreshButton: `p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`,
    errorState: `bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6`,
    emptyStateContainer: `text-center py-20 rounded-2xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`,
    emptyStateText: `mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    sectionTitle: `text-2xl font-bold mb-6 border-b pb-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`,
    orderCard: `p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row gap-4 items-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`,
    image: `w-24 h-24 object-cover rounded-lg flex-shrink-0`,
    itemDetails: `flex-1`,
    itemTitle: `font-bold text-lg mb-1`,
    price: `text-purple-600 font-bold text-lg`,
    orderId: `font-mono text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    statusSection: `flex flex-col items-center sm:items-end gap-2 ml-auto`,
    statusBadge: `px-3 py-1 text-xs font-semibold rounded-full capitalize ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`,
  };
};