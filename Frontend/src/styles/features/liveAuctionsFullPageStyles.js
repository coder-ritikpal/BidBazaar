// c:\Users\palri\OneDrive\Desktop\BidBazaar\Frontend\src\styles\liveAuctionsPageStyles.js

export const getLiveAuctionsFullPageClasses = (theme) => { // Renamed function
    const isDark = theme === 'dark';

  return {
    pageWrapper: `font-sans m-0 p-0 leading-relaxed min-h-screen flex flex-col ${
      isDark ? 'bg-black text-gray-300' : 'bg-gray-100 text-gray-800' // Black background for dark mode
    }`,
    mainContentArea: `flex-grow`,

    // Hero Section
    heroSection: `relative py-20 px-4 sm:px-6 lg:px-8 ${
      isDark ? 'bg-black' : 'bg-white' // Black bg for dark, white for light
    } text-center`,
    heroContent: `max-w-4xl mx-auto`,
    heroTitle: `text-4xl md:text-6xl font-extrabold mb-4 ${
      isDark ? 'text-purple-500' : 'text-purple-700' // Purple heading for both themes
    }`,
    heroSubtitle: `text-lg md:text-xl mb-8 ${
      isDark ? 'text-gray-400' : 'text-gray-600' // Standard subtitle color
    }`,

    // Auctions Section
    auctionsSection: `max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 `,

    // State Messages
    loadingState: `text-center text-xl font-semibold ${
      isDark ? 'text-purple-400' : 'text-purple-600'
    } my-10`,
    errorState: `text-center text-xl font-semibold text-red-500 my-10`,
    infoMessage: `text-center text-base md:text-lg font-medium ${
      isDark ? 'text-amber-300' : 'text-amber-700'
    } mb-8`,
    emptyState: `text-center text-xl font-semibold ${
      isDark ? 'text-gray-500' : 'text-gray-500'
    } my-10`,

    // Auction Grid and Card
    auctionGrid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`,
    auctionCard: `block rounded-lg shadow-md overflow-hidden transition-all duration-300 transform hover:scale-105 group ${
      isDark ? 'bg-gray-800 hover:bg-gray-700/50 border border-gray-700' : 'bg-white hover:bg-gray-50 border border-gray-200'
    }`,
    cardImageWrapper: `relative h-48 overflow-hidden`,
    cardImage: `w-full h-full object-cover transition-transform duration-300 group-hover:scale-110`,
    statusBadge: `absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide z-10`,
    wishlistButton: `absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10`,
    cardContent: `p-4`,
    cardTitle: `font-semibold text-lg mb-2 ${
      isDark ? 'text-white' : 'text-gray-900'
    }`,
    bidInfo: `flex justify-between items-center mb-2`,
    currentBidLabel: `text-sm ${
      isDark ? 'text-gray-400' : 'text-gray-500'
    }`,
    currentBidValue: `font-bold text-lg ${
      isDark ? 'text-purple-400' : 'text-purple-700'
    }`,
    auctionTimeRemaining: `text-sm font-medium text-center mt-2 ${
      isDark ? 'text-amber-400' : 'text-amber-600'
    }`,
    viewDetailsButton: `w-full mt-4 py-2 rounded-lg font-semibold transition-colors ${
      isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-700 hover:bg-purple-800 text-white'
    }`,
  };
};
