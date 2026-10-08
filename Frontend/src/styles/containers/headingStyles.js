export const getHeadingClasses = () => {
  return {
    heroContainer: "w-full min-h-[90vh] md:min-h-screen flex flex-col items-center justify-start pt-[15vh] px-4 relative overflow-hidden bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat",
    contentWrapper: "relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center",
    titleContainer: "text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight flex flex-col items-center gap-2 font-sans",
    liveAuctionsText: "bg-clip-text text-transparent bg-linear-to-r from-cyan-300 to-blue-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.8)] transition-transform duration-500 hover:scale-105 cursor-default",
    realBuyersText: "bg-clip-text text-transparent bg-linear-to-r from-purple-300 to-pink-400 drop-shadow-[0_0_25px_rgba(216,180,254,0.8)] transition-transform duration-500 hover:scale-105 cursor-default",
    subtitle: "text-lg md:text-xl text-gray-200 font-medium mb-10 drop-shadow-md",
    buttonsWrapper: "flex flex-col sm:flex-row justify-center gap-6 mt-4",
    startSellingButton: "px-10 py-7 rounded-2xl font-semibold text-lg text-white bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-none transition-transform hover:scale-105 shadow-[0_0_15px_rgba(168,85,247,0.4)]",
    browseAuctionsButton: "px-10 py-7 rounded-2xl font-semibold text-lg text-white bg-[#0f0c1b]/80 border border-purple-500 hover:bg-purple-900/50 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(168,85,247,0.4)] backdrop-blur-sm"
  };
};
