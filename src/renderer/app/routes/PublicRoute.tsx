// src/routes/middleware/PublicRoute.tsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from './routeConstants';
import { selectToken } from '../store/slices/authSlice';
import { getRedirectPath, resetRedirectPath } from '../../app/api/axiosConfig';

export const PublicRoute: React.FC = () => {
  const token = useSelector(selectToken);
  
  if (token) {
    const redirectPath = getRedirectPath();
    
    if (redirectPath && redirectPath !== '/login') {
      resetRedirectPath();
      return <Navigate to={redirectPath} replace />;
    }
    
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  
  return <Outlet />;
};