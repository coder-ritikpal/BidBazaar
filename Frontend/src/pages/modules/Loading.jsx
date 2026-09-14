import React, { useState, useEffect } from 'react';

import { useThemeStore } from '@/store/themeStore'; 

const Loading = () => {
  const [loadingText, setLoadingText] = useState('Connecting to BidBazaar servers...');
  const theme = useThemeStore((state) => state.theme); 

  useEffect(() => {
    const messages = [
      'Connecting to BidBazaar servers...',
      'Waking up the auction engines (this takes a moment)...',
      'Preparing the latest products...',
      'Starting up the authentication service...',
      'Almost ready! Thank you for your patience.'
    ];
    let index = 0;
    
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingText(messages[index]);
    }, 10000); 

    return () => clearInterval(interval);
  }, []);

  const isDark = theme === 'dark';

  // Polished Dynamic Tailwind classes 
  const bgClass = isDark ? 'bg-gray-950 text-gray-200' : 'bg-slate-50 text-slate-800';
  const cardBgClass = isDark ? 'bg-gray-900 shadow-2xl border border-gray-800/60' : 'bg-white shadow-xl border border-slate-100';
  const titleClass = isDark ? 'text-gray-100' : 'text-slate-900';
  const textClass = isDark ? 'text-gray-400' : 'text-slate-500';
  const loaderClass = isDark ? 'text-blue-500' : 'text-blue-600';
  const trackClass = isDark ? 'bg-gray-800' : 'bg-slate-200';
  const barClass = isDark ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-blue-600';
  const footnoteClass = isDark ? 'text-gray-500' : 'text-slate-400';

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${bgClass} transition-colors duration-500`}>
      <div className={`flex flex-col items-center space-y-6 max-w-md text-center p-10 rounded-3xl ${cardBgClass} transition-colors duration-500`}>
        <div className="relative w-20 h-20 mb-2">
          <img 
            src="/icon.png" 
            alt="BidBazaar" 
            className="w-full h-full object-contain animate-bounce drop-shadow-xl"
          />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-2 bg-black/10 dark:bg-white/10 rounded-[50%] blur-sm animate-[pulse_1s_ease-in-out_infinite]" />
        </div>
        
        <div className="space-y-2">
          <h1 className={`text-2xl font-semibold tracking-tight ${titleClass}`}>Starting Services</h1>
          <p className={`animate-pulse transition-opacity duration-500 ${textClass}`}>
            {loadingText}
          </p>
        </div>

        <div className={`w-full rounded-full h-1.5 mt-2 overflow-hidden ${trackClass}`}>
          <div 
            className={`h-full rounded-full animate-[progress_15s_ease-in-out_infinite] ${barClass}`} 
            style={{ width: '100%', animation: 'progress 10s ease-in-out infinite alternate' }}
          ></div>
        </div>
        
        <p className={`text-xs mt-2 ${footnoteClass}`}>
          Free tier servers sleep after inactivity. It takes ~50s to wake them up.
        </p>
      </div>
    </div>
  );
};

export default Loading;
