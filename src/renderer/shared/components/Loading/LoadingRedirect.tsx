// components/Loading/LoadingRedirect.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSkeleton from './LoadingSkeletons';
import { selectTheme } from '../../../app/store/slices/uiSlice';

interface LoadingRedirectProps {
  to: string;
  replace?: boolean;
  variant?: 'dashboard' | 'table' | 'detail' | 'card' | 'form' | 'list' | 'timeline' | 'minimal' | 'progress' | 'default';
  message?: string;
}

const LoadingRedirect: React.FC<LoadingRedirectProps> = ({ 
  to, 
  replace = false, 
  variant = 'dashboard',
  message = 'Redirecting...'
}) => {
  const navigate = useNavigate();
  const theme = useSelector(selectTheme);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (replace) {
        navigate(to, { replace: true });
      } else {
        navigate(to);
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [navigate, to, replace]);

  return <LoadingSkeleton variant={variant} theme={theme} message={message} />;
};

export default LoadingRedirect;