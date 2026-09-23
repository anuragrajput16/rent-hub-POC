import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { useAuth, homeFor } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { ErrorNote, Field, inputClass } from '../../components/ui/Bits';
import { Avatar } from '../../components/ui/Chip';
import { useUsers } from '../../api/hooks';

const DEMO_ROLE_LABEL = {
  owner: 'Owner · 9 units at Sunrise Residency',
  renter: 'Renter · touring in Indore',
  guest: 'Guest · shops the marketplace',
} as const;

export default function Login() {
  const { user, login } = useAuth();
  const users = useUsers();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from ?? homeFor(user.role)} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(email);
      navigate(location.state?.from ?? homeFor(u.role), { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Only the three seeded demo accounts get a one-tap button.
  const demos = users.filter((u) => u.id.startsWith('user-'));

  return (
    <AuthLayout title="Sign in" subtitle="Use a demo account below, or the email you registered with.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" hint="Any password works in this proof of concept.">
          <input className={inputClass} type="password" placeholder="••••••••" autoComplete="current-password" />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" block disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-3 text-xs font-semibold text-muted">
        <span className="h-px flex-1 bg-line" />
        or continue as
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex flex-col gap-2">
        {demos.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setEmail(u.email)}
            className="card flex cursor-pointer items-center gap-3 px-3.5 py-3 text-left hover:bg-green-soft/50"
          >
            <Avatar initials={u.avatarInitials} size={36} />
            <span className="min-w-0 flex-1">
              <b className="block text-sm font-semibold">{u.name}</b>
              <span className="block text-[12px] text-muted">{DEMO_ROLE_LABEL[u.role]}</span>
            </span>
            <span className="text-[12.5px] font-semibold text-green">Use</span>
          </button>
        ))}
      </div>

      <p className="mt-7 text-center text-[13.5px] text-muted">
        New here?{' '}
        <Link to="/register" className="font-semibold text-green">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
