import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function scrollToTop(): void {
  const selectors = [
    'main',
    '[role="main"]',
    '#main-content',
    '.main-content-area',
  ];

  const scrollable = document.scrollingElement
    ?? document.documentElement
    ?? document.body;
  scrollable.scrollTo({ top: 0, left: 0, behavior: 'instant' });

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.scrollTop !== 0) {
      el.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
}

export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const hasPathChanged = previousPathname.current !== pathname;
    previousPathname.current = pathname;

    if (hasPathChanged) {
      const rafId = requestAnimationFrame(() => {
        scrollToTop();
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
