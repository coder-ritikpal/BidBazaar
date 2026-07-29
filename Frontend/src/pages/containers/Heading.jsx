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
    <div className="max-w-4xl text-center mb-12">
      <h2 className="orbitron-stylish text-purple-600 text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
        Live Auctions.<br />Real Buyers. Real Time.
      </h2>
      <p className="text-md md:text-lg lg:text-xl font-medium mb-8">
        Buy and sell items with live bidding
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button className={startSellingButtonClasses} onClick={handleStartSellingClick}>
          Start Selling
        </Button>
        <Button className={browseAuctionsButtonClasses} onClick={handleBrowseAuctionsClick}>
          Browse Auctions
        </Button>
      </div>
    </div>
  );
};

export default Heading;