// c:\Users\palri\OneDrive\Desktop\BidBazaar\Frontend\src\styles\homePageStyles.js

export const getHomePageClasses = (theme) => {
  const isDark = theme === 'dark';

  // Common button styles extracted for reusability and clarity
  const baseButtonStyles = 'py-8 px-15 rounded-lg font-semibold text-xl transition-colors duration-300 hover:scale-105';

  // Theme-specific styles for the primary button variant
  const primaryButtonThemeStyles = isDark
    ? 'bg-violet-950 hover:bg-purple-800 text-white'
    : 'bg-purple-600 hover:bg-purple-700 text-white';

  // Theme-specific styles for the secondary/outline button variant
  const secondaryButtonThemeStyles = isDark
    ? 'bg-transparent border border-purple-700 text-purple-300 hover:bg-fuchsia-600 hover:text-white'
    : 'bg-white border border-purple-600 text-black-600 hover:bg-fuchsia-400';

  const startSellingButtonClasses = `${baseButtonStyles} ${primaryButtonThemeStyles} animate-fade-in-up`;
  const browseAuctionsButtonClasses = `${baseButtonStyles} ${secondaryButtonThemeStyles} animate-fade-in-up animation-delay-200`;

  const backgroundClasses = `min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-16 transition-colors duration-300 ${
    isDark ? 'text-white bg-black' : 'text-gray-900 bg-white'
  }`;

  return { startSellingButtonClasses, browseAuctionsButtonClasses, backgroundClasses };
};