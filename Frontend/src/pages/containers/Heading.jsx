import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore'; // Import the auth store
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const Heading = ({ startSellingButtonClasses, browseAuctionsButtonClasses }) => {
  const { user } = useAuthStore(); // Get user state from the auth store
  const navigate = useNavigate(); // Initialize navigate hook

  const handleStartSellingClick = () => {
    if (!user) { // Check if user is not logged in
      navigate('/login'); // Redirect to login page
    } else {
      navigate('/start-selling'); // Redirect to the start selling page (adjust route as needed)
    }
  };
  const handleBrowseAuctionsClick = () => {
    if (!user) { // Check if user is not logged in
      navigate('/login'); // Redirect to login page
    } else {
      navigate('/auctions'); // Redirect to the auctions page
    }
  };

  return (
    <div 
      className="w-full min-h-[90vh] md:min-h-screen flex flex-col items-center justify-start pt-[15vh] px-4 relative overflow-hidden"
      style={{
        backgroundImage: "url('/hero-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight flex flex-col items-center gap-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.8)] transition-transform duration-500 hover:scale-105 cursor-default">
            Live Auctions.
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-400 drop-shadow-[0_0_25px_rgba(216,180,254,0.8)] transition-transform duration-500 hover:scale-105 cursor-default">
            Real Buyers. Real Time.
          </span>
        </h2>
        
        <p className="text-lg md:text-xl text-gray-200 font-medium mb-10 drop-shadow-md">
          Buy and sell items with live bidding
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-4">
          <Button 
            className="px-10 py-7 rounded-2xl font-semibold text-lg text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-none transition-transform hover:scale-105 shadow-lg shadow-purple-500/20"
            onClick={handleStartSellingClick}
          >
            Start Selling
          </Button>
          <Button 
            className="px-10 py-7 rounded-2xl font-semibold text-lg text-white bg-[#0f0c1b]/80 border border-purple-500 hover:bg-purple-900/50 transition-transform hover:scale-105 shadow-lg backdrop-blur-sm"
            onClick={handleBrowseAuctionsClick}
          >
            Browse Auctions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Heading;
