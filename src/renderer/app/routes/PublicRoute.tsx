// src/routes/middleware/PublicRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from './routeConstants';
import { selectToken } from '../store/slices/authSlice';

export const PublicRoute: React.FC = () => {
  const token = useSelector(selectToken);
  
  if (token) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  
  return <Outlet />;
};