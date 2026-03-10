import { useEffect, useRef } from 'react';

export const useAdSense = () => {
  const adRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Wait for the AdSense script to load
    const loadAd = () => {
      if (window.adsbygoogle && adRef.current) {
        try {
          window.adsbygoogle.push({});
            } catch (error) {
      // AdSense error
    }
      }
    };

    // Check if AdSense is already loaded
    if (window.adsbygoogle) {
      loadAd();
    } else {
      // Wait for AdSense to load
      const checkAdSense = window.setInterval(() => {
        if (window.adsbygoogle) {
          loadAd();
          clearInterval(checkAdSense);
        }
      }, 100);

      // Cleanup interval after 10 seconds
      const timeoutId = window.setTimeout(() => {
        clearInterval(checkAdSense);
      }, 10000);

      return () => {
        clearInterval(checkAdSense);
        clearTimeout(timeoutId);
      };
    }
  }, []);

  return adRef;
}; 