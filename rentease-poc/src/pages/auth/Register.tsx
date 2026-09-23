import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { useAuth, homeFor } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { ErrorNote, Field, inputClass } from '../../components/ui/Bits';
import { cx } from '../../lib/format';
import type { Role } from '../../types';

const ROLES: Array<{ value: Role; title: string; body: string }> = [
  { value: 'owner', title: 'Owner', body: 'I have a room or flat to rent out.' },
  { value: 'renter', title: 'Renter', body: 'I am looking for a place to live.' },
  { value: 'guest', title: 'Guest', body: 'I just want furniture, décor and services.' },
];

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('renter');
  const [form, setForm] = useState({ name: '', email: '', city: 'Indore' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await register({ ...form, role });
      navigate(homeFor(u.role), { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Pick how you will use RentEase — you can upgrade later.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 p-0 text-[12.5px] font-semibold text-muted">I am a…</legend>
          <div className="flex flex-col gap-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={cx(
                  'flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 transition-colors',
                  role === r.value
                    ? 'border-green bg-green-soft'
                    : 'border-line bg-panel hover:border-green-line',
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="mt-1 h-4 w-4 flex-none accent-[#1E4634]"
                />
                <span>
                  <b className="block text-sm font-semibold">{r.title}</b>
                  <span className="block text-[12.5px] text-muted">{r.body}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Full name">
          <input
            className={inputClass}
            required
            placeholder="Ramesh Kulkarni"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            required
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="City">
          <input
            className={inputClass}
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </Field>

        <p className="m-0 rounded-[10px] bg-green-soft px-3 py-2.5 text-[12.5px] leading-snug text-muted">
          {role === 'owner'
            ? 'Ownership documents are collected here in the real product. In this POC your account is marked verified straight away.'
            : role === 'renter'
              ? 'ID proof is collected here in the real product. In this POC your account is marked verified straight away.'
              : 'Guests can shop and book services right away, and upgrade to owner or renter at any time.'}
        </p>

        {error && <ErrorNote>{error}</ErrorNote>}

        <Button type="submit" block disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-7 text-center text-[13.5px] text-muted">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-green">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
