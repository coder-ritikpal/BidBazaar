import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { getBuyersProtectionSectionClasses } from '@/styles/containers/buyersProtectionSectionStyles';

const BuyersProtectionSection = () => {
  const { theme } = useThemeStore();
  const classes = getBuyersProtectionSectionClasses(theme);

  return (
    <div className={classes.sectionContainer}>
      <div className={classes.contentLayout}> {/* New wrapper for side-by-side */}
      <section className={classes.bannerSection}>
        {/* Buyers Protection Banner */}
        {/* Ensure this image exists in your public folder, e.g., Frontend/public/images/buyers-protection-banner.png */}
        <img
          src="/images/buyers-protection-banner.png"
          alt="BidBazaar Buyers Protection"
          className={classes.bannerImage}
        />
      </section>

      <section className={classes.policyIntroWrapper}> {/* New wrapper for intro text and link */}
        <h2 className={classes.policyTitle}>Our Buyers Protection Policy</h2>
        <p className={classes.policyParagraph}>
          At BidBazaar, trust is the single most important thing we work on every day. BidBazaar's Buyer Protection guarantees that your payment is safe, objects are quality checked by experts, and all sellers are verified.
        </p>

        <div className="text-center mt-6">
          <Link to="/buyers-protection-page" className={classes.learnMoreLink}> {/* Link to the new full page */}
            Learn More
          </Link>
        </div>
      </section>
      </div> {/* Closing tag for classes.contentLayout */}
    </div>
  );
};

export default BuyersProtectionSection;