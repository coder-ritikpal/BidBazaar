export const getAuthPageClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    // Overall page background
    backgroundClasses: `h-screen flex flex-col items-center justify-center p-4 ${isDark ? 'bg-black text-white' : 'bg-white text-gray-900'} overflow-hidden`,

    // Main container for the form
    containerClasses: `relative w-full max-w-md p-8 rounded-lg shadow-xl ${
      isDark ? 'bg-gradient-to-br from-black to-purple-900 border border-purple-800 text-gray-100' : 'bg-white border border-gray-300 text-gray-900'
    } max-h-full overflow-y-auto`,

    // Heading (Login/Register)
    headingClasses: `text-3xl font-bold text-center mb-6 ${isDark ? 'text-purple-400' : 'text-purple-700'}`,

    // Label text
    labelTextClasses: `text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`,

    // Input fields
    inputClasses: `w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 ${
      isDark
        ? 'bg-gray-800 border-purple-700 text-white placeholder-gray-400 focus:border-purple-500'
        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500'
    }`,

    // Primary buttons (Login/Register)
    buttonClasses: `w-full py-2 px-4 rounded-md font-semibold transition-colors duration-200 ${
      isDark
        ? 'bg-purple-700 hover:bg-purple-800 text-white'
        : 'bg-purple-600 hover:bg-purple-700 text-white'
    }`,

    // Google button
    googleButtonClasses: `w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border font-semibold transition-colors duration-200 ${
      isDark
        ? 'bg-gray-800 border-purple-700 text-white hover:bg-gray-700'
        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
    }`,

    // Links (e.g., "Register here", "Terms and Conditions")
    linkClasses: `text-sm font-medium ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`,

    // Paragraph text (e.g., "Don't have an account?")
    paragraphClasses: `text-center text-sm mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`,

    // Separator text ("Or")
    separatorTextClasses: `shrink mx-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`,

    // Close button (X)
    closeButtonClasses: `absolute top-4 right-4 text-2xl ${isDark ? 'text-gray-300 hover:text-purple-400' : 'text-gray-500 hover:text-gray-700'}`,

    // Form layout classes
    formLayoutClasses: 'space-y-4', // For the main form wrapper
    inputGroupClasses: 'space-y-2', // For individual label/input groups
    passwordInputWrapperClasses: 'relative', // For the div wrapping password input and toggle button
    gridContainerClasses: 'grid grid-cols-1 md:grid-cols-2 gap-4 space-y-2 md:space-y-0',

    // Password toggle button
    passwordToggleButtonClasses: `absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-purple-300' : 'text-gray-500 hover:text-gray-700'}`,

    // Separator line and container
    separatorContainerClasses: 'relative flex items-center py-4',
    separatorLineClasses: `grow border-t ${isDark ? 'border-gray-600' : 'border-gray-400'}`,

    // Google logo image
    googleLogoClasses: 'h-5 w-5',

    // Error message
    errorMessageClasses: 'text-red-500 text-sm mt-1',

    // Checkbox container
    checkboxContainerClasses: 'flex items-center space-x-2',

    // App name heading for auth pages
    appNameHeadingClasses: `text-4xl md:text-5xl font-extrabold text-center mb-6 mt-8 ${isDark ? 'text-purple-400' : 'text-purple-700'}`,
  };
};