export const getHelpPageClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    container: `min-h-screen flex flex-col ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`,
    mainContent: "flex-grow max-w-6xl mx-auto w-full px-4 py-12 sm:px-6 lg:px-8",
    headerSection: "text-center mb-12",
    tag: `inline-block px-4 py-1.5 mb-4 text-sm font-semibold tracking-wider uppercase rounded-full ${isDark ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50' : 'bg-purple-100 text-purple-700 border border-purple-200'}`,
    title: `text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600' : 'text-purple-900'}`,
    subtitle: `text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`,
    faqContainer: "grid grid-cols-1 md:grid-cols-2 gap-6 items-start",
    faqItem: `rounded-lg border ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'} overflow-hidden transition-all duration-200 hover:shadow-md h-fit`,
    questionButton: "w-full flex justify-between items-center px-6 py-4 text-left focus:outline-none",
    questionText: `text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`,
    icon: `w-5 h-5 transform transition-transform duration-200 ${isDark ? 'text-purple-400' : 'text-purple-600'}`,
    answerContainer: `px-6 pb-4 text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'} animate-fade-in`,
    contactSection: `mt-16 text-center p-8 rounded-2xl ${isDark ? 'bg-gradient-to-br from-purple-900/20 to-gray-900 border border-purple-900/50' : 'bg-purple-50 border border-purple-100'}`,
    contactTitle: `text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`,
    contactText: `mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`,
    contactButton: "inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200 shadow-lg hover:shadow-purple-500/30",
  };
};