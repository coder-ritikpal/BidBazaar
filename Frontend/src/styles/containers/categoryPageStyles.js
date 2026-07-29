// c:\Users\palri\OneDrive\Desktop\BidBazaar\Frontend\src\styles\categoryPageStyles.js

export const getCategoryPageClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    // Common classes for both CategoriesPage and CategoriesCarousel
    headingClasses: `font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-800'} text-xl sm:text-2xl md:text-3xl my-0`,
    // Specific heading variants used across components
    pageHeadingClasses: `font-bold mb-6 text-center ${isDark ? 'text-purple-400' : 'text-purple-800'} text-2xl sm:text-3xl md:text-4xl my-0`,
    carouselHeadingClasses: `font-bold mb-6 ${isDark ? 'text-purple-400' : 'text-purple-800'} text-xl sm:text-2xl md:text-3xl my-0`,

    categoryImageClasses: `w-full h-24 flex items-center justify-center pb-4 [&>svg]:w-8 [&>svg]:h-8 [&>svg]:stroke-[1.5] ${isDark ? '[&>svg]:stroke-green-400' : '[&>svg]:stroke-green-700'}`,
    categoryCardClasses: `relative rounded-lg shadow-md overflow-hidden transform transition-transform duration-300 hover:scale-110 hover:shadow-xl ${
      isDark ? 'bg-indigo-950 text-white border border-purple-600 hover:shadow-purple-400/50' : 'bg-white text-gray-800 border border-purple-600 hover:shadow-purple-500/50'
    }`,
    categoryNameClasses: 'absolute bottom-0 left-0 right-0 py-1 px-2 text-center text-xs sm:text-sm font-semibold bg-fuchsia-800 bg-opacity-50 text-white',

    // CategoriesCarousel specific classes
    carouselContainerClasses: `py-8 transition-colors duration-300`,
    carouselHeaderClasses: `flex justify-between items-center gap-4 mb-6`,
    
    carouselScrollContainerClasses: `flex overflow-x-auto whitespace-nowrap py-4 gap-4 sm:gap-6 max-w-full mx-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`,
    carouselItemLinkClasses: `block flex-shrink-0 w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 xl:w-1/8`,
    scrollbarHideClass: '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
  };
};