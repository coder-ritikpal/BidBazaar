export const getProfileStyles = (theme) => {
  const isDark = theme === 'dark';
  return {
    container: `min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-[#050510] text-white' : 'bg-gray-50 text-gray-900'}`,
    card: `max-w-4xl mx-auto rounded-2xl shadow-xl overflow-hidden ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`,
    coverImage: `h-40 sm:h-48 ${isDark ? 'bg-linear-to-r from-purple-900 to-indigo-900' : 'bg-linear-to-r from-purple-500 to-indigo-500'}`,
    avatarContainer: `w-32 h-32 rounded-full border-4 flex items-center justify-center text-4xl font-bold shadow-md ${isDark ? 'border-gray-900 bg-gray-800 text-purple-400' : 'border-white bg-gray-100 text-purple-600'}`,
    roleText: `text-sm font-medium mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`, // Existing
    editButton: `flex items-center px-4 py-2 rounded-lg font-medium transition-colors shadow-sm ${isDark ? 'bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] text-white hover:scale-[1.02] border-none' : 'bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] text-white hover:scale-[1.02] border-none'}`, // Existing
    saveButton: `flex items-center px-4 py-2 rounded-lg font-medium transition-colors shadow-sm bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400`,
    cancelButton: `flex items-center px-4 py-2 rounded-lg font-medium transition-colors shadow-sm bg-gray-500 hover:bg-gray-600 text-white`,
    sectionCard: `p-6 rounded-xl ${isDark ? 'bg-[#0f0c29]/60 backdrop-blur-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(168,85,247,0.15)] /50' : 'bg-gray-50'}`,
    label: `text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`,
    nameInput: `text-3xl font-bold p-2 rounded-md w-full sm:w-auto ${isDark ? 'bg-[#0f0c29]/60 backdrop-blur-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(168,85,247,0.15)]  border border-gray-700' : 'bg-gray-100 border border-gray-300'} focus:outline-none focus:ring-2 focus:ring-purple-500`,
  };
};