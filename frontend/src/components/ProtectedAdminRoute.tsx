import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAdminAuthenticated } = useApp();
  const location = useLocation();

  if (!isAdminAuthenticated) {
    // Redirect unauthenticated citizens/visitors to Administrator Login
    // Save current attempt path in state so user is redirected back upon successful auth
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
