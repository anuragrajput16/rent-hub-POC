import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { auth } from '../api';
import { useCurrentUser } from '../api/hooks';
import type { Role, User } from '../types';

interface AuthValue {
  user: User | null;
  role: Role | null;
  isAuthed: boolean;
  login: (email: string) => Promise<User>;
  register: (input: { name: string; email: string; role: Role; city: string }) => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => Promise<User>;
  upgrade: (role: Exclude<Role, 'guest'>) => Promise<User>;
  updateProfile: (patch: { name: string; city: string }) => Promise<User>;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();

  const upgrade = useCallback(
    async (role: Exclude<Role, 'guest'>) => {
      if (!user) throw new Error('Sign in first.');
      return auth.upgrade(user.id, role);
    },
    [user],
  );

  const updateProfile = useCallback(
    async (patch: { name: string; city: string }) => {
      if (!user) throw new Error('Sign in first.');
      return auth.updateProfile(user.id, patch);
    },
    [user],
  );

  const value = useMemo<AuthValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthed: !!user,
      login: auth.login,
      register: auth.register,
      logout: auth.logout,
      switchRole: auth.switchRole,
      upgrade,
      updateProfile,
    }),
    [user, upgrade, updateProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}

/** Where each role lands after signing in. */
// eslint-disable-next-line react-refresh/only-export-components
export const homeFor = (role: Role | null) =>
  role === 'owner' ? '/owner' : role === 'renter' ? '/renter' : '/furniture';
