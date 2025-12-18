import React from 'react';

type TextSize = 'large' | 'regular' | 'small';
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'white';

interface BodyTextProps {
  size?: TextSize;
  color?: TextColor;
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'label';
}

/**
 * BodyText Component
 * 
 * Provides consistent body text styles across the application
 * 
 * Usage:
 * <BodyText>Regular text content</BodyText>
 * <BodyText size="large" color="secondary">Large secondary text</BodyText>
 * <BodyText size="small" as="span">Small inline text</BodyText>
 */
const BodyText: React.FC<BodyTextProps> = ({ 
  size = 'regular',
  color = 'primary',
  children, 
  className = '',
  as: Component = 'p'
}) => {
  const sizeStyles: Record<TextSize, string> = {
    large: 'text-body-lg',
    regular: 'text-body',
    small: 'text-body-sm',
  };

  const colorStyles: Record<TextColor, string> = {
    primary: 'text-neutral-black',
    secondary: 'text-neutral-gray-dark',
    tertiary: 'text-neutral-gray-medium',
    white: 'text-neutral-white',
  };

  return (
    <Component className={`${sizeStyles[size]} ${colorStyles[color]} ${className}`}>
      {children}
    </Component>
  );
};

export default BodyText;