import React from 'react';
import { useThemeStore } from '@/store/themeStore';
import { getWhyBidBazaarClasses } from '@/styles/containers/whyBidBazaarStyles'; // Import from the new style file
import { whyBidBazaarData } from '../data/whyBidBazaarData';

const WhyBidBazaarSection = () => {
  const { theme } = useThemeStore();
  const classes = getWhyBidBazaarClasses(theme); // Use the new style function

  return (
    <div className={classes.whySection}>
      <h2 className={classes.whyTitle}>
        Why <span className={classes.whyTitleBidBazaar}>BidBazaar</span>?
      </h2>
      <div className={classes.whyGrid}>
        {whyBidBazaarData.map((item, index) => (
          <div key={index} className={classes.whyCard}>
            <div className={classes.whyIconWrapper}>
              {item.icon}
            </div>
            <h3 className={classes.whyCardTitle}>{item.title}</h3>
            <p className={classes.whyCardDesc}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhyBidBazaarSection;