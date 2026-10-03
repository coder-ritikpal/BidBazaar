export const getAuthPageClasses = (theme) => {
  const isDark = theme === 'dark';

  return {
    // Overall page background with the main hero image
    backgroundClasses: `min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`,
    // Adding the background image inline in the component might be better, but we can do it via a generic class or just let it use the dark background. 
    // Actually, setting a very slick dark radial gradient is cleaner for Auth:
    backgroundClasses: `min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative ${isDark ? 'bg-[#050510] text-white' : 'bg-gray-50 text-gray-900'}`,

    // Main container for the form (Glassmorphism)
    containerClasses: `relative w-full max-w-md p-8 rounded-2xl shadow-[0_8px_32px_rgba(168,85,247,0.15)] transition-all duration-300 ${
      isDark ? 'bg-[#0f0c29]/60 backdrop-blur-xl border border-purple-500/20 text-gray-100' : 'bg-white/80 backdrop-blur-xl border border-purple-200 text-gray-900'
    } max-h-full overflow-y-auto`,

    // Heading (Login/Register)
    headingClasses: `text-3xl font-extrabold text-center mb-6 bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-blue-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]`,

    // Label text
    labelTextClasses: `text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`,

    // Input fields (Glowing on focus)
    inputClasses: `w-full px-4 py-2.5 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-1 ${
      isDark
        ? 'bg-[#050510]/50 border-purple-500/30 text-white placeholder-gray-500 focus:border-purple-400 focus:ring-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.4)]'
        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
    }`,

    // Primary buttons (Login/Register)
    buttonClasses: `w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 border-none shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:scale-[1.02] ${
      isDark
        ? 'bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white'
        : 'bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white'
    }`,

    // Google button
    googleButtonClasses: `w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-semibold transition-all duration-300 hover:scale-[1.02] ${
      isDark
        ? 'bg-[#0f0c29]/80 border-purple-500/30 text-white hover:bg-purple-900/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
        : 'bg-white border-purple-200 text-gray-700 hover:bg-purple-50'
    }`,

    // Links (e.g., "Register here", "Terms and Conditions")
    linkClasses: `text-sm font-semibold transition-colors ${isDark ? 'text-purple-400 hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]' : 'text-purple-600 hover:text-blue-600'}`,

    // Paragraph text (e.g., "Don't have an account?")
    paragraphClasses: `text-center text-sm mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`,

    // Separator text ("Or")
    separatorTextClasses: `shrink mx-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`,

    // Close button (X)
    closeButtonClasses: `absolute top-4 right-4 text-2xl transition-all hover:scale-110 ${isDark ? 'text-gray-300 hover:text-purple-400' : 'text-gray-500 hover:text-purple-600'}`,

    // Form layout classes
    formLayoutClasses: 'space-y-5', // For the main form wrapper
    inputGroupClasses: 'space-y-2', // For individual label/input groups
    passwordInputWrapperClasses: 'relative', // For the div wrapping password input and toggle button
    gridContainerClasses: 'grid grid-cols-1 md:grid-cols-2 gap-5',

    // Password toggle button
    passwordToggleButtonClasses: `absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-400 hover:text-purple-400' : 'text-gray-500 hover:text-purple-600'}`,

    // Separator line and container
    separatorContainerClasses: 'relative flex items-center py-4',
    separatorLineClasses: `grow border-t ${isDark ? 'border-purple-500/20' : 'border-gray-200'}`,

    // Google logo image
    googleLogoClasses: 'h-5 w-5 drop-shadow-sm',

    // Error message
    errorMessageClasses: 'text-pink-500 text-sm mt-1 font-medium',

    // Checkbox container
    checkboxContainerClasses: 'flex items-center space-x-3',

    // App name heading for auth pages
    appNameHeadingClasses: `text-4xl md:text-5xl font-extrabold text-center mb-6 mt-8 bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-blue-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]`,
  };
};