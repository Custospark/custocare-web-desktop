import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store/store';
import heartPlusLogoDark from './heartPlusLogoDark.png';
import heartPlusLogoLight from './heartPlusLogoLight.png';

interface LogoImageProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LogoImage({ 
  className = '', 
  size = 'md' 
}: LogoImageProps) {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const logo = theme === 'dark' ? heartPlusLogoDark : heartPlusLogoLight;
  
  // Size mapping
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };

  return (
    <img
      src={logo}
      alt="Custocare AI"
      className={`
        ${sizeClasses[size]} 
        w-auto 
        cursor-pointer 
        rounded-md 
        p-1 
        transition-all 
        duration-300 
        hover:scale-105 
        hover:opacity-90 
        hover:shadow-sm 
        active:scale-95 
        ${className}
      `}
      title="Custocare AI"
      // Add loading="lazy" for better performance
      loading="lazy"
      // Add aria-label for accessibility
      aria-label="Custocare AI Logo"
      // Optional: Add subtle border that matches theme
      style={{
        border: theme === 'dark' 
          ? '1px solid rgba(255,255,255,0.05)' 
          : '1px solid rgba(0,0,0,0.05)'
      }}
    />
  );
}