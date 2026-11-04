import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { Spinner } from "../Components/ui/Spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and save the intended location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin) {
    const isOwnerOrAdmin = user.role === "admin" || user.email?.toLowerCase() === "bvhss20@gmail.com";
    if (!isOwnerOrAdmin) {
      // Redirect to root if the user doesn't have administrative access
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
