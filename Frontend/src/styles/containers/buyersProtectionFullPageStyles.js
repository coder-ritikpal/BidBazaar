// c:\Users\palri\OneDrive\Desktop\BidBazaar\Frontend\src\styles\buyersProtectionFullPageStyles.js

export const getBuyersProtectionFullPageClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    container: `font-sans m-0 p-0 leading-relaxed min-h-screen flex flex-col ${
      isDark ? 'bg-[#050510] text-gray-200' : 'bg-gray-50 text-gray-800'
    }`, // Removed header-specific classes
    
    mainContent: `max-w-7xl mx-auto my-8 px-6 flex-grow`, // Increased max-width for wider content
    
    // New Hero Section Layout
    heroSectionLayout: `flex flex-col items-center gap-8 mb-12 p-4 md:p-8 rounded-lg shadow-md ${ // Adjusted padding for hero section
      isDark ? 'bg-[#050510]' : 'bg-white'
    }`,
    heroBannerSection: `w-full text-center flex justify-center`, // Now takes full width
    heroBannerImage: `max-w-full h-auto rounded-lg shadow-lg w-full`,
    heroPolicyIntroWrapper: `w-full text-center p-2 md:p-0`, // Now takes full width
    heroPolicyTitle: `mb-6 text-3xl md:text-4xl font-bold ${
      isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] ' : 'bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-700 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)] '
    }`,
    heroPolicyParagraph: `mb-4 text-base md:text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`,
    backLink: `inline-flex items-center font-semibold text-base transition-colors duration-200 mt-4 ${
      isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]  hover:text-purple-300' : 'bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-600 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)]  hover:text-purple-700'
    }`,

    // Original bannerSection and bannerImage are now used for the hero section
    // Keeping them here for clarity, but they are effectively replaced by heroBannerSection/Image
    bannerSection: `hidden`, // Hide the old banner section
    bannerImage: `hidden`, // Hide the old banner image
    
    policyContentWrapper: `p-10 rounded-lg shadow-md ${ // This class was moved from buyersProtectionSectionStyles.js
      isDark ? 'bg-[#0f0c29]/60 backdrop-blur-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(168,85,247,0.15)]  text-gray-200' : 'bg-white text-gray-900'
    }`,
    policyTitle: `text-center mb-8 text-3xl font-semibold ${ // Adjusted size for detailed section title
      isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] ' : 'bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-700 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)] '
    }`,
    policyParagraph: `mb-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`,
    policySubheading: `mt-6 mb-4 text-2xl font-semibold ${
      isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] ' : 'text-purple-800'
    }`,
    policyList: `ml-8 mb-5 pl-5 space-y-2`,
    policyListItem: `mb-2`,
    policyLink: `no-underline hover:underline ${
      isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] ' : 'bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-600 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)] '
    }`,
  };
};