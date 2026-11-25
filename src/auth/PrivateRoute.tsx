import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-600">Loading session...</div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};
