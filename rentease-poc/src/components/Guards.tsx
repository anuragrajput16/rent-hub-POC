import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext';
import type { Role } from '../types';

/** Unauthenticated → /login. Wrong role → that role's home (BUILD_BRIEF §4). */
export function RequireRole({
  allow,
  children,
}: {
  allow?: Role[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;

  return <>{children}</>;
}
