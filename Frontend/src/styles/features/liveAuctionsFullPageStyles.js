// c:\Users\palri\OneDrive\Desktop\BidBazaar\Frontend\src\styles\liveAuctionsPageStyles.js

export const getLiveAuctionsFullPageClasses = (theme) => { // Renamed function
    const isDark = theme === 'dark';

  return {
    pageWrapper: `font-sans m-0 p-0 leading-relaxed min-h-screen flex flex-col ${
      isDark ? 'bg-[#050510] text-gray-300' : 'bg-gray-100 text-gray-800' // Black background for dark mode
    }`,
    mainContentArea: `flex-grow`,

    // Hero Section
    heroSection: `relative py-20 px-4 sm:px-6 lg:px-8 ${
      isDark ? 'bg-[#050510]' : 'bg-white' // Black bg for dark, white for light
    } text-center`,
    heroContent: `max-w-4xl mx-auto`,
    heroTitle: `text-4xl md:text-6xl font-extrabold mb-4 ${
      isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] ' : 'bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-700 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)] ' // Purple heading for both themes
    }`,
    heroSubtitle: `text-lg md:text-xl mb-8 ${
      isDark ? 'text-gray-400' : 'text-gray-600' // Standard subtitle color
    }`,

    // Auctions Section
    auctionsSection: `max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 `,

    // State Messages
    loadingState: `text-center text-xl font-semibold ${
      isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] ' : 'bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-600 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)] '
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
      isDark ? 'bg-[#0f0c29]/60 backdrop-blur-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(168,85,247,0.15)]  hover:bg-gray-700/50 border border-gray-700' : 'bg-white/80 backdrop-blur-xl border border-purple-200 shadow-[0_8px_32px_rgba(168,85,247,0.05)]  hover:bg-gray-50 border '
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
      isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] ' : 'bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-700 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)] '
    }`,
    auctionTimeRemaining: `text-sm font-medium text-center mt-2 ${
      isDark ? 'text-amber-400' : 'text-amber-600'
    }`,
    viewDetailsButton: `w-full mt-4 py-2 rounded-lg font-semibold transition-colors ${
      isDark ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] text-white hover:scale-[1.02] border-none' : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] text-white hover:scale-[1.02] border-none'
    }`,
  };
};
