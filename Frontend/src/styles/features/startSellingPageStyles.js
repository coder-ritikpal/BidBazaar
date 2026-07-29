export const getStartSellingPageClasses = (theme) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const bgColor = isDark ? 'bg-black' : 'bg-gray-50';
  const formBg = isDark ? 'bg-gray-900' : 'bg-white';
  const inputBorder = isDark ? 'border-gray-600' : 'border-gray-300';
  const inputFocus = isDark ? 'focus:border-purple-500 focus:ring-purple-500' : 'focus:border-purple-600 focus:ring-purple-600';
  const buttonBg = 'bg-purple-600 hover:bg-purple-700';
  const buttonText = 'text-white';
  const errorColor = 'text-red-500';
  const successColor = 'text-green-500';

  return {
    container: `min-h-screen flex flex-col ${bgColor} ${textColor} transition-colors duration-300`,
    mainContent: 'flex-grow container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-3xl',
    title: `text-4xl font-extrabold mb-4 text-center ${isDark ? 'text-purple-400' : 'text-purple-700'}`,
    subtitle: 'text-lg text-center mb-8',
    form: `${formBg} p-6 rounded-lg shadow-md space-y-6`,
    formGroup: 'flex flex-col',
    label: 'mb-2 text-sm font-medium',
    input: `p-3 border rounded-md ${inputBorder} ${bgColor} ${textColor} ${inputFocus} outline-none`,
    textarea: `p-3 border rounded-md ${inputBorder} ${bgColor} ${textColor} ${inputFocus} outline-none resize-y`,
    select: `p-3 border rounded-md ${inputBorder} ${bgColor} ${textColor} ${inputFocus} outline-none`,
    formRow: 'flex flex-col md:flex-row gap-6', // Added for side-by-side groups
    formGroupHalf: 'flex-1', // Added for half-width form groups within a row
    fileInput: `block w-full text-sm ${textColor} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${isDark ? 'file:bg-purple-700 file:text-white hover:file:bg-purple-600' : 'file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100'} cursor-pointer`,
    imagePreviewContainer: 'mt-4 flex flex-wrap gap-4',
    imagePreviewWrapper: 'relative w-32 h-32',
    imagePreview: 'w-full h-full object-cover rounded-md border border-gray-300 dark:border-gray-700',
    dragging: 'opacity-50 border-dashed border-2 border-purple-500', // Style for the item being dragged
    dragOver: 'border-solid border-2 border-purple-500', // Style for the potential drop target
    removeImageButton: `absolute top-1 right-1 p-1 rounded-full ${isDark ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500 text-white hover:bg-red-600'} transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50`,
    // Confirmation Dialog Styles
    confirmationDialogOverlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    confirmationDialog: `p-6 rounded-lg shadow-xl max-w-sm w-full ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`,
    confirmationTitle: `text-xl font-bold mb-4 ${isDark ? 'text-purple-400' : 'text-purple-700'}`,
    confirmationMessage: 'mb-6 text-base',
    confirmationActions: 'flex justify-end gap-3',
    cancelButton: `px-4 py-2 rounded-md border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} transition-colors duration-200`,
    confirmButton: `px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200`,
    characterCounter: `text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-right`,
    submitButton: `w-full py-3 rounded-md font-semibold ${buttonBg} ${buttonText} transition-colors duration-200`,
    errorText: `text-sm ${errorColor} mt-1`,
    errorMessage: `text-center p-3 rounded-md ${isDark ? 'bg-red-900/20' : 'bg-red-100'} ${errorColor} mt-4`,
    successMessage: `text-center p-3 rounded-md ${isDark ? 'bg-green-900/20' : 'bg-green-100'} ${successColor} mt-4`,
  };
};