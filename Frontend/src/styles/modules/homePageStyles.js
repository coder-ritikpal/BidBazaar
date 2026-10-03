export const getHomePageClasses = (theme) => {
  const isDark = theme === 'dark';
  return {
    mainContainer: `min-h-screen w-full flex flex-col pb-0 ${isDark ? 'bg-[#050510] text-white' : 'bg-gray-50 text-gray-900'}`,
    sectionContainer: "mt-16 w-full px-4 sm:px-6 lg:px-8",
    categoriesTitle: `text-4xl md:text-5xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-linear-to-r ${isDark ? 'from-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'from-purple-600 to-blue-700 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)]'}`
  };
};
