import React from 'react';
import useTheme from '../utils/useTheme.js';

const Home = () => {
  const { theme } = useTheme();
  return (
    <div className={`p-8 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      <h2 className="text-4xl font-bold mb-4">Welcome to BidBazaar!</h2>
      <p className="text-lg">Your ultimate destination for online bidding.</p>
    </div>
  );
};

export default Home;