import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore'; // Import the auth store
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

import { useThemeStore } from '@/store/themeStore';
import { getHeadingClasses } from '@/styles/containers/headingStyles';

const Heading = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const classes = getHeadingClasses(theme);

  const handleStartSellingClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/start-selling');
    }
  };
  const handleBrowseAuctionsClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/auctions');
    }
  };

  return (
    <div className={classes.heroContainer}>
      <div className={classes.contentWrapper}>
        <h2 className={classes.titleContainer}>
          <span className={classes.liveAuctionsText}>
            Live Auctions.
          </span>
          <span className={classes.realBuyersText}>
            Real Buyers. Real Time.
          </span>
        </h2>
        
        <p className={classes.subtitle}>
          Buy and sell items with live bidding
        </p>
        
        <div className={classes.buttonsWrapper}>
          <Button 
            className={classes.startSellingButton}
            onClick={handleStartSellingClick}
          >
            Start Selling
          </Button>
          <Button 
            className={classes.browseAuctionsButton}
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
