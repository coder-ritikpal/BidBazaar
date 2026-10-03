export const getHowItWorksClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    container: `min-h-screen flex flex-col ${isDark ? 'bg-[#050510] text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`,
    mainContent: 'flex-grow container mx-auto px-4 py-12',
    headerSection: 'text-center mb-16',
    title: `text-4xl md:text-5xl font-bold mb-6 ${isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] ' : 'bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-600 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)] '}`,
    subtitle: `text-lg md:text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto leading-relaxed`,
    stepsContainer: 'grid grid-cols-1 md:grid-cols-3 gap-8 mb-16',
    stepCard: `p-8 rounded-2xl shadow-lg text-center transform hover:-translate-y-2 transition-all duration-300 ${isDark ? 'bg-[#0f0c29]/60 backdrop-blur-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(168,85,247,0.15)]  border border-gray-700 hover:shadow-purple-900/20' : 'bg-white border border-gray-100 hover:shadow-xl'}`,
    iconWrapper: `w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`,
    stepTitle: 'text-2xl font-bold mb-4',
    stepDescription: `${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`,
    whySection: `py-16 mt-16 rounded-3xl ${isDark ? 'bg-[#0f0c29]/60 backdrop-blur-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(168,85,247,0.15)] /50' : 'bg-purple-50'}`,
    whyTitle: `text-3xl md:text-4xl font-bold text-center mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`,
    whyGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 md:px-8',
    whyCard: `flex flex-col items-center text-center p-6 rounded-xl transition-all duration-300 hover:transform hover:scale-105 ${isDark ? 'bg-[#0f0c29]/60 backdrop-blur-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(168,85,247,0.15)]  hover:bg-gray-700' : 'bg-white hover:shadow-lg'}`,
    whyIconWrapper: `mb-4 p-4 rounded-full ${isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'}`,
    whyCardTitle: 'text-xl font-bold mb-2',
    whyCardDesc: `text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`,
    ctaSection: 'text-center mt-8',
    ctaButton: `inline-flex items-center px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${isDark ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] text-white hover:scale-[1.02] border-none shadow-lg shadow-purple-200'}`,
  };
};