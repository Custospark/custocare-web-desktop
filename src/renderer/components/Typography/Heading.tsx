import React from 'react';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';

interface HeadingProps {
  level: HeadingLevel;
  children: React.ReactNode;
  className?: string;
  as?: HeadingLevel; // Allows semantic override
}

/**
 * Heading Component
 * 
 * Provides consistent heading styles across the application
 * 
 * Usage:
 * <Heading level="h1">Patient Dashboard</Heading>
 * <Heading level="h2" as="h1">Section Title (looks like h2, semantic h1)</Heading>
 */
const Heading: React.FC<HeadingProps> = ({ 
  level, 
  children, 
  className = '', 
  as 
}) => {
  const Component = as || level;
  
  const styles: Record<HeadingLevel, string> = {
    h1: 'text-h1 text-neutral-black font-bold',
    h2: 'text-h2 text-neutral-black font-bold',
    h3: 'text-h3 text-neutral-black font-semibold',
    h4: 'text-h4 text-neutral-black font-semibold',
  };

  return (
    <Component className={`${styles[level]} ${className}`}>
      {children}
    </Component>
  );
};

export default Heading;