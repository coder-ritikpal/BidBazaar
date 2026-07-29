import React, { useState } from 'react';
import { useThemeStore } from '@/store/themeStore'; // Import useThemeStore from the store index
import { getHomePageClasses } from '@/styles/modules/homePageStyles.js'; // Import utility function for home page styles
import CategoriesCarousel from '@/pages/containers/CategoriesCarousel'; // Import CategoriesCarousel component
import Heading from '@/pages/containers/Heading'; // Correct path
import Footer from '@/pages/modules/Footer'; // Import the new Footer component
import WhyBidBazaarSection from '../containers/WhyBidBazaarSection.jsx';
import LiveAuctionsSection from '../features/LiveAuctionsSection.jsx'; // Corrected import to LiveAuctionsSection

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const theme = useThemeStore((state) => state.theme); // Get theme from Zustand store
  const isDark = theme === 'dark';

  const {
    startSellingButtonClasses,
    browseAuctionsButtonClasses,
    backgroundClasses,
  } = getHomePageClasses(theme);

  return ( // Added responsive horizontal padding to the main container
    <div className="w-full">
      <main className={`${backgroundClasses} pt-8 pb-0 px-4 sm:px-6 lg:px-8`}>
        <Heading 
          startSellingButtonClasses={startSellingButtonClasses}
          browseAuctionsButtonClasses={browseAuctionsButtonClasses}
        />
        {/* Categories Section - Integrated into Home page */}
        <section className="mt-16 w-full">
          <h2 className={`text-5xl font-bold mb-8 text-center ${isDark ? 'text-purple-600' : 'text-purple-700'}`}>
            Featured Categories
          </h2>
          <CategoriesCarousel
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </section>
        <section className="mt-16 w-full">
          <LiveAuctionsSection selectedCategory={selectedCategory} /> {/* Render the LiveAuctionsSection component */}
        </section>
        <section className="mt-16 w-full"> {/* Add margin-top to separate from hero */}
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