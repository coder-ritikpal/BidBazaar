import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const Loading = () => {
  const [loadingText, setLoadingText] = useState('Connecting to BidBazaar servers...');

  useEffect(() => {
    const messages = [
      'Connecting to BidBazaar servers...',
      'Starting up the authentication service...',
      'Buddy its a free tier man pls wait...',
      'Waking up the auction engines (this takes a moment)...',
      'Preparing the latest products...',
      'Almost ready! Thank you for your patience.'
    ];
    let index = 0;
    
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingText(messages[index]);
    }, 10000); // Change text every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="flex flex-col items-center space-y-6 max-w-md text-center p-8 bg-white rounded-2xl shadow-xl">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <h1 className="text-2xl font-bold text-gray-900">Starting Services</h1>
        <p className="text-gray-500 animate-pulse transition-opacity duration-500">
          {loadingText}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4 overflow-hidden">
          <div className="bg-blue-600 h-2 rounded-full animate-[progress_15s_ease-in-out_infinite]" style={{ width: '100%', animation: 'progress 10s ease-in-out infinite alternate' }}></div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Free tier servers sleep after inactivity. It takes about 50 seconds to wake them up.
        </p>
      </div>
    </div>
  );
};

export default Loading;

