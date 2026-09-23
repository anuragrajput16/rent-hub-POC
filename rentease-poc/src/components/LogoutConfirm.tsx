/** Sign-out confirmation, shared by the top-bar menu and the account page. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

export function LogoutConfirm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await logout();
      onClose();
      navigate('/login', { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Sign out?"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Stay signed in
          </Button>
          <Button onClick={confirm} disabled={busy}>
            {busy ? 'Signing out…' : 'Sign out'}
          </Button>
        </>
      }
    >
      <p className="m-0 text-[14.5px] leading-relaxed">
        You are signed in as <b>{user?.name}</b>. Signing out takes you back to the login screen —
        your listings, bookings and rewards stay exactly as they are.
      </p>
    </Modal>
  );
}
