export const getNotFoundClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    container: `min-h-screen flex flex-col ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`,
    mainContent: "flex-grow flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8 text-center",
    headingWrapper: "mb-8 animate-fade-in-down",
    heading404: "text-8xl sm:text-9xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600",
    subHeading: "mt-2 text-3xl font-bold tracking-tight sm:text-4xl",
    iconWrapper: "relative mb-10 group",
    iconGlow: `absolute inset-0 ${isDark ? 'bg-purple-900' : 'bg-purple-200'} blur-3xl opacity-40 rounded-full group-hover:opacity-60 transition-opacity duration-500`,
    iconImage: "relative w-48 h-48 sm:w-64 sm:h-64 object-contain mx-auto drop-shadow-2xl transform transition-transform duration-500 hover:scale-105",
    quotesWrapper: "max-w-lg mx-auto mb-12",
    quoteText: `text-xl sm:text-2xl italic font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`,
    actionButton: "inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-purple-600 hover:bg-purple-700 md:py-4 md:text-lg md:px-10 transition-all duration-200 shadow-lg hover:shadow-purple-500/40 hover:-translate-y-1"
  };
};