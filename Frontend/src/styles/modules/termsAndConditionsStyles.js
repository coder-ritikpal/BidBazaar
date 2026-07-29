export const getTermsAndConditionsClasses = (theme) => {
  const isDark = theme === 'dark';
  return {
    container: `min-h-screen flex flex-col ${isDark ? 'bg-black text-gray-100' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`,
    mainContent: 'flex-grow container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-4xl',
    title: `text-4xl font-extrabold mb-6 text-center ${isDark ? 'text-violet-800' : 'text-purple-700'}`,
    sectionTitle: `text-2xl font-bold mt-8 mb-4 ${isDark ? 'text-purple-800' : 'text-purple-600'}`,
    paragraph: 'mb-4 leading-relaxed text-lg',
    list: 'list-disc pl-5 mb-4 space-y-2 text-lg',
    listItem: 'leading-relaxed',
    link: `${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} underline`,
  };
};