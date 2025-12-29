import React from 'react';

type CardVariant = 'standard' | 'interactive' | 'elevated';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onClick?: () => void;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

/**
 * Card Component
 * 
 * Container component for content grouping
 * 
 * Usage:
 * <Card>
 *   <h3>Patient Information</h3>
 *   <p>Details here...</p>
 * </Card>
 * 
 * <Card variant="interactive" onClick={handleClick}>
 *   Clickable card content
 * </Card>
 */
const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'standard',
  onClick,
  className = '',
  padding = 'medium'
}) => {
  const isClickable = !!onClick || variant === 'interactive';
  
  const baseStyles = 'bg-neutral-white rounded-lg transition-all duration-200';
  
  const variantStyles: Record<CardVariant, string> = {
    standard: 'shadow-card',
    interactive: 'shadow-card hover:shadow-card-hover cursor-pointer active:scale-[0.98]',
    elevated: 'shadow-card-hover',
  };

  const paddingStyles = {
    none: '',
    small: 'p-16',
    medium: 'p-24',
    large: 'p-32',
  };

  const Component = isClickable ? 'button' : 'div';
  const clickableProps = isClickable ? {
    onClick,
    type: 'button' as const,
    className: `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className} text-left w-full`,
  } : {
    className: `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`,
  };

  return <Component {...clickableProps}>{children}</Component>;
};

export default Card;