export const getStartSellingPageClasses = (theme) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  return {
    container: `min-h-screen flex flex-col ${isDark ? 'bg-[#050510]' : 'bg-gray-50'} ${textColor} transition-colors duration-300`,
    mainContent: 'flex-grow container mx-auto px-4 py-12 md:px-6 lg:px-8 max-w-4xl',
    title: `text-4xl md:text-5xl font-extrabold mb-4 text-center bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-blue-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]`,
    subtitle: `text-lg text-center mb-10 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`,
    form: `${isDark ? 'bg-[#0f0c29]/60 backdrop-blur-xl border border-purple-500/20' : 'bg-white/80 backdrop-blur-xl border border-gray-200'} p-8 rounded-3xl shadow-[0_8px_32px_rgba(168,85,247,0.15)] space-y-6`,
    formGroup: 'flex flex-col',
    label: `mb-2 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`,
    input: `p-3.5 rounded-xl border transition-all duration-300 outline-none ${
      isDark 
        ? 'bg-[#050510]/50 border-purple-500/30 text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.4)]'
        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
    }`,
    textarea: `p-3.5 rounded-xl border transition-all duration-300 outline-none resize-y ${
      isDark 
        ? 'bg-[#050510]/50 border-purple-500/30 text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.4)]'
        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
    }`,
    select: `p-3.5 rounded-xl border transition-all duration-300 outline-none ${
      isDark 
        ? 'bg-[#050510]/50 border-purple-500/30 text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.4)]'
        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
    }`,
    formRow: 'flex flex-col md:flex-row gap-6',
    formGroupHalf: 'flex-1',
    fileInput: `block w-full text-sm ${textColor} file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold transition-all ${isDark ? 'file:bg-linear-to-r file:from-blue-500 file:to-purple-500 file:text-white hover:file:shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200'} cursor-pointer`,
    imagePreviewContainer: 'mt-6 flex flex-wrap gap-4',
    imagePreviewWrapper: 'relative w-32 h-32 hover:scale-105 transition-transform',
    imagePreview: 'w-full h-full object-cover rounded-xl border-2 border-purple-500/50 shadow-lg',
    dragging: 'opacity-50 border-dashed border-2 border-purple-500',
    dragOver: 'border-solid border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]',
    removeImageButton: `absolute -top-2 -right-2 p-1.5 rounded-full ${isDark ? 'bg-red-500 hover:bg-red-600' : 'bg-red-500 hover:bg-red-600'} text-white shadow-lg transition-all duration-200 hover:scale-110`,
    // Confirmation Dialog Styles
    confirmationDialogOverlay: 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity',
    confirmationDialog: `p-8 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] max-w-sm w-full ${isDark ? 'bg-gray-900 border border-purple-500/20 text-gray-100' : 'bg-white text-gray-900'}`,
    confirmationTitle: `text-2xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-red-400 to-pink-500`,
    confirmationMessage: 'mb-8 text-base font-medium',
    confirmationActions: 'flex justify-end gap-4',
    cancelButton: `px-5 py-2.5 rounded-xl border font-semibold transition-all duration-200 hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`,
    confirmButton: `px-5 py-2.5 rounded-xl bg-linear-to-r from-red-500 to-pink-600 text-white font-bold shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-200 hover:scale-105`,
    characterCounter: `text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-right font-medium`,
    submitButton: `w-full py-4 mt-4 rounded-xl font-bold text-lg shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:scale-[1.02] transition-all duration-300 border-none ${
      isDark
        ? 'bg-linear-to-r from-blue-500 to-purple-600 text-white'
        : 'bg-linear-to-r from-purple-500 to-blue-500 text-white'
    }`,
    errorText: `text-sm text-pink-500 font-medium mt-1.5`,
    errorMessage: `text-center p-4 rounded-xl ${isDark ? 'bg-pink-900/20 border border-pink-500/30' : 'bg-red-100'} text-pink-400 font-semibold mt-4 shadow-sm`,
    successMessage: `text-center p-4 rounded-xl ${isDark ? 'bg-green-900/20 border border-green-500/30' : 'bg-green-100'} text-green-400 font-semibold mt-4 shadow-sm`,
  };
};
