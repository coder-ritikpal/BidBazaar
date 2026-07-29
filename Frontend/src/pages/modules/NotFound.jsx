import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import Footer from './Footer'; // Import Footer from the same directory
import { getNotFoundClasses } from '@/styles/modules/notFoundStyles';

const NotFound = () => {
  const { theme } = useThemeStore();
  const classes = getNotFoundClasses(theme);

  return (
    <div className={classes.container}>
      <main className={classes.mainContent}>
        
        {/* Upper Heading Section */}
        <div className={classes.headingWrapper}>
          <h1 className={classes.heading404}>
            404
          </h1>
          <h2 className={classes.subHeading}>
            Page Not Found
          </h2>
        </div>

        {/* Icon in Middle */}
        <div className={classes.iconWrapper}>
          <div className={classes.iconGlow}></div>
          <img 
            src="/icon.png" 
            alt="BidBazaar Logo" 
            className={classes.iconImage}
          />
        </div>

        {/* Quotes Section */}
        <div className={classes.quotesWrapper}>
          <p className={classes.quoteText}>
            "Going once... Going twice... Gone! <br/>
            The page you're looking for seems to have been auctioned off."
          </p>
        </div>

        {/* Action Button */}
        <Link 
          to="/" 
          className={classes.actionButton}
        >
          Return to Home
        </Link>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;