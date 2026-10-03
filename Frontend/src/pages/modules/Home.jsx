import React, { useState } from 'react';
import { useThemeStore } from '@/store/themeStore'; // Import useThemeStore from the store index
import CategoriesCarousel from '@/pages/containers/CategoriesCarousel'; // Import CategoriesCarousel component
import Heading from '@/pages/containers/Heading'; // Correct path
import Footer from '@/pages/modules/Footer'; // Import the new Footer component
import WhyBidBazaarSection from '../containers/WhyBidBazaarSection.jsx';
import LiveAuctionsSection from '../features/LiveAuctionsSection.jsx'; // Corrected import to LiveAuctionsSection

import { getHomePageClasses } from '@/styles/modules/homePageStyles';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';
  const classes = getHomePageClasses(theme);

  return (
    <div className="w-full">
      <main className={classes.mainContainer}>
        <Heading />
        {/* Categories Section - Integrated into Home page */}
        <section className={classes.sectionContainer}>
          <h2 className={classes.categoriesTitle}>
            Featured Categories
          </h2>
          <CategoriesCarousel
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </section>
        <section className={classes.sectionContainer}>
          <LiveAuctionsSection selectedCategory={selectedCategory} /> {/* Render the LiveAuctionsSection component */}
        </section>
        <section className={classes.sectionContainer}> {/* Add margin-top to separate from hero */}
          <WhyBidBazaarSection />
        </section>
        
      </main>
      <footer>
      <Footer /> {/* Render the Footer component */}
      </footer>
    </div>
  );
};

export default Home;
