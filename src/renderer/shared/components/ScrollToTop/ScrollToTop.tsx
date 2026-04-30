// src/renderer/shared/components/ScrollToTop/ScrollToTop.tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Automatically scrolls the window to the top when the route changes.
 * Uses native browser smooth scrolling for better performance and reliability.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Only scroll if the path actually changed (skip initial mount)
    const hasPathChanged = previousPathname.current !== pathname;
    previousPathname.current = pathname;

    if (hasPathChanged) {
      // Native smooth scroll - works great, no extra dependencies
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });

      // Also scroll any main content containers if they have scroll
      const mainContent = document.querySelector('main, [role="main"]');
      if (mainContent && mainContent.scrollTop !== 0) {
        mainContent.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;