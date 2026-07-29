export const getHowItWorksClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    container: `min-h-screen flex flex-col ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`,
    mainContent: 'flex-grow container mx-auto px-4 py-12',
    headerSection: 'text-center mb-16',
    title: `text-4xl md:text-5xl font-bold mb-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`,
    subtitle: `text-lg md:text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto leading-relaxed`,
    stepsContainer: 'grid grid-cols-1 md:grid-cols-3 gap-8 mb-16',
    stepCard: `p-8 rounded-2xl shadow-lg text-center transform hover:-translate-y-2 transition-all duration-300 ${isDark ? 'bg-gray-800 border border-gray-700 hover:shadow-purple-900/20' : 'bg-white border border-gray-100 hover:shadow-xl'}`,
    iconWrapper: `w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`,
    stepTitle: 'text-2xl font-bold mb-4',
    stepDescription: `${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`,
    whySection: `py-16 mt-16 rounded-3xl ${isDark ? 'bg-gray-800/50' : 'bg-purple-50'}`,
    whyTitle: `text-3xl md:text-4xl font-bold text-center mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`,
    whyGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 md:px-8',
    whyCard: `flex flex-col items-center text-center p-6 rounded-xl transition-all duration-300 hover:transform hover:scale-105 ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:shadow-lg'}`,
    whyIconWrapper: `mb-4 p-4 rounded-full ${isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'}`,
    whyCardTitle: 'text-xl font-bold mb-2',
    whyCardDesc: `text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`,
    ctaSection: 'text-center mt-8',
    ctaButton: `inline-flex items-center px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${isDark ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200'}`,
  };
};