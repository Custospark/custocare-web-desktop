
/**
 * Check if running in development mode
 * @returns {boolean} True if in development
 */
export const isDev = (): boolean => {
  // Check NODE_ENV first (set by cross-env in package.json scripts)
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  
  
  return false;
};

