import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import Footer from '@/pages/modules/Footer';
import { getHowItWorksClasses } from '@/styles/containers/howItWorksStyles.js';
import { ArrowRight } from 'lucide-react';
import { steps } from '../data/howItWorksSteps.jsx'; 
import WhyBidBazaarSection from './WhyBidBazaarSection'; // Import the new component
import BuyersProtectionSection from './BuyersProtectionSection.jsx'; // Keep this import for the section

const HowItWorks = () => {
  const { theme } = useThemeStore();
  const classes = getHowItWorksClasses(theme);

  return (
    <div className={classes.container}>
      <main className={classes.mainContent}>
        <div className={classes.headerSection}>
          <h1 className={classes.title}>How BidBazaar Works</h1>
          <p className={classes.subtitle}>
            Join the excitement of live auctions. Follow these three simple steps to start bidding and winning today.
          </p>
        </div>

        <div className={classes.stepsContainer}>
          {steps.map((step, index) => (
            <div key={index} className={classes.stepCard}>
              <div className={classes.iconWrapper}>
                {step.icon}
              </div>
              <h3 className={classes.stepTitle}>{step.title}</h3>
              <p className={classes.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>

        <WhyBidBazaarSection />
        <BuyersProtectionSection />
        <div className={classes.ctaSection}>
          <Link to="/auctions" className={classes.ctaButton}>
            Start Bidding <ArrowRight className="ml-2 w-6 h-6" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
