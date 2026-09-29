import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * TopLoadingBar (YouTube-style route progress bar)
 * Flashes a sleek tricolor/blue progress bar at the very top of the page on route transition.
 */
export default function TopLoadingBar() {
  const location = useLocation();
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAnimating(true);
    const timer = setTimeout(() => {
      setAnimating(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!animating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none overflow-hidden bg-transparent">
      <div className="h-full bg-gradient-to-r from-[#FF9933] via-[#005696] to-[#138808] top-route-progress" />
    </div>
  );
}
