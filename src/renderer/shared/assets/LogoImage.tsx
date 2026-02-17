import { useSelector } from 'react-redux';
import { type RootState } from '../../app/store/store';
import darkThemeLogo from './continousLogoDark.png';
import lightThemeLogo from './continuousLogoLight.png';

interface LogoImageProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LogoImage({ 
  className = '', 
  size = 'md' 
}: LogoImageProps) {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const logo = theme === 'dark' ? darkThemeLogo : lightThemeLogo;
  
  // Size mapping
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-18'
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
      loading="lazy"
      aria-label="Custocare AI Logo"
    />
  );
}