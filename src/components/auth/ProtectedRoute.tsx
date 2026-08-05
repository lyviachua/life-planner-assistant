import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isConfigured, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400 font-mono text-xs">
        Authenticating Workspace...
      </div>
    );
  }

  // Allow access if user is authenticated OR Guest Mode is active
  const isAuthenticated = user || isGuest;

  // If Supabase is configured and no session exists, redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};