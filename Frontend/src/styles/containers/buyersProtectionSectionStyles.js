// c:\Users\palri\OneDrive\Desktop\BidBazaar\Frontend\src\styles\buyersProtectionSectionStyles.js

export const getBuyersProtectionSectionClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    sectionContainer: `max-w-5xl mx-auto my-8 px-6`,
    
    // New layout for banner and intro paragraph
    contentLayout: `flex flex-col md:flex-row items-center md:items-start gap-8`,

    // Adjust bannerSection to take half width on md screens and remove bottom margin
    bannerSection: `mb-10 text-center md:mb-0 md:w-1/2`,
    bannerImage: `max-w-full h-auto rounded-lg shadow-lg w-full`, // Image fills its parent (bannerSection)
    
    policyIntroWrapper: `md:w-1/2`,
    policyTitle: `text-center md:text-left mb-4 text-3xl font-semibold ${
      isDark ? 'text-purple-400' : 'text-purple-700'
    }`,
    policyParagraph: `mb-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`,
    
    // Learn More link styled as a text link
    learnMoreLink: `inline-flex items-center font-semibold text-base transition-colors duration-200 ${
      isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
    }`,
  };
};