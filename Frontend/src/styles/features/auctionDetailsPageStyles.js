export const getAuctionDetailsPageClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    pageWrapper: `min-h-screen flex flex-col ${isDark ? 'bg-black text-gray-300' : 'bg-gray-100 text-gray-800'}`,
    mainContent: 'flex-grow container mx-auto px-4 py-8 md:py-12',
    
    // Grid Layout
    gridContainer: 'grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12',

    // Image Section (Left)
    imageSection: 'lg:col-span-3',
    mainImageWrapper: 'aspect-w-16 aspect-h-12 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg mb-4',
    mainImage: 'w-full h-full object-contain',
    thumbnailContainer: 'grid grid-cols-5 gap-2',
    thumbnailButton: 'aspect-w-1 aspect-h-1 rounded-md overflow-hidden border-2 border-transparent transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-purple-500',
    thumbnailActive: 'border-purple-500 ring-2 ring-purple-500',
    thumbnailImage: 'w-full h-full object-cover',

    // Details Section (Right)
    detailsSection: 'lg:col-span-2 flex flex-col',
    categoryLabel: `inline-block mb-2 text-sm font-semibold tracking-wider uppercase rounded-full w-fit ${isDark ? 'text-purple-400' : 'text-purple-600'}`,
    title: `text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`,
    
    statusTimeWrapper: 'flex items-center gap-4 mb-6',
    statusBadge: 'px-3 py-1 rounded-full text-xs font-bold uppercase text-white',
    statuslive: 'bg-green-500',
    statusupcoming: 'bg-amber-500',
    statusended: 'bg-gray-600',
    timeWrapper: `flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`,

    // Countdown Timer
    countdownContainer: `text-center p-4 rounded-lg my-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`,
    countdownEndsLabel: `text-sm font-medium uppercase tracking-wider mb-3 ${isDark ? 'text-purple-400' : 'text-purple-600'}`,
    countdownSegmentsWrapper: 'flex justify-center gap-2 sm:gap-4',
    countdownSegment: 'flex flex-col items-center w-16',
    countdownValue: `text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`,
    countdownLabel: `text-xs uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`,

    priceSection: `flex justify-between items-center p-4 rounded-lg mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`,
    priceLabel: `text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    priceValue: `text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-700'}`,

    bidForm: 'flex flex-col sm:flex-row gap-3 mb-6',
    bidInputWrapper: 'relative flex-grow',
    bidInputCurrency: `absolute left-3 top-1/2 -translate-y-1/2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    bidInput: `w-full pl-10 pr-4 py-3 rounded-lg border text-lg font-semibold ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'} focus:outline-none focus:ring-2 focus:ring-purple-500`,
    bidButton: `flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white transition-colors ${isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-700 hover:bg-purple-800'} disabled:bg-gray-500`,

    ownerMessage: `p-4 rounded-lg text-center text-sm mb-6 ${isDark ? 'bg-blue-900/50 text-blue-300 border border-blue-800' : 'bg-blue-100 text-blue-800 border border-blue-200'}`,
    upcomingMessage: `p-4 rounded-lg text-center text-sm mb-6 ${isDark ? 'bg-amber-900/50 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800 border border-amber-200'}`,
    endedMessage: `p-4 rounded-lg text-center text-sm mb-6 ${isDark ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-gray-100 text-gray-500 border border-gray-200'}`,
    winnerMessage: `p-6 rounded-lg text-center mb-6 shadow-lg border ${isDark ? 'bg-green-900/50 border-green-700' : 'bg-green-100 border-green-200'}`,
    winnerTitle: `text-2xl font-bold ${isDark ? 'text-green-300' : 'text-green-800'}`,
    winnerText: `mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`,
    winnerLink: `mt-4 inline-block font-semibold rounded-lg px-4 py-2 transition-colors ${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-700 hover:bg-purple-800 text-white'}`,

    descriptionSection: `mt-4 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`,
    sectionTitle: `text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`,
    descriptionText: `leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`,

    specsSection: `mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`,
    specsGrid: 'grid grid-cols-2 gap-4',
    specItem: 'flex flex-col',
    specLabel: `text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    specValue: `text-base font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`,

    // Bid History
    bidHistorySection: `mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`,
    bidList: 'space-y-3',
    bidListExpanded: 'max-h-64 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
    bidItem: `flex justify-between items-center p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'} transition-all duration-200`,
    highestBidItem: `border-l-4 border-purple-500 ${isDark ? 'bg-gray-700/70' : 'bg-purple-50'}`,
    highestBidBadge: `ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${isDark ? 'bg-purple-600 text-white' : 'bg-purple-200 text-purple-800'}`,
    bidItemInfo: 'flex flex-col',
    bidderName: `font-semibold text-sm flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`,
    bidTime: `text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`,
    bidAmount: `font-bold text-lg ${isDark ? 'text-green-400' : 'text-green-600'}`,
    bidHistoryMessage: `text-center text-sm p-4 rounded-lg ${isDark ? 'text-gray-400 bg-gray-800' : 'text-gray-500 bg-gray-100'}`,
    viewAllBidsButton: `mt-4 w-full py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-700 hover:bg-purple-800 text-white'}`,

    sellerInfoSection: `mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`,

    // States
    loadingState: `min-h-screen flex items-center justify-center text-2xl font-semibold ${isDark ? 'bg-black text-purple-400' : 'bg-gray-100 text-purple-600'}`,
    errorState: `min-h-screen flex items-center justify-center text-2xl font-semibold ${isDark ? 'bg-black text-red-500' : 'bg-gray-100 text-red-600'}`,
  };
};